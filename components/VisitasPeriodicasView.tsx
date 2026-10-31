'use client';

import React, { useState, useMemo } from 'react';
import { 
  HeartHandshake, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Home, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  FolderOpen,
  Sparkles,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { PeriodicVisit, Family, PeriodicVisitType } from '@/lib/data';

interface VisitasPeriodicasViewProps {
  visits: PeriodicVisit[];
  families: Family[];
  onOpenRegisterModal: () => void;
  onOpenProntuario: (family: Family) => void;
  onSelectFamilyForDelivery: (family: Family) => void;
}

export default function VisitasPeriodicasView({
  visits,
  families,
  onOpenRegisterModal,
  onOpenProntuario,
  onSelectFamilyForDelivery
}: VisitasPeriodicasViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [selectedVisitForDetails, setSelectedVisitForDetails] = useState<PeriodicVisit | null>(null);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = visits.length;
    
    // Visitas neste mês corrente
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const thisMonth = visits.filter((v) => {
      const d = new Date(v.date);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      return true;
    }).length;

    // Unique families visited
    const uniqueFamiliesCount = new Set(visits.map((v) => v.familyId)).size;

    // Próxima visita em 15 dias ou emergencial
    const priorityAttention = visits.filter(
      (v) => v.visitType === 'emergencial' || v.nextVisitRecommendation === '15 dias' || v.housingConditions === 'Precária' || v.housingConditions === 'Risco Iminente'
    ).length;

    return { total, thisMonth, uniqueFamiliesCount, priorityAttention };
  }, [visits]);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = v.familyName.toLowerCase().includes(term);
        const matchesCpf = v.familyCpf?.toLowerCase().includes(term);
        const matchesProtocol = v.protocolNumber.toLowerCase().includes(term);
        const matchesVisitors = v.visitors.toLowerCase().includes(term);
        const matchesBairro = v.familyBairro?.toLowerCase().includes(term);
        if (!matchesName && !matchesCpf && !matchesProtocol && !matchesVisitors && !matchesBairro) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && v.visitType !== typeFilter) {
        return false;
      }

      // Housing condition filter
      if (conditionFilter !== 'all' && v.housingConditions !== conditionFilter) {
        return false;
      }

      return true;
    });
  }, [visits, searchTerm, typeFilter, conditionFilter]);

  const handlePrintVisit = (visit: PeriodicVisit) => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Actions Header */}
      <div className="px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#9cf5c5] text-[#005234]">
                Pastoral Vicentina
              </span>
              <span className="text-[12px] text-[#3f4942]">Acompanhamento Domiciliar</span>
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-black text-[#111c2c] tracking-tight mt-1">
              Visitas Periódicas Realizadas
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#3f4942] mt-0.5">
              Registro histórico, pareceres pastorais e acolhimento presencial das famílias assistidas.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenRegisterModal}
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#00603e] text-white font-bold text-[13px] sm:text-[14px] hover:bg-[#1b7a53] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar Nova Visita</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] text-[#3f4942] uppercase font-bold tracking-wider block">
                Total de Visitas
              </span>
              <span className="text-[22px] sm:text-[28px] text-[#111c2c] font-black mt-0.5 block">
                {stats.total}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#00603e] font-semibold">Histórico Geral</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#f0f3ff] flex items-center justify-center text-[#00603e] shrink-0">
              <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] text-[#3f4942] uppercase font-bold tracking-wider block">
                Visitas Este Mês
              </span>
              <span className="text-[22px] sm:text-[28px] text-[#00603e] font-black mt-0.5 block">
                {stats.thisMonth}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#00603e] font-semibold">Ciclo Atual</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#9cf5c5]/50 flex items-center justify-center text-[#005234] shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] text-[#3f4942] uppercase font-bold tracking-wider block">
                Famílias Visitadas
              </span>
              <span className="text-[22px] sm:text-[28px] text-[#004282] font-black mt-0.5 block">
                {stats.uniqueFamiliesCount}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#004282] font-semibold">Acompanhadas</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#d6e3ff] flex items-center justify-center text-[#004282] shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] text-[#3f4942] uppercase font-bold tracking-wider block">
                Atenção Prioritária
              </span>
              <span className="text-[22px] sm:text-[28px] text-[#a45800] font-black mt-0.5 block">
                {stats.priorityAttention}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#a45800] font-semibold">Saúde / Risco</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#ffeed4] flex items-center justify-center text-[#a45800] shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 sm:px-6 lg:px-10">
        <div className="p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#3f4942] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por família, CPF, protocolo, visitador ou bairro..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] placeholder:text-[#6f7a72] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00603e]"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            {/* Filter: Tipo de Visita */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto h-11 px-3.5 pr-8 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00603e]"
              >
                <option value="all">Tipo: Todas as Visitas</option>
                <option value="rotina">Rotina Periódica</option>
                <option value="acolhimento">Acolhimento Inicial</option>
                <option value="saude">Saúde & Cuidados</option>
                <option value="reavaliacao">Reavaliação Socioeconômica</option>
                <option value="emergencial">Visita Emergencial</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#3f4942] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter: Condições da Moradia */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="w-full sm:w-auto h-11 px-3.5 pr-8 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00603e]"
              >
                <option value="all">Moradia: Todas</option>
                <option value="Boa">Boa</option>
                <option value="Regular">Regular</option>
                <option value="Precária">Precária</option>
                <option value="Risco Iminente">Risco Iminente</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#3f4942] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Visits List */}
      <div className="px-4 sm:px-6 lg:px-10">
        {filteredVisits.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-[#dee8ff]">
            <div className="w-16 h-16 rounded-full bg-[#f0f3ff] text-[#00603e] flex items-center justify-center mx-auto mb-3">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h3 className="text-[17px] font-bold text-[#111c2c]">Nenhuma visita periódica encontrada</h3>
            <p className="text-[13px] text-[#3f4942] max-w-md mx-auto mt-1 mb-4">
              Não encontramos registros com os filtros atuais. Você pode registrar uma nova visita domiciliar pastoral agora.
            </p>
            <button
              type="button"
              onClick={onOpenRegisterModal}
              className="px-4 py-2.5 rounded-xl bg-[#00603e] text-white font-bold text-[13px] hover:bg-[#1b7a53] inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Registrar Visita
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVisits.map((visit) => {
              const matchedFamily = families.find((f) => f.id === visit.familyId);

              // Colors for visit type
              const typeBadge = {
                rotina: 'bg-[#9cf5c5] text-[#005234] border-[#00603e]/30',
                acolhimento: 'bg-[#d6e3ff] text-[#004282] border-[#004282]/30',
                saude: 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/30',
                reavaliacao: 'bg-[#e2e2e9] text-[#45474c] border-[#76777d]/30',
                emergencial: 'bg-[#ffeed4] text-[#a45800] border-[#a45800]/30'
              }[visit.visitType] || 'bg-[#f0f3ff] text-[#111c2c] border-[#dee8ff]';

              // Colors for housing conditions
              const housingBadge = {
                Boa: 'bg-[#9cf5c5]/40 text-[#005234]',
                Regular: 'bg-[#d6e3ff]/40 text-[#004282]',
                Precária: 'bg-[#ffeed4] text-[#a45800]',
                'Risco Iminente': 'bg-[#ffdad6] text-[#ba1a1a]'
              }[visit.housingConditions];

              return (
                <div
                  key={visit.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#dee8ff] shadow-[0_1px_8px_rgba(0,0,0,0.03)] hover:border-[#b4c8f0] transition-all"
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-[#f0f3ff]">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#f0f3ff] text-[#004282] border border-[#d8e3fa]">
                        {visit.protocolNumber}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${typeBadge}`}>
                        {visit.visitTypeLabel}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${housingBadge}`}>
                        Moradia: {visit.housingConditions}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[12px] text-[#3f4942]">
                      <span className="flex items-center gap-1 font-semibold text-[#111c2c]">
                        <Calendar className="w-3.5 h-3.5 text-[#00603e]" />
                        {visit.dateFormatted}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#00603e]" />
                        {visit.timeFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="mt-3.5 grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Family & Visitors */}
                    <div className="md:col-span-4 space-y-2">
                      <div>
                        <span className="text-[10px] text-[#3f4942] uppercase font-bold tracking-wider block">
                          Família Visitada
                        </span>
                        <h4 className="text-[16px] font-bold text-[#111c2c] leading-tight">
                          {visit.familyName}
                        </h4>
                        {visit.familyCpf && (
                          <span className="text-[12px] text-[#3f4942] font-mono block">
                            CPF: {visit.familyCpf}
                          </span>
                        )}
                        {visit.familyAddress && (
                          <span className="text-[12px] text-[#3f4942] flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#00603e] shrink-0" />
                            {visit.familyAddress} ({visit.familyBairro || 'Bairro'})
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#f0f3ff]">
                        <span className="text-[10px] text-[#3f4942] uppercase font-bold tracking-wider block">
                          Visitadores / Voluntários
                        </span>
                        <span className="text-[12px] font-semibold text-[#004282] flex items-center gap-1.5 mt-0.5">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          {visit.visitors}
                        </span>
                      </div>
                    </div>

                    {/* Summary & Observations */}
                    <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] text-[#3f4942] uppercase font-bold tracking-wider block mb-1">
                          Parecer e Relato Pastoral
                        </span>
                        <div className="p-3.5 rounded-xl bg-[#f9f9ff] border border-[#dee8ff] text-[13px] text-[#2b3531] leading-relaxed italic">
                          &quot;{visit.summary}&quot;
                        </div>
                      </div>

                      {/* Needs & Recommendation */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-[#3f4942]">Demandas:</span>
                          {visit.detectedNeeds.map((need, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#f0f3ff] text-[#004282] border border-[#dee8ff]"
                            >
                              {need}
                            </span>
                          ))}
                        </div>

                        {visit.nextVisitRecommendation && (
                          <div className="text-[11px] font-bold text-[#00603e] bg-[#9cf5c5]/40 px-2.5 py-1 rounded-lg shrink-0">
                            Próxima Visita: {visit.nextVisitRecommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-[#f0f3ff] flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-[#3f4942]">
                      Registrado por: <strong>{visit.registeredBy || visit.visitors}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {matchedFamily && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenProntuario(matchedFamily)}
                            className="px-3 py-1.5 rounded-lg bg-[#f0f3ff] text-[#004282] hover:bg-[#d6e3ff] text-[12px] font-bold flex items-center gap-1.5 min-h-[36px]"
                          >
                            <FolderOpen className="w-3.5 h-3.5" /> Prontuário Social
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectFamilyForDelivery(matchedFamily)}
                            className="px-3 py-1.5 rounded-lg bg-[#9cf5c5]/60 text-[#005234] hover:bg-[#9cf5c5] text-[12px] font-bold flex items-center gap-1.5 min-h-[36px]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Entregar Cesta
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePrintVisit(visit)}
                        className="p-2 rounded-lg hover:bg-[#f0f3ff] text-[#3f4942] min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Imprimir Registro de Visita"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
