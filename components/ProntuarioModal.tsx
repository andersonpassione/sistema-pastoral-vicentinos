'use client';

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Users, 
  DollarSign, 
  History, 
  Heart, 
  Calendar, 
  Printer,
  Package,
  Edit3,
  Trash2,
  ChevronDown,
  Sparkles,
  HeartHandshake,
  Lock,
  AlertCircle,
  Ban
} from 'lucide-react';
import { Family, FamilyStatus, PeriodicVisit } from '@/lib/data';

interface ProntuarioModalProps {
  family: Family | null;
  isOpen: boolean;
  onClose: () => void;
  onDeliverDirect: (family: Family) => void;
  onEdit?: (family: Family) => void;
  onDelete?: (family: Family) => void;
  onUpdateStatus?: (familyId: string, newStatus: FamilyStatus) => void;
  visits?: PeriodicVisit[];
  onOpenRegisterVisit?: (family: Family) => void;
}

export default function ProntuarioModal({
  family,
  isOpen,
  onClose,
  onDeliverDirect,
  onEdit,
  onDelete,
  onUpdateStatus,
  visits = [],
  onOpenRegisterVisit
}: ProntuarioModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !family) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#263142]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#f0f3ff] flex items-center justify-between border-b border-[#dee8ff]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#00603e] text-white flex items-center justify-center font-bold text-[16px] sm:text-[18px] shrink-0">
              {family.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#9cf5c5] text-[#005234] shrink-0">
                  Prontuário Social
                </span>
                <span className="text-[11px] text-[#3f4942] truncate">Protocolo #2024.10-{family.id.slice(-3)}</span>
              </div>
              <h2 className="text-[17px] sm:text-[20px] font-bold text-[#111c2c] leading-tight truncate">
                {family.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#dee8ff] text-[#3f4942] min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Identificação Geral */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[13px]">
            <div>
              <span className="text-[#3f4942] text-[11px] block">CPF</span>
              <strong className="text-[#111c2c] font-mono">{family.cpf}</strong>
            </div>
            <div>
              <span className="text-[#3f4942] text-[11px] block">Data de Nasc.</span>
              <strong className="text-[#111c2c]">{family.birthDate || 'Não informado'}</strong>
            </div>
            <div>
              <span className="text-[#3f4942] text-[11px] block">RG</span>
              <strong className="text-[#111c2c]">{family.rg || 'Não informado'}</strong>
            </div>
            <div>
              <span className="text-[#3f4942] text-[11px] block">Identidade de Gênero</span>
              <strong className="text-[#111c2c]">{family.genderIdentity || 'Não informado'}</strong>
            </div>
            <div>
              <span className="text-[#3f4942] text-[11px] block">Telefone</span>
              <strong className="text-[#111c2c]">{family.phone}</strong>
            </div>
            <div>
              <span className="text-[#3f4942] text-[11px] block">Bairro</span>
              <strong className="text-[#111c2c]">{family.bairro}</strong>
            </div>
            <div>
              <span className="text-[#3f4942] text-[11px] block">Habitação</span>
              <strong className="text-[#111c2c]">
                {family.rentValue ? `${family.housingType} (R$ ${family.rentValue.toFixed(2).replace('.', ',')})` : family.housingType}
              </strong>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <span className="text-[#3f4942] text-[11px] block">Endereço Residencial</span>
              <strong className="text-[#111c2c]">{family.address}</strong>
            </div>
          </div>

          {/* Banner de Bloqueio de Entrega para Promovida/Inativa */}
          {(family.status === 'promovida' || family.status === 'inativa') && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#fff0ef] border border-[#ffb4ab] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
              <div className="flex flex-col text-[12px]">
                <span className="font-bold text-[#ba1a1a]">
                  Entrega Bloqueada: Família com status &quot;{family.statusLabel}&quot;
                </span>
                <p className="text-[#3f4942] mt-0.5 leading-relaxed">
                  Famílias com status <strong>&quot;Promovida&quot;</strong> e <strong>&quot;Inativa&quot;</strong> não podem receber cestas básicas no dia da distribuição mensal, permanecendo cadastradas exclusivamente para fins de histórico estatístico e documentação pastoral.
                </p>
              </div>
            </div>
          )}

          {/* Situação Socioeconômica & Critérios */}
          <div>
            <h4 className="text-[13px] sm:text-[14px] font-bold text-[#111c2c] mb-2">Diagnóstico Socioeconômico</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-xl bg-[#e7eeff] border border-[#d8e3fa]">
                <span className="text-[11px] text-[#455f88] font-bold block uppercase">Renda Familiar</span>
                <span className="text-[16px] sm:text-[18px] font-bold text-[#111c2c]">R$ {family.monthlyIncome.toFixed(2).replace('.', ',')}</span>
                <span className="text-[10px] text-[#3f4942] block">R$ {family.perCapitaIncome.toFixed(2).replace('.', ',')}/pessoa</span>
              </div>
              <div className="p-3 rounded-xl bg-[#e7eeff] border border-[#d8e3fa]">
                <span className="text-[11px] text-[#455f88] font-bold block uppercase">Benefício Social</span>
                <span className="text-[13px] sm:text-[14px] font-bold text-[#00603e]">{family.benefitType}</span>
                <span className="text-[10px] text-[#3f4942] block">Cadastro Pastoral</span>
              </div>
              <div className="p-3 rounded-xl bg-[#e7eeff] border border-[#d8e3fa] flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-[#455f88] font-bold block uppercase">Status Cadastral</span>
                  <div className="mt-1 relative inline-flex items-center w-full">
                    <select
                      value={family.status}
                      onChange={(e) => onUpdateStatus && onUpdateStatus(family.id, e.target.value as FamilyStatus)}
                      className={`w-full text-[12px] font-bold pl-2.5 pr-6 py-1 rounded-lg cursor-pointer border appearance-none transition-all shadow-xs ${
                        family.status === 'em_acompanhamento'
                          ? 'bg-[#9cf5c5] text-[#005234] border-[#00603e]/30'
                          : family.status === 'promovida'
                          ? 'bg-[#d6e3ff] text-[#004282] border-[#004282]/30'
                          : 'bg-[#e2e2e9] text-[#45474c] border-[#76777d]/30'
                      }`}
                      title="Alterar status desta família"
                    >
                      <option value="em_acompanhamento">Em acompanhamento</option>
                      <option value="promovida">Promovida</option>
                      <option value="inativa">Inativa</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none opacity-60" />
                  </div>
                </div>
                <span className="text-[10px] text-[#3f4942] block mt-1">
                  {family.status === 'em_acompanhamento' && 'Acolhida / Ativa na paróquia'}
                  {family.status === 'promovida' && 'Autonomia Conquistada'}
                  {family.status === 'inativa' && 'Atendimento Pausado'}
                </span>
              </div>
            </div>
          </div>

          {/* Composição do Núcleo Familiar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[13px] sm:text-[14px] font-bold text-[#111c2c]">Núcleo Familiar & Dependentes</h4>
              <span className="text-[11px] text-[#3f4942]">{1 + family.dependents.length} membros totais</span>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#f0f3ff] flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#111c2c]">{family.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#9cf5c5] text-[#005234] font-bold">Responsável</span>
                </div>
                <span className="text-[12px] text-[#3f4942]">{family.genderIdentity}</span>
              </div>
              {family.dependents.map((dep) => (
                <div key={dep.id} className="p-3 rounded-xl bg-white border border-[#d8e3fa] flex items-center justify-between text-[13px]">
                  <div>
                    <span className="font-bold text-[#111c2c]">{dep.name}</span>
                    <span className="text-[#3f4942] text-[12px] ml-2">({dep.relationship}, {dep.age} anos)</span>
                  </div>
                  {dep.tag && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#e7eeff] text-[#455f88] font-bold">
                      {dep.tag}
                    </span>
                  )}
                </div>
              ))}

              {family.dependentsNotes && (
                <div className="p-3.5 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[12px] text-[#3f4942] mt-2">
                  <span className="font-bold text-[#00603e] block text-[11px] uppercase tracking-wider mb-0.5">
                    Observações dos Dependentes & Composição:
                  </span>
                  <p className="italic leading-relaxed text-[#111c2c]">
                    &quot;{family.dependentsNotes}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Anotações Pastorais e Visitas */}
          <div>
            <h4 className="text-[13px] sm:text-[14px] font-bold text-[#111c2c] mb-1.5">Anotações Pastorais Vicentinas</h4>
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] text-[12px] sm:text-[13px] text-[#3f4942] italic leading-relaxed">
              &quot;{family.pastoralNotes || 'Nenhuma observação pastoral pendente no momento.'}&quot;
            </div>
          </div>

          {/* Seção de Visitas Periódicas Realizadas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[13px] sm:text-[14px] font-bold text-[#111c2c] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#00603e]" /> Visitas Periódicas Realizadas
                <span className="text-[11px] font-semibold px-2 py-0.2 bg-[#f0f3ff] text-[#004282] rounded-full border border-[#dee8ff]">
                  {visits.filter((v) => v.familyId === family.id).length}
                </span>
              </h4>
              {onOpenRegisterVisit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRegisterVisit(family);
                  }}
                  className="text-[11px] font-bold text-[#00603e] hover:text-[#005234] hover:underline flex items-center gap-1"
                >
                  + Registrar Nova Visita
                </button>
              )}
            </div>

            {visits.filter((v) => v.familyId === family.id).length === 0 ? (
              <div className="p-3.5 rounded-xl bg-[#f9f9ff] border border-dashed border-[#dee8ff] text-center text-[12px] text-[#3f4942]">
                Nenhuma visita periódica registrada para esta família ainda.
                {onOpenRegisterVisit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRegisterVisit(family);
                    }}
                    className="block mx-auto mt-2 px-3 py-1 text-[11px] font-bold bg-[#9cf5c5]/50 text-[#005234] rounded-lg hover:bg-[#9cf5c5]"
                  >
                    + Registrar Primeira Visita
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {visits
                  .filter((v) => v.familyId === family.id)
                  .map((visit) => (
                    <div
                      key={visit.id}
                      className="p-3 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[12px] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#00603e]">{visit.dateFormatted} às {visit.timeFormatted}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-[#004282] border border-[#dee8ff]">
                            {visit.visitTypeLabel}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#3f4942]">{visit.protocolNumber}</span>
                      </div>
                      <div className="text-[11px] text-[#3f4942]">
                        <strong>Visitadores:</strong> {visit.visitors} | <strong>Moradia:</strong> {visit.housingConditions}
                      </div>
                      <p className="text-[#111c2c] italic bg-white/70 p-2 rounded-lg border border-[#e2e8f5]">
                        &quot;{visit.summary}&quot;
                      </p>
                      {visit.detectedNeeds && visit.detectedNeeds.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[10px] text-[#3f4942] font-semibold">Demandas:</span>
                          {visit.detectedNeeds.map((need, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-white text-[#004282] border border-[#dee8ff]">
                              {need}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Histórico Recente de Entregas */}
          <div>
            <h4 className="text-[13px] sm:text-[14px] font-bold text-[#111c2c] mb-2">Última Retirada Registrada</h4>
            <div className="p-3 rounded-xl bg-[#9cf5c5]/25 border border-[#80d8aa]/40 flex items-center justify-between text-[12px] sm:text-[13px]">
              <div>
                <span className="font-bold text-[#00603e]">Cesta Básica</span>
                <span className="text-[#3f4942] block text-[11px] sm:text-[12px]">Data da Retirada: {family.lastDeliveryDate}</span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#00603e] text-white text-[11px] font-bold">
                Concluída
              </span>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Alert Banner (if requested) */}
        {confirmDelete && (
          <div className="p-4 bg-[#ffdad6]/90 border-t border-[#ffb4ab] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="text-[13px] text-[#410002] font-semibold text-center sm:text-left">
              Confirmar exclusão definitiva do prontuário de <strong>{family.name}</strong>?
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-white text-[#410002] font-bold text-[12px] hover:bg-[#fff0ee]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDelete) {
                    onDelete(family);
                    onClose();
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-[#ba1a1a] text-white font-bold text-[12px] hover:bg-[#93000a] shadow-sm"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-[#f0f3ff] border-t border-[#dee8ff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white border border-[#d8e3fa] text-[#455f88] font-bold text-[12px] sm:text-[13px] flex items-center justify-center gap-1.5 hover:bg-[#dee8ff] min-h-[40px]"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(family);
                }}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white border border-[#00603e]/40 text-[#00603e] font-bold text-[12px] sm:text-[13px] flex items-center justify-center gap-1.5 hover:bg-[#9cf5c5]/30 min-h-[40px]"
              >
                <Edit3 className="w-4 h-4" /> Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-xl bg-white border border-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6] min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Excluir Família"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {onOpenRegisterVisit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegisterVisit(family);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white border border-[#00603e] text-[#00603e] font-bold text-[12px] sm:text-[13px] hover:bg-[#9cf5c5]/25 flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <HeartHandshake className="w-4 h-4" /> Registrar Visita
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[#3f4942] font-bold text-[12px] sm:text-[13px] hover:bg-[#dee8ff] min-h-[40px]"
            >
              Fechar
            </button>
            {(family.status === 'promovida' || family.status === 'inativa') ? (
              <span
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#e2e2e9] text-[#76777d] font-bold text-[12px] sm:text-[13px] flex items-center justify-center gap-1.5 cursor-not-allowed border border-[#d8e3fa]"
                title={`Entrega não permitida: Família com status "${family.statusLabel}" (apenas histórico estatístico)`}
              >
                <Lock className="w-4 h-4 text-[#76777d]" /> Entrega Bloqueada ({family.statusLabel})
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeliverDirect(family);
                }}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl bg-[#00603e] text-white font-bold text-[12px] sm:text-[13px] hover:bg-[#1b7a53] flex items-center justify-center gap-1.5 shadow-md min-h-[40px]"
              >
                <Package className="w-4 h-4" /> Entregar Cesta
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
