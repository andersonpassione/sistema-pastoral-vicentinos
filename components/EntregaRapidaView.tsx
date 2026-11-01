'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  HeartHandshake, 
  History, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Users, 
  Heart, 
  ArrowRight, 
  Check, 
  BadgeCheck, 
  Loader2,
  Printer,
  FileCheck2,
  X,
  Sparkles,
  Ban
} from 'lucide-react';
import { Family, DeliveryRecord, PastoralSettings, checkMonthlyDeliveryLimit, getFamilyStatusLabel } from '@/lib/data';

interface EntregaRapidaViewProps {
  families: Family[];
  todayDeliveries: DeliveryRecord[];
  settings: PastoralSettings;
  onOpenNewFamilyModal: () => void;
  onOpenHistoryModal: () => void;
  onConfirmDelivery: (family: Family, observation: string, scheduleVisit: boolean) => void;
  onViewAllDeliveries: () => void;
  preselectedFamily?: Family | null;
}

export default function EntregaRapidaView({
  families,
  todayDeliveries,
  settings,
  onOpenNewFamilyModal,
  onOpenHistoryModal,
  onConfirmDelivery,
  onViewAllDeliveries,
  preselectedFamily
}: EntregaRapidaViewProps) {
  // Search state: starts completely empty unless a family was preselected
  const [searchQuery, setSearchQuery] = useState(preselectedFamily ? preselectedFamily.cpf : '');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(
    preselectedFamily ? preselectedFamily.id : null
  );

  // Observation state
  const [observation, setObservation] = useState(preselectedFamily?.pastoralNotes || '');
  const [scheduleVisit, setScheduleVisit] = useState(false);

  // Authorization for delivery before minIntervalDays
  const [isExceptionAuthorized, setIsExceptionAuthorized] = useState(false);

  // Delivery submission state
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [lastDeliveredFamily, setLastDeliveredFamily] = useState<Family | null>(null);
  const [lastProtocolNumber, setLastProtocolNumber] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Active beneficiary lookup
  const activeFamily = selectedFamilyId ? families.find((f) => f.id === selectedFamilyId) || null : null;

  // Status check: Promovida and Inativa families cannot receive food baskets
  const isStatusBlocked = activeFamily ? (activeFamily.status === 'promovida' || activeFamily.status === 'inativa') : false;

  // Monthly delivery limit check (Strict: Max 1 basic basket per month per family)
  const monthlyCheck = activeFamily ? checkMonthlyDeliveryLimit(activeFamily, todayDeliveries) : { isBlocked: false };

  // Pastoral minIntervalDays calculation
  const minDays = settings.minIntervalDays || 30;
  const isNeverDelivered = activeFamily ? (
    (activeFamily.lastDeliveryDate && activeFamily.lastDeliveryDate.toLowerCase().includes('nunca')) ||
    (activeFamily.lastDeliveryDate && activeFamily.lastDeliveryDate.toLowerCase().includes('primeira')) ||
    (activeFamily.lastDeliveryDaysAgo >= 900)
  ) : false;
  const daysAgo = activeFamily ? (isNeverDelivered ? 999 : activeFamily.lastDeliveryDaysAgo) : 0;
  const isIntervalMet = !activeFamily || isNeverDelivered || daysAgo >= minDays;
  const daysRemaining = isNeverDelivered ? 0 : Math.max(0, minDays - daysAgo);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const cleanCpf = query.replace(/[.\-\s]/g, '');
    const found = families.find(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.cpf.replace(/[.\-\s]/g, '').includes(cleanCpf)
    );

    if (found) {
      setSelectedFamilyId(found.id);
      setDeliveryStatus('idle');
    } else {
      alert(`Nenhuma família encontrada para "${searchQuery}". Você pode cadastrar uma nova família pelo botão "+ Novo Cadastro".`);
    }
  };

  const handleRecordDelivery = () => {
    if (!activeFamily) return;

    // Regra de negócio: Famílias com status "Promovida" e "Inativa" não podem receber cestas básicas
    if (isStatusBlocked) {
      alert(`Entrega bloqueada: Famílias com status "${getFamilyStatusLabel(activeFamily.status)}" não podem receber cestas básicas no dia da distribuição mensal. O cadastro permanece no sistema exclusivamente para fins de histórico estatístico.`);
      return;
    }

    // Strict monthly limit: Never allow more than one food basket per calendar month
    if (monthlyCheck.isBlocked) {
      alert(`Entrega bloqueada: ${monthlyCheck.reason || 'Esta família já recebeu a cesta básica referente a este mês. Não é permitida mais de uma entrega de cesta básica no mês.'}`);
      return;
    }

    if (!isIntervalMet && !isExceptionAuthorized) {
      alert(`Entrega bloqueada: O intervalo mínimo geral de ${minDays} dias ainda não foi cumprido (faltam ${daysRemaining} dias). Para liberar em caso de urgência, marque a autorização excepcional.`);
      return;
    }

    setDeliveryStatus('saving');

    setTimeout(() => {
      onConfirmDelivery(activeFamily, observation, scheduleVisit);
      setLastDeliveredFamily(activeFamily);
      const protocol = `#ENT-202610-0${todayDeliveries.length + 1}`;
      setLastProtocolNumber(protocol);
      setDeliveryStatus('success');
    }, 800);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedFamilyId(null);
    setDeliveryStatus('idle');
    setIsExceptionAuthorized(false);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="px-4 sm:px-6 lg:px-10 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto w-full">
        
        {/* Top Intro & Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#9cf5c5] text-[#00603e] shadow-sm">
                <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <span className="text-[11px] uppercase tracking-widest text-[#00603e] font-bold truncate max-w-md" title={settings.parishName}>
                {settings.parishName} • Pastoral dos Vicentinos
              </span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-[#111c2c] tracking-tight leading-tight">
              Entrega Rápida de Cestas
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#3f4942] max-w-2xl">
              Atendimento acolhedor e entrega de benefícios alimentares conforme as diretrizes e intervalo de {minDays} dias da paróquia.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onOpenHistoryModal}
              className="inline-flex items-center justify-center gap-2 px-4 h-11 sm:h-12 rounded-xl bg-[#f0f3ff] text-[#455f88] font-bold text-[13px] sm:text-[14px] hover:bg-[#e7eeff] border border-[#d8e3fa]/80 transition-colors shadow-sm min-h-[44px]"
            >
              <History className="w-4 h-4" />
              <span>Consultar Histórico</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewFamilyModal}
              className="inline-flex items-center justify-center gap-2 px-5 h-11 sm:h-12 rounded-xl bg-[#1b7a53] text-white font-bold text-[13px] sm:text-[14px] shadow-md hover:bg-[#00603e] transition-all min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Cadastro de Família</span>
            </button>
          </div>
        </div>

        {/* Central Fast Search Box */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff]">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-[#3f4942]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por CPF ou Nome da família..."
                className="w-full h-12 sm:h-14 pl-11 sm:pl-12 pr-16 sm:pr-20 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] sm:text-[15px] placeholder:text-[#6f7a72] focus:outline-none focus:ring-2 focus:ring-[#1b7a53] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#3f4942] hover:text-[#111c2c] px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#dee8ff] hover:bg-[#d8e3fa] transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 h-12 sm:h-14 rounded-xl bg-[#00603e] text-white font-bold text-[14px] hover:bg-[#1b7a53] transition-colors shadow-sm shrink-0 min-h-[44px]"
            >
              <Search className="w-4 h-4" />
              <span>Pesquisar</span>
            </button>
          </form>

          {/* Quick family selectors for fast access */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#dee8ff]/80 overflow-x-auto text-[12px] pb-1">
            <span className="text-[#3f4942] font-semibold shrink-0">Sugestões rápidas:</span>
            {families.map((f) => {
              const isBlockedStatus = f.status === 'promovida' || f.status === 'inativa';
              const isMet = f.lastDeliveryDaysAgo === 0 || f.lastDeliveryDaysAgo >= minDays;
              const remaining = Math.max(0, minDays - f.lastDeliveryDaysAgo);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedFamilyId(f.id);
                    setSearchQuery(f.cpf);
                    setDeliveryStatus('idle');
                    setIsExceptionAuthorized(false);
                    setObservation(f.pastoralNotes || '');
                  }}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0 flex items-center gap-1.5 ${
                    selectedFamilyId === f.id
                      ? isBlockedStatus
                        ? 'bg-[#5e6066] text-white font-bold'
                        : 'bg-[#1b7a53] text-white font-bold'
                      : isBlockedStatus
                      ? 'bg-[#e2e2e9] text-[#5e6066] hover:bg-[#d6d6de]'
                      : isMet
                      ? 'bg-[#f0f3ff] text-[#00603e] hover:bg-[#dee8ff]'
                      : 'bg-[#fff4eb] text-[#814400] hover:bg-[#ffdcc3]'
                  }`}
                >
                  <span>{f.name.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-80">
                    {isBlockedStatus ? `(${getFamilyStatusLabel(f.status)})` : isMet ? '(Apto)' : `(${remaining}d rest.)`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Content Grid: Beneficiary Card & Fast Deliveries Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Active Beneficiary Eligibility & Dispatch Panel (7 cols) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            {!activeFamily ? (
              /* Clean Empty State when no family is searched / selected yet */
              <article className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#f0f3ff] text-[#00603e] flex items-center justify-center shadow-inner">
                  <Search className="w-8 h-8" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-[18px] sm:text-[20px] font-bold text-[#111c2c]">
                    Pronto para Iniciar o Atendimento
                  </h3>
                  <p className="text-[13px] sm:text-[14px] text-[#3f4942] mt-1.5 leading-relaxed">
                    Pesquise uma família pelo <strong>CPF</strong>, <strong>NIS</strong> ou <strong>Nome</strong> no campo de busca acima ou clique em uma das sugestões para conferir a regra de <strong>{minDays} dias de intervalo</strong> e registrar a entrega.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onOpenNewFamilyModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00603e] text-white font-bold text-[13px] hover:bg-[#1b7a53] transition-colors shadow-sm min-h-[44px]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Cadastrar Nova Família</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenHistoryModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f0f3ff] text-[#455f88] font-bold text-[13px] hover:bg-[#dee8ff] border border-[#d8e3fa] transition-colors min-h-[44px]"
                  >
                    <History className="w-4 h-4" />
                    <span>Consultar Histórico</span>
                  </button>
                </div>
              </article>
            ) : (
              <article className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] overflow-hidden relative">
                {/* Status accent indicator stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${isStatusBlocked ? 'bg-[#76777d]' : monthlyCheck.isBlocked ? 'bg-[#ba1a1a]' : isIntervalMet ? 'bg-[#00603e]' : 'bg-[#814400]'}`} />

                <div className="p-4 sm:p-7 pl-6 sm:pl-9 flex flex-col gap-5 sm:gap-6">
                  
                  {/* Card Header: Title & Eligibility Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-[#dee8ff] shrink-0 border border-[#9cf5c5]">
                        {activeFamily.avatarUrl ? (
                          <Image
                            src={activeFamily.avatarUrl}
                            alt={activeFamily.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[#00603e] text-[16px] sm:text-[18px]">
                            {activeFamily.initials}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="text-[18px] sm:text-[20px] text-[#111c2c] font-bold truncate">
                            {activeFamily.name}
                          </h2>
                          <span title="Cadastro Localizado">
                            <BadgeCheck className="w-5 h-5 text-[#00603e] shrink-0" />
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${
                            activeFamily.status === 'em_acompanhamento'
                              ? 'bg-[#9cf5c5] text-[#005234]'
                              : activeFamily.status === 'promovida'
                              ? 'bg-[#d6e3ff] text-[#004282]'
                              : 'bg-[#e2e2e9] text-[#45474c]'
                          }`}>
                            {activeFamily.status === 'em_acompanhamento' && <span className="w-1.5 h-1.5 rounded-full bg-[#00603e]" />}
                            {activeFamily.status === 'promovida' && <Sparkles className="w-3 h-3 text-[#004282]" />}
                            {activeFamily.status === 'inativa' && <span className="w-1.5 h-1.5 rounded-full bg-[#76777d]" />}
                            {getFamilyStatusLabel(activeFamily.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#3f4942] text-[12px] sm:text-[13px] flex-wrap">
                          <span className="font-bold text-[#111c2c]">CPF:</span> {activeFamily.cpf}
                          <span className="text-[#bec9c0] hidden xs:inline">•</span>
                          <span className="font-bold text-[#111c2c]">Bairro:</span> {activeFamily.bairro}
                        </div>
                      </div>
                    </div>

                    {/* Status badge: Strictly checks status block first, then monthly limit, then minIntervalDays */}
                    {isStatusBlocked ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-[#f4f4f7] text-[#ba1a1a] self-start sm:self-center shadow-sm shrink-0 border border-[#ffdad6]">
                        <Ban className="w-3.5 h-3.5 text-[#ba1a1a]" />
                        <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                          RETIRADA BLOQUEADA ({activeFamily.status === 'promovida' ? 'PROMOVIDA' : 'INATIVA'})
                        </span>
                      </div>
                    ) : monthlyCheck.isBlocked ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-[#ffdad6] text-[#93000a] self-start sm:self-center shadow-sm shrink-0 border border-[#ffb4ab]">
                        <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
                        <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                          CESTA DO MÊS JÁ ENTREGUE (1/MÊS)
                        </span>
                      </div>
                    ) : isIntervalMet ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-[#9cf5c5] text-[#002112] self-start sm:self-center shadow-sm shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#00603e]" />
                        <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                          APTO PARA RETIRADA
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-[#ffdcc3] text-[#814400] self-start sm:self-center shadow-sm shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#814400]" />
                        <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                          AGUARDANDO INTERVALO ({daysRemaining} {daysRemaining === 1 ? 'DIA' : 'DIAS'})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Block, Monthly Limit & Interval Eligibility Check Banner */}
                  {isStatusBlocked ? (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-[#fff0ef] border border-[#ffb4ab] flex flex-col gap-2">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[13px] sm:text-[14px] text-[#ba1a1a] font-bold">
                            Distribuição Bloqueada: Família com status &quot;{getFamilyStatusLabel(activeFamily.status)}&quot;
                          </span>
                          <p className="text-[11px] sm:text-[12px] text-[#3f4942] mt-0.5 leading-relaxed">
                            Famílias com status <strong>&quot;Promovida&quot;</strong> ou <strong>&quot;Inativa&quot;</strong> não podem receber cestas básicas no dia da distribuição mensal, permanecendo cadastradas exclusivamente para fins de histórico estatístico e documentação pastoral.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : monthlyCheck.isBlocked ? (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-[#fff0ef] border border-[#ffb4ab] flex flex-col gap-2.5">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[13px] sm:text-[14px] text-[#ba1a1a] font-bold">
                            Limite Mensal Atingido: Não é permitida mais de 1 cesta básica no mês
                          </span>
                          <p className="text-[11px] sm:text-[12px] text-[#3f4942] mt-0.5 leading-relaxed">
                            {monthlyCheck.reason || 'Esta família já recebeu a cesta básica referente a este mês.'} Em conformidade com os estatutos e diretrizes da <strong>{settings.parishName}</strong>, cada família cadastrada tem direito a <strong>uma única cesta básica por mês</strong> civil para garantir a justa partilha alimentar. A próxima retirada estará disponível a partir do início do próximo mês.
                          </p>
                          {monthlyCheck.dateFormatted && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[11px] font-semibold text-[#ba1a1a] bg-white px-2.5 py-0.5 rounded-md border border-[#ffdad6]">
                                Retirada do mês: {monthlyCheck.dateFormatted}
                              </span>
                              {monthlyCheck.protocolNumber && (
                                <span className="text-[11px] font-mono text-[#455f88] bg-white px-2.5 py-0.5 rounded-md border border-[#d8e3fa]">
                                  Protocolo: {monthlyCheck.protocolNumber}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : isIntervalMet ? (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#00603e] shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-[12px] sm:text-[13px] text-[#111c2c] font-bold">
                          {daysAgo > 0 
                            ? `Última retirada há ${daysAgo} dias (${activeFamily.lastDeliveryDate})` 
                            : 'Primeiro atendimento neste núcleo paroquial'}
                        </span>
                        <p className="text-[11px] sm:text-[12px] text-[#3f4942] mt-0.5">
                          Intervalo mínimo paroquial de {minDays} dias cumprido e sem retirada no mês atual. Apto para entrega regular.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-[#fff4eb] border border-[#ffdcc3] flex flex-col gap-2.5">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#814400] shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[12px] sm:text-[13px] text-[#814400] font-bold">
                            Intervalo Mínimo Não Cumprido: Última retirada há {daysAgo} {daysAgo === 1 ? 'dia' : 'dias'}
                          </span>
                          <p className="text-[11px] sm:text-[12px] text-[#3f4942] mt-0.5">
                            O parâmetro geral da pastoral (<strong>{settings.parishName}</strong>) determina no mínimo <strong>{minDays} dias</strong> entre retiradas regulares. Faltam <strong>{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</strong> para a liberação programada.
                          </p>
                        </div>
                      </div>

                      {/* Coordinator / Emergency override toggle */}
                      <div className="pt-2 border-t border-[#ffdcc3] flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="exceptionAuthCheck"
                          checked={isExceptionAuthorized}
                          onChange={(e) => setIsExceptionAuthorized(e.target.checked)}
                          className="w-5 h-5 rounded text-[#814400] accent-[#814400] cursor-pointer mt-0.5 shrink-0"
                        />
                        <label htmlFor="exceptionAuthCheck" className="cursor-pointer text-[12px]">
                          <span className="font-bold text-[#814400] block">
                            Autorizar liberação excepcional / emergencial de intervalo
                          </span>
                          <span className="text-[#3f4942] text-[11px] block mt-0.5">
                            Marque se houver autorização da coordenação para atendimento de urgência alimentar antes dos {minDays} dias.
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Household Details Mosaic */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[#3f4942]">
                      <Users className="w-4 h-4 text-[#00603e]" />
                      <span className="text-[11px] uppercase font-bold tracking-wider">
                        Composição Familiar
                      </span>
                    </div>
                    <span className="text-[16px] sm:text-[18px] text-[#111c2c] font-bold">
                      {activeFamily.dependents.length} Dependentes Cadastrados
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-[12px] text-[#3f4942] mt-1">
                      <span className="px-2 py-0.5 rounded bg-[#dee8ff] text-[#111c2c] font-bold">
                        {activeFamily.dependents.filter((d) => d.age < 12).length || 2} Crianças
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#dee8ff] text-[#111c2c] font-bold">
                        {activeFamily.dependents.filter((d) => d.age >= 60).length || 1} Idoso
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#dee8ff] text-[#111c2c] font-bold">
                        {activeFamily.dependents.filter((d) => d.age >= 12 && d.age < 60).length || 1} Adulto
                      </span>
                    </div>
                  </div>

                  {/* Pastoral Observation & Home Visit Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] sm:text-[13px] text-[#111c2c] font-bold flex items-center justify-between">
                      <span>Observação Voluntária / Visita Pastoral</span>
                      <span className="text-[11px] sm:text-[12px] text-[#3f4942] font-normal">Opcional</span>
                    </label>
                    <textarea
                      rows={3}
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      placeholder="Ex.: Família acolhida fraternalmente; solicitou apoio médico complementar..."
                      className="w-full p-3 sm:p-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[13px] placeholder:text-[#6f7a72] focus:outline-none focus:ring-2 focus:ring-[#1b7a53] resize-none"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer text-[#111c2c] min-h-[36px]">
                        <input
                          type="checkbox"
                          checked={scheduleVisit}
                          onChange={(e) => setScheduleVisit(e.target.checked)}
                          className="w-5 h-5 rounded text-[#00603e] focus:ring-[#00603e] accent-[#00603e] cursor-pointer"
                        />
                        <span className="text-[13px] font-medium">
                          Agendar visita fraterna dos Vicentinos
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Main Confirmation Action Button */}
                  <div className="pt-2 flex flex-col gap-2">
                    {isStatusBlocked ? (
                      /* Strictly blocked button when status is Promovida or Inativa */
                      <button
                        type="button"
                        disabled
                        className="w-full h-12 sm:h-14 rounded-xl font-bold text-[13px] sm:text-[15px] flex items-center justify-center gap-2.5 bg-[#fce8e6] text-[#ba1a1a] cursor-not-allowed border border-[#ffdad6] shadow-none"
                      >
                        <Lock className="w-5 h-5 text-[#ba1a1a]" />
                        <span>Entrega Bloqueada: Família {getFamilyStatusLabel(activeFamily.status)} (Apenas Histórico Estatístico)</span>
                      </button>
                    ) : monthlyCheck.isBlocked ? (
                      /* Strictly blocked button when monthly limit is reached - absolute rule */
                      <button
                        type="button"
                        disabled
                        className="w-full h-12 sm:h-14 rounded-xl font-bold text-[13px] sm:text-[15px] flex items-center justify-center gap-2.5 bg-[#fce8e6] text-[#ba1a1a] cursor-not-allowed border border-[#ffdad6] shadow-none"
                      >
                        <Lock className="w-5 h-5 text-[#ba1a1a]" />
                        <span>Entrega Bloqueada: Limite de 1 cesta básica no mês já atingido</span>
                      </button>
                    ) : !isIntervalMet && !isExceptionAuthorized ? (
                      /* Blocked button when interval is not met and no override */
                      <button
                        type="button"
                        disabled
                        className="w-full h-12 sm:h-14 rounded-xl font-bold text-[14px] sm:text-[16px] flex items-center justify-center gap-2.5 bg-[#e5e9f2] text-[#6f7a72] cursor-not-allowed border border-[#d8e3fa]"
                      >
                        <Lock className="w-5 h-5" />
                        <span>Entrega Bloqueada pelo Intervalo ({daysRemaining} dias restantes)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRecordDelivery}
                        disabled={deliveryStatus === 'saving'}
                        className={`w-full h-12 sm:h-14 rounded-xl font-bold text-[15px] sm:text-[17px] flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all min-h-[48px] ${
                          deliveryStatus === 'saving'
                            ? 'bg-[#1b7a53] text-white opacity-85 cursor-wait'
                            : deliveryStatus === 'success'
                            ? 'bg-[#00603e] hover:bg-[#1b7a53] text-white'
                            : !isIntervalMet && isExceptionAuthorized
                            ? 'bg-[#814400] hover:bg-[#683700] text-white'
                            : 'bg-[#1b7a53] hover:bg-[#00603e] text-white'
                        }`}
                      >
                        {deliveryStatus === 'saving' ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Gravando Entrega...</span>
                          </>
                        ) : deliveryStatus === 'success' ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Entrega Registrada com Sucesso!</span>
                          </>
                        ) : !isIntervalMet && isExceptionAuthorized ? (
                          <>
                            <AlertTriangle className="w-5 h-5" />
                            <span>Confirmar Entrega em Caráter Excepcional</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Confirmar Entrega da Cesta Básica</span>
                          </>
                        )}
                      </button>
                    )}

                    {deliveryStatus === 'success' && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-1">
                        <span className="text-[12px] text-[#00603e] font-semibold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Comprovante {lastProtocolNumber || '#ENT-202610-019'} gerado
                        </span>
                        <button
                          onClick={() => setShowReceiptModal(true)}
                          className="text-[12px] text-[#455f88] font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
                        >
                          <Printer className="w-3.5 h-3.5" /> Visualizar / Imprimir Comprovante
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </article>
            )}
          </section>

          {/* Right Column: Deliveries Today Log & Volunteer Guidance (5 cols) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Today's Activity Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex flex-col">
                  <h3 className="text-[16px] sm:text-[18px] text-[#111c2c] font-bold">
                    Entregas Realizadas Hoje
                  </h3>
                  <span className="text-[12px] text-[#3f4942]">
                    Atendimentos do plantão em {settings.parishName}
                  </span>
                </div>
                <span className="px-2.5 sm:px-3 py-1 rounded-full bg-[#dee8ff] text-[#111c2c] text-[11px] sm:text-[12px] font-bold">
                  {todayDeliveries.length} Atendidas
                </span>
              </div>

              {/* Deliveries Today List */}
              <div className="flex flex-col gap-2 sm:gap-2.5">
                {todayDeliveries.slice(0, 4).map((del) => (
                  <div
                    key={del.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa]/70 flex items-center justify-between gap-3 hover:bg-[#e7eeff] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#9cf5c5] text-[#00603e] flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] text-[#111c2c] font-bold truncate">
                          {del.familyName}
                        </span>
                        <span className="text-[11px] text-[#3f4942] truncate">
                          {del.timeFormatted} • Cesta Básica
                        </span>
                      </div>
                    </div>
                    <span className="px-2 sm:px-2.5 py-1 rounded-md bg-[#9cf5c5] text-[#005234] text-[10px] sm:text-[11px] font-bold shrink-0">
                      Concluído
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={onViewAllDeliveries}
                  className="w-full py-2.5 rounded-xl text-[#00603e] text-[13px] font-bold hover:bg-[#f0f3ff] transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <span>Ver todas as {todayDeliveries.length} entregas de hoje</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pastoral Guidance Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[#00603e]">
                <Heart className="w-5 h-5 fill-[#9cf5c5]" />
                <span className="text-[15px] sm:text-[16px] font-bold">
                  Orientação Pastoral ({settings.parishName})
                </span>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#3f4942] italic leading-relaxed">
                “Mais do que alimentos, levamos dignidade, carinho e presença fraterna a cada irmão que bate à porta.”
              </p>
              <div className="pt-2 text-[11px] text-[#6f7a72] border-t border-[#dee8ff]">
                Intervalo regulamentar configurado: <strong>{minDays} dias</strong>. Respeite as orientações para acolhimento justo e transparente.
              </div>
            </div>

          </section>

        </div>
      </div>

      {/* Printable Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-[#263142]/40 backdrop-blur-sm" onClick={() => setShowReceiptModal(false)} />
          <div className="relative bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#dee8ff]">
              <div className="flex items-center gap-2 text-[#00603e]">
                <FileCheck2 className="w-5 h-5" />
                <span className="font-bold text-[15px]">Recibo de Retirada Paroquial</span>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)} 
                className="p-1 rounded-lg text-[#3f4942] hover:bg-[#f0f3ff]"
                aria-label="Fechar comprovante"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#f0f3ff] p-4 rounded-xl border border-[#d8e3fa] text-[12px] space-y-1.5 font-mono">
              <div className="text-center font-bold text-[#00603e] text-[13px]">PASTORAL DOS VICENTINOS</div>
              <div className="text-center text-[#3f4942] text-[11px] font-bold uppercase">{settings.parishName}</div>
              <div className="border-b border-dashed border-[#a8b8d0] my-2" />
              <div className="flex justify-between">
                <span>Protocolo:</span>
                <span className="font-bold">{lastProtocolNumber || '#ENT-202610-019'}</span>
              </div>
              <div className="flex justify-between">
                <span>Data/Hora:</span>
                <span>{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Beneficiária:</span>
                <span className="font-bold">{lastDeliveredFamily?.name || activeFamily?.name || 'Beneficiária'}</span>
              </div>
              <div className="flex justify-between">
                <span>CPF:</span>
                <span>{lastDeliveredFamily?.cpf || activeFamily?.cpf || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span>Benefício Fornecido:</span>
                <span className="font-bold">Cesta Básica</span>
              </div>
              <div className="border-b border-dashed border-[#a8b8d0] my-2" />
              <div className="pt-2 text-center text-[#3f4942] text-[11px] italic">
                Declaro ter recebido os gêneros alimentícios acima discriminados em perfeito estado.
              </div>
              <div className="pt-6 border-b border-[#3f4942] w-48 mx-auto" />
              <div className="text-center text-[10px] text-[#3f4942] pt-1">Assinatura do Responsável Legal</div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-[13px] font-bold text-[#3f4942] hover:bg-[#f0f3ff] rounded-xl"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 text-[13px] font-bold bg-[#00603e] text-white rounded-xl hover:bg-[#1b7a53] flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
