'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  HeartHandshake, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Home, 
  AlertCircle,
  FileText,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { 
  Family, 
  PeriodicVisit, 
  PeriodicVisitType, 
  getVisitTypeLabel,
  FamilyStatus
} from '@/lib/data';

interface RegistrarVisitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: Family[];
  preselectedFamily?: Family | null;
  onSaveVisit: (visit: PeriodicVisit, updatedStatus?: FamilyStatus, updatedPastoralNotes?: string) => void;
  currentVolunteerName?: string;
}

const COMMON_NEEDS = [
  'Cesta Básica Emergencial',
  'Medicamentos / Saúde',
  'Roupas e Cobertores',
  'Emprego / Renda',
  'Fraldas / Leite Infantil',
  'Apoio Espiritual / Oração',
  'Material Escolar',
  'Melhoria Habitacional / Reparo',
  'Apoio Jurídico / Documentos'
];

export default function RegistrarVisitaModal({
  isOpen,
  onClose,
  families,
  preselectedFamily = null,
  onSaveVisit,
  currentVolunteerName = 'Irmão Carlos (Vicentino)'
}: RegistrarVisitaModalProps) {
  // Family selection state
  const effectiveInitialFamilyId = preselectedFamily ? preselectedFamily.id : (families[0]?.id || '');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(effectiveInitialFamilyId);
  const [familySearch, setFamilySearch] = useState<string>('');
  
  // Active selected family
  const activeFamily = preselectedFamily || families.find((f) => f.id === selectedFamilyId) || families[0] || null;

  // Visit details
  const [visitDate, setVisitDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [visitTime, setVisitTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [visitors, setVisitors] = useState<string>(currentVolunteerName);
  const [visitType, setVisitType] = useState<PeriodicVisitType>('rotina');
  const [housingConditions, setHousingConditions] = useState<'Boa' | 'Regular' | 'Precária' | 'Risco Iminente'>('Regular');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(['Cesta Básica Emergencial']);
  const [customNeed, setCustomNeed] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [nextVisitRecommendation, setNextVisitRecommendation] = useState<string>('30 dias');
  
  // Optional family status update
  const [shouldUpdateStatus, setShouldUpdateStatus] = useState<boolean>(false);
  const [newFamilyStatus, setNewFamilyStatus] = useState<FamilyStatus>(() => activeFamily ? activeFamily.status : 'em_acompanhamento');

  if (!isOpen) return null;

  const filteredFamilies = families.filter((f) => {
    if (!familySearch.trim()) return true;
    const term = familySearch.toLowerCase();
    return f.name.toLowerCase().includes(term) || f.cpf.includes(term) || f.bairro.toLowerCase().includes(term);
  });

  const toggleNeed = (need: string) => {
    setSelectedNeeds((prev) => 
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleAddCustomNeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (customNeed.trim() && !selectedNeeds.includes(customNeed.trim())) {
      setSelectedNeeds((prev) => [...prev, customNeed.trim()]);
      setCustomNeed('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily) return;

    if (!summary.trim()) {
      alert('Por favor, informe um breve relato pastoral ou observação da visita.');
      return;
    }

    const [year, month, day] = visitDate.split('-');
    const dateFormatted = `${day}/${month}/${year}`;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const protocolNumber = `#VIS-${year}${month}-${randomSuffix}`;

    const newVisit: PeriodicVisit = {
      id: `vis-${Date.now()}`,
      familyId: activeFamily.id,
      familyName: activeFamily.name,
      familyCpf: activeFamily.cpf,
      familyBairro: activeFamily.bairro,
      familyAddress: activeFamily.address,
      date: visitDate,
      dateFormatted,
      timeFormatted: visitTime,
      visitors: visitors.trim() || 'Equipe Pastoral Vicentina',
      visitType,
      visitTypeLabel: getVisitTypeLabel(visitType),
      housingConditions,
      summary: summary.trim(),
      detectedNeeds: selectedNeeds,
      nextVisitRecommendation,
      protocolNumber,
      registeredBy: currentVolunteerName
    };

    onSaveVisit(
      newVisit,
      shouldUpdateStatus ? newFamilyStatus : undefined,
      summary.trim()
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#263142]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f0f3ff] flex items-center justify-between border-b border-[#dee8ff]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00603e] text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#9cf5c5] text-[#005234]">
                  Pastoral Vicentina
                </span>
                <span className="text-[11px] text-[#3f4942]">Registro Domiciliar</span>
              </div>
              <h2 className="text-[18px] font-bold text-[#111c2c] leading-tight">
                Registrar Visita Periódica
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-full hover:bg-[#dee8ff] text-[#3f4942] min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="visita-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Seleção da Família */}
          <div className="bg-[#f9f9ff] border border-[#dee8ff] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#111c2c] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00603e]" /> Família Beneficiária
              </label>
              {preselectedFamily && (
                <span className="text-[11px] text-[#00603e] font-semibold bg-[#9cf5c5]/40 px-2 py-0.5 rounded">
                  Pré-selecionada
                </span>
              )}
            </div>

            {!preselectedFamily ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#3f4942] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={familySearch}
                    onChange={(e) => setFamilySearch(e.target.value)}
                    placeholder="Filtrar por nome, CPF ou bairro..."
                    className="w-full pl-9 pr-3 py-2 text-[12px] bg-white border border-[#dee8ff] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00603e]"
                  />
                </div>
                <select
                  value={selectedFamilyId}
                  onChange={(e) => {
                    setSelectedFamilyId(e.target.value);
                    const fam = families.find((f) => f.id === e.target.value);
                    if (fam) setNewFamilyStatus(fam.status);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#dee8ff] text-[13px] font-medium text-[#111c2c] focus:outline-none focus:ring-2 focus:ring-[#00603e]"
                  required
                >
                  <option value="" disabled>Selecione a família visitada...</option>
                  {filteredFamilies.map((fam) => (
                    <option key={fam.id} value={fam.id}>
                      {fam.name} - CPF: {fam.cpf} ({fam.bairro})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {activeFamily && (
              <div className="bg-white p-3 rounded-lg border border-[#e2e8f5] flex items-center justify-between text-[12px]">
                <div>
                  <strong className="text-[#111c2c] text-[13px] block">{activeFamily.name}</strong>
                  <span className="text-[#3f4942] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00603e]" />
                    {activeFamily.address} — {activeFamily.bairro}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[#f0f3ff] text-[#004282]">
                    Status: {activeFamily.statusLabel}
                  </span>
                  <span className="block text-[11px] text-[#3f4942] mt-0.5">
                    {activeFamily.dependents?.length || 0} dependentes
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Data, Horário e Visitadores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[12px] font-bold text-[#111c2c] block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00603e]" /> Data da Visita
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] text-[13px] text-[#111c2c] focus:outline-none focus:ring-2 focus:ring-[#00603e]"
                required
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-[#111c2c] block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00603e]" /> Horário
              </label>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] text-[13px] text-[#111c2c] focus:outline-none focus:ring-2 focus:ring-[#00603e]"
                required
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-[#111c2c] block mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#00603e]" /> Visitadores Presentes
              </label>
              <input
                type="text"
                value={visitors}
                onChange={(e) => setVisitors(e.target.value)}
                placeholder="Ex: Irmão Carlos & Dra. Camila"
                className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] text-[13px] text-[#111c2c] focus:outline-none focus:ring-2 focus:ring-[#00603e]"
                required
              />
            </div>
          </div>

          {/* Section 3: Tipo de Visita & Condições Habitacionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-bold text-[#111c2c] block mb-1.5">
                Tipo de Visita
              </label>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as PeriodicVisitType)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] text-[13px] text-[#111c2c] font-medium focus:outline-none focus:ring-2 focus:ring-[#00603e]"
              >
                <option value="rotina">Rotina Periódica (Acompanhamento Mensal)</option>
                <option value="acolhimento">Acolhimento Inicial (Primeiro Contato)</option>
                <option value="saude">Saúde & Cuidados Especiais (Enfermos/PCD)</option>
                <option value="reavaliacao">Reavaliação Socioeconômica</option>
                <option value="emergencial">Visita Emergencial / Calamidade</option>
              </select>
            </div>

            <div>
              <label className="text-[12px] font-bold text-[#111c2c] block mb-1.5 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-[#00603e]" /> Condições da Moradia
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Boa', 'Regular', 'Precária', 'Risco Iminente'] as const).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setHousingConditions(cond)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition-all text-center ${
                      housingConditions === cond
                        ? cond === 'Boa'
                          ? 'bg-[#9cf5c5] text-[#005234] border-[#00603e]'
                          : cond === 'Regular'
                          ? 'bg-[#d6e3ff] text-[#004282] border-[#004282]'
                          : cond === 'Precária'
                          ? 'bg-[#ffeed4] text-[#a45800] border-[#a45800]'
                          : 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]'
                        : 'bg-[#f0f3ff] text-[#3f4942] border-[#dee8ff] hover:bg-[#e2e8f5]'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Necessidades Detectadas (Tags Selecionáveis) */}
          <div>
            <label className="text-[12px] font-bold text-[#111c2c] block mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00603e]" /> Necessidades Detectadas na Visita
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#f0f3ff] border border-[#dee8ff]">
              {COMMON_NEEDS.map((need) => {
                const isSelected = selectedNeeds.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => toggleNeed(need)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#00603e] text-white shadow-xs'
                        : 'bg-white text-[#3f4942] border border-[#dee8ff] hover:bg-[#e7eeff]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    {need}
                  </button>
                );
              })}
            </div>

            {/* Custom Need Adder */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customNeed}
                onChange={(e) => setCustomNeed(e.target.value)}
                placeholder="Outra necessidade específica (ex: cadeira de banho, óculos...)"
                className="flex-1 px-3 py-1.5 text-[12px] bg-white border border-[#dee8ff] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00603e]"
              />
              <button
                type="button"
                onClick={handleAddCustomNeed}
                disabled={!customNeed.trim()}
                className="px-3 py-1.5 text-[12px] font-bold rounded-lg bg-[#dee8ff] text-[#004282] hover:bg-[#d0deff] disabled:opacity-40"
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* Section 5: Relato Pastoral & Parecer Vicentino */}
          <div>
            <label className="text-[12px] font-bold text-[#111c2c] block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#00603e]" /> Relato Pastoral & Observações da Visita *
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Descreva como foi a visita, situação da família, estado de saúde dos membros, momento de oração ou escuta fraterna, e pontos de atenção para os próximos atendimentos..."
              className="w-full p-3 text-[13px] rounded-xl bg-[#f0f3ff] border border-[#dee8ff] text-[#111c2c] focus:outline-none focus:ring-2 focus:ring-[#00603e]"
              required
            />
          </div>

          {/* Section 6: Recomendação de Próxima Visita */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="text-[12px] font-bold text-[#111c2c] block mb-1.5">
                Recomendação para Próxima Visita
              </label>
              <select
                value={nextVisitRecommendation}
                onChange={(e) => setNextVisitRecommendation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] text-[13px] text-[#111c2c] font-medium focus:outline-none focus:ring-2 focus:ring-[#00603e]"
              >
                <option value="15 dias">Em 15 dias (Atenção prioritária / Saúde)</option>
                <option value="30 dias">Em 30 dias (Rotina mensal padrão)</option>
                <option value="60 dias">Em 60 dias (Estável / Processo de autonomia)</option>
                <option value="90 dias">Em 90 dias (Semestral)</option>
                <option value="Conforme demanda">Conforme solicitação ou demanda</option>
              </select>
            </div>

            {/* Checkbox: Atualizar Status da Família */}
            <div className="p-3 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-[12px] font-bold text-[#111c2c]">
                <input
                  type="checkbox"
                  checked={shouldUpdateStatus}
                  onChange={(e) => setShouldUpdateStatus(e.target.checked)}
                  className="rounded text-[#00603e] focus:ring-[#00603e]"
                />
                Atualizar status cadastral da família
              </label>
              {shouldUpdateStatus && (
                <select
                  value={newFamilyStatus}
                  onChange={(e) => setNewFamilyStatus(e.target.value as FamilyStatus)}
                  className="w-full px-2.5 py-1.5 text-[12px] rounded-lg bg-white border border-[#dee8ff] text-[#111c2c] font-medium"
                >
                  <option value="em_acompanhamento">Em acompanhamento</option>
                  <option value="promovida">Promovida (Autonomia alcançada)</option>
                  <option value="inativa">Inativa (Mudança / Pausada)</option>
                </select>
              )}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#f0f3ff] border-t border-[#dee8ff] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[#3f4942] font-bold text-[13px] hover:bg-[#dee8ff] min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="visita-form"
            className="px-5 py-2.5 rounded-xl bg-[#00603e] text-white font-bold text-[13px] hover:bg-[#1b7a53] flex items-center gap-2 shadow-md min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4" /> Concluir e Salvar Visita
          </button>
        </div>
      </div>
    </div>
  );
}
