'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Download, 
  UserPlus, 
  Search, 
  Filter, 
  RotateCcw, 
  FolderOpen, 
  History, 
  Edit3, 
  Package, 
  ChevronDown, 
  Trash2, 
  PackageCheck,
  Sparkles,
  Ban,
  HeartHandshake,
  Lock
} from 'lucide-react';
import { Family, FamilyStatus, getFamilyStatusLabel } from '@/lib/data';

interface FamiliasBeneficiariasViewProps {
  families: Family[];
  onOpenNewFamilyModal: () => void;
  onSelectFamilyForDelivery: (family: Family) => void;
  onOpenProntuario: (family: Family) => void;
  onOpenHistory: (family: Family) => void;
  onEditFamily: (family: Family) => void;
  onDeleteFamily: (family: Family) => void;
  onUpdateFamilyStatus?: (familyId: string, newStatus: FamilyStatus) => void;
  onRegisterVisit?: (family: Family) => void;
  userRole?: 'administrador' | 'voluntario' | 'coordenador';
}

export default function FamiliasBeneficiariasView({
  families,
  onOpenNewFamilyModal,
  onSelectFamilyForDelivery,
  onOpenProntuario,
  onOpenHistory,
  onEditFamily,
  onDeleteFamily,
  onUpdateFamilyStatus,
  onRegisterVisit,
  userRole = 'administrador'
}: FamiliasBeneficiariasViewProps) {
  const isAdmin = userRole === 'administrador' || userRole === 'coordenador';
  // Confirmation state for deleting family
  const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [bairroFilter, setBairroFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter logic
  const filteredFamilies = useMemo(() => {
    return families.filter((f) => {
      // Text search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const cleanCpf = query.replace(/[.\-\s]/g, '');
        const matchName = f.name.toLowerCase().includes(query);
        const matchCpf = f.cpf.replace(/[.\-\s]/g, '').includes(cleanCpf);
        if (!matchName && !matchCpf) return false;
      }

      // Bairro filter
      if (bairroFilter && f.bairro !== bairroFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && f.status !== statusFilter) {
        return false;
      }

      // Vulnerability filter
      if (vulnerabilityFilter && f.vulnerabilityLevel !== vulnerabilityFilter) {
        return false;
      }

      // Quick filter pills
      if (activeQuickFilter === 'em_acompanhamento' && f.status !== 'em_acompanhamento') return false;
      if (activeQuickFilter === 'promovida' && f.status !== 'promovida') return false;
      if (activeQuickFilter === 'inativa' && f.status !== 'inativa') return false;
      if (activeQuickFilter === 'criancas') {
        const hasChild = f.dependents.some((d) => (typeof d.age === 'number' && d.age <= 12) || d.tag?.includes('Infância') || d.tag?.includes('Criança') || d.tag?.includes('Bebê'));
        if (!hasChild) return false;
      }

      return true;
    });
  }, [families, searchTerm, bairroFilter, statusFilter, vulnerabilityFilter, activeQuickFilter]);

  const totalPages = Math.ceil(filteredFamilies.length / itemsPerPage) || 1;
  const displayedFamilies = filteredFamilies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearchTerm('');
    setBairroFilter('');
    setStatusFilter('');
    setVulnerabilityFilter('');
    setActiveQuickFilter(null);
  };

  const handleExport = () => {
    alert('Relatório gerado com sucesso! Arquivo "Amparo_Solidario_Familias_Outubro_2026.csv" baixado.');
  };

  return (
    <div className="flex flex-col w-full relative">
      
      {/* Top Stats Banner & Ambient Accents */}
      <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8 pb-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1b7a53]/15 text-[#00603e] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00603e]"></span>
                {isAdmin ? 'Módulo de Gestão Pastoral' : 'Módulo do Voluntário'}
              </span>
              <span className="text-[#3f4942] text-[11px]">•</span>
              <span className="text-[#3f4942] text-[10px] sm:text-[11px]">{isAdmin ? 'Acesso Pleno' : 'Pesquisa & Entrega'}</span>
            </div>
            <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#111c2c] tracking-tight leading-tight">
              {isAdmin ? 'Gestão de Famílias Beneficiárias' : 'Pesquisa de Famílias Beneficiárias'}
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#3f4942] max-w-2xl mt-0.5">
              {isAdmin
                ? 'Controle de núcleos familiares cadastrados, histórico socioeconômico e liberação de benefícios emergenciais e regulares.'
                : 'Consulte e localize as famílias cadastradas para realizar a entrega rápida de cestas básicas.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 h-11 sm:h-12 rounded-xl bg-white hover:bg-[#dee8ff]/50 text-[#455f88] font-bold text-[12px] sm:text-[13px] border border-[#d8e3fa] transition-all shadow-sm min-h-[44px]"
            >
              <Download className="w-4 h-4 text-[#455f88]" />
              <span>Exportar</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenNewFamilyModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 h-11 sm:h-12 rounded-xl bg-[#00603e] hover:bg-[#1b7a53] text-white font-bold text-[13px] sm:text-[14px] transition-all shadow-md hover:shadow-lg active:scale-[0.99] min-h-[44px]"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>+ Cadastrar Família</span>
                <span className="hidden sm:inline ml-1 px-1.5 py-0.5 rounded bg-white/20 text-white text-[10px] font-bold">F2</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Metric Cards Grid: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-5 sm:mt-6">
          {/* Metric 1: Total */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] text-[#3f4942] uppercase font-bold tracking-wider truncate">
                Total Famílias
              </span>
              <span className="text-[22px] sm:text-[28px] text-[#111c2c] font-bold mt-0.5 sm:mt-1">{families.length}</span>
              <span className="text-[10px] sm:text-[11px] text-[#00603e] font-bold truncate">Cadastradas no sistema</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#9cf5c5] flex items-center justify-center text-[#00603e] shrink-0 ml-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Metric 2: Em Acompanhamento */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] text-[#3f4942] uppercase font-bold tracking-wider truncate">
                Em Acompanhamento
              </span>
              <span className="text-[22px] sm:text-[28px] text-[#00603e] font-bold mt-0.5 sm:mt-1">
                {families.filter((f) => f.status === 'em_acompanhamento').length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#00603e] font-bold truncate">Ativas na paróquia</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#9cf5c5]/60 flex items-center justify-center text-[#1b7a53] shrink-0 ml-2">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Metric 3: Promovidas */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] text-[#3f4942] uppercase font-bold tracking-wider truncate">
                Famílias Promovidas
              </span>
              <span className="text-[22px] sm:text-[28px] text-[#004282] font-bold mt-0.5 sm:mt-1">
                {families.filter((f) => f.status === 'promovida').length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#004282] font-bold truncate">Autonomia alcançada</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#d6e3ff] flex items-center justify-center text-[#004282] shrink-0 ml-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Metric 4: Inativas */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] text-[#3f4942] uppercase font-bold tracking-wider truncate">
                Famílias Inativas
              </span>
              <span className="text-[22px] sm:text-[28px] text-[#45474c] font-bold mt-0.5 sm:mt-1">
                {families.filter((f) => f.status === 'inativa').length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#45474c] font-bold truncate">Cadastro pausado</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#e2e2e9] flex items-center justify-center text-[#45474c] shrink-0 ml-2">
              <Ban className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Rapid Search Bar Section */}
      <div className="px-4 sm:px-6 lg:px-10 pb-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] flex flex-col gap-3 sm:gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
            {/* Search Input */}
            <div className="sm:col-span-2 md:col-span-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f4942] w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por Nome ou CPF..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] placeholder:text-[#6f7a72] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
              />
            </div>

            {/* Filter 1: Bairro/Região */}
            <div className="md:col-span-2 relative">
              <select
                value={bairroFilter}
                onChange={(e) => setBairroFilter(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53] appearance-none cursor-pointer"
              >
                <option value="">Bairro: Todos</option>
                <option value="Centro">Centro</option>
                <option value="Vila Esperança">Vila Esperança</option>
                <option value="Jardim Alvorada">Jardim Alvorada</option>
                <option value="Zona Rural">Zona Rural</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#3f4942] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter 2: Status */}
            <div className="md:col-span-2 relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53] appearance-none cursor-pointer"
              >
                <option value="">Status: Todos</option>
                <option value="em_acompanhamento">Em acompanhamento</option>
                <option value="promovida">Promovida</option>
                <option value="inativa">Inativa</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#3f4942] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter 3: Vulnerabilidade */}
            <div className="md:col-span-2 relative">
              <select
                value={vulnerabilityFilter}
                onChange={(e) => setVulnerabilityFilter(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53] appearance-none cursor-pointer"
              >
                <option value="">Vulnerabilidade</option>
                <option value="extrema">Extrema Pobreza</option>
                <option value="baixa">Baixa Renda</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#3f4942] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Filters */}
            <div className="md:col-span-1 flex items-center justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full h-11 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#3f4942] hover:text-[#111c2c] flex items-center justify-center transition-colors min-h-[44px]"
                title="Limpar todos os filtros"
                aria-label="Limpar filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#dee8ff]/80 overflow-x-auto text-[12px] pb-1">
            <span className="text-[#3f4942] font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Filtros Rápidos:
            </span>
            <button
              type="button"
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'em_acompanhamento' ? null : 'em_acompanhamento')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0 flex items-center gap-1.5 ${
                activeQuickFilter === 'em_acompanhamento'
                  ? 'bg-[#1b7a53] text-white font-bold'
                  : 'bg-[#f0f3ff] text-[#00603e] hover:bg-[#dee8ff]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00603e]" />
              <span>Em Acompanhamento ({families.filter((f) => f.status === 'em_acompanhamento').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'promovida' ? null : 'promovida')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0 flex items-center gap-1.5 ${
                activeQuickFilter === 'promovida'
                  ? 'bg-[#004282] text-white font-bold'
                  : 'bg-[#f0f3ff] text-[#004282] hover:bg-[#dee8ff]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#004282]" />
              <span>Promovidas ({families.filter((f) => f.status === 'promovida').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'inativa' ? null : 'inativa')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0 flex items-center gap-1.5 ${
                activeQuickFilter === 'inativa'
                  ? 'bg-[#45474c] text-white font-bold'
                  : 'bg-[#f0f3ff] text-[#45474c] hover:bg-[#dee8ff]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#76777d]" />
              <span>Inativas ({families.filter((f) => f.status === 'inativa').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'criancas' ? null : 'criancas')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0 ${
                activeQuickFilter === 'criancas'
                  ? 'bg-[#1b7a53] text-white font-bold'
                  : 'bg-[#f0f3ff] text-[#455f88] hover:bg-[#dee8ff]'
              }`}
            >
              <span>Famílias com Crianças</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Beneficiary Families Container */}
      <div className="px-4 sm:px-6 lg:px-10 pb-8 sm:pb-10">
        <div className="rounded-2xl bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-[#dee8ff] overflow-hidden flex flex-col">
          
          {/* DESKTOP TABLE VIEW (Visible on >=md screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f0f3ff] text-[#3f4942] text-[11px] font-bold uppercase tracking-wider border-b border-[#dee8ff]">
                  <th className="py-3.5 px-4">Responsável Legal & Documentos</th>
                  <th className="py-3.5 px-4">Bairro & Domicílio</th>
                  <th className="py-3.5 px-4 text-center">Composição</th>
                  <th className="py-3.5 px-4">Renda per Capita</th>
                  <th className="py-3.5 px-4">Última Entrega</th>
                  <th className="py-3.5 px-4">Status de Retirada</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dee8ff] text-[13px] text-[#111c2c]">
                {displayedFamilies.map((family) => {
                  return (
                    <tr key={family.id} className="hover:bg-[#f0f3ff]/60 transition-colors">
                      {/* Titular */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                              family.status === 'em_acompanhamento'
                                ? 'bg-[#9cf5c5] text-[#00603e]'
                                : family.status === 'promovida'
                                ? 'bg-[#d6e3ff] text-[#004282]'
                                : 'bg-[#e2e2e9] text-[#45474c]'
                            }`}
                          >
                            {family.initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[#111c2c] truncate">
                              {family.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#3f4942]">
                              <span className="font-mono">CPF: {family.cpf}</span>
                              {family.phone && (
                                <>
                                  <span>•</span>
                                  <span>{family.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Bairro & Domicílio */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#111c2c]">{family.bairro}</span>
                          <span className="text-[12px] text-[#3f4942]">
                            {family.address} • {family.housingType.split(' ')[0]}{family.rentValue ? ` (R$ ${family.rentValue.toFixed(0)})` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Composição */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#e7eeff] text-[12px] text-[#111c2c] font-bold">
                          <Users className="w-3.5 h-3.5 text-[#00603e]" />
                          <span>{1 + family.dependents.length} pessoas</span>
                        </div>
                        <div className="text-[11px] text-[#3f4942] mt-0.5">
                          {family.dependents[0]?.tag || `${family.dependents.length} dependentes`}
                        </div>
                      </td>

                      {/* Renda per Capita */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className={`font-bold ${family.vulnerabilityLevel === 'extrema' ? 'text-[#814400]' : 'text-[#111c2c]'}`}>
                            R$ {family.perCapitaIncome.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-[#a45800]">
                            {family.vulnerabilityLevel === 'extrema' ? 'Extrema Pobreza' : 'Baixa Renda'}
                          </span>
                        </div>
                      </td>

                      {/* Última Entrega */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#111c2c]">{family.lastDeliveryDate}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <div className="relative inline-flex items-center">
                            <select
                              value={family.status}
                              onChange={(e) => onUpdateFamilyStatus && onUpdateFamilyStatus(family.id, e.target.value as FamilyStatus)}
                              className={`text-[11px] font-bold pl-3 pr-7 py-1.5 rounded-full cursor-pointer border appearance-none transition-all shadow-xs focus:outline-none focus:ring-2 ${
                                family.status === 'em_acompanhamento'
                                  ? 'bg-[#9cf5c5]/80 text-[#005234] border-[#00603e]/30 hover:bg-[#9cf5c5] focus:ring-[#00603e]'
                                  : family.status === 'promovida'
                                  ? 'bg-[#d6e3ff] text-[#004282] border-[#004282]/30 hover:bg-[#c2d7ff] focus:ring-[#004282]'
                                  : 'bg-[#e2e2e9] text-[#45474c] border-[#76777d]/30 hover:bg-[#d6d6de] focus:ring-[#45474c]'
                              }`}
                              title="Clique para alterar o status da família"
                            >
                              <option value="em_acompanhamento">Em acompanhamento</option>
                              <option value="promovida">Promovida</option>
                              <option value="inativa">Inativa</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none opacity-60" />
                          </div>
                        ) : (
                          <span className={`inline-flex text-[11px] font-bold px-3 py-1 rounded-full border ${
                            family.status === 'em_acompanhamento'
                              ? 'bg-[#9cf5c5]/80 text-[#005234] border-[#00603e]/30'
                              : family.status === 'promovida'
                              ? 'bg-[#d6e3ff] text-[#004282] border-[#004282]/30'
                              : 'bg-[#e2e2e9] text-[#45474c] border-[#76777d]/30'
                          }`}>
                            {family.statusLabel}
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <div className="inline-flex items-center gap-1">
                            {onRegisterVisit && (
                              <button
                                type="button"
                                onClick={() => onRegisterVisit(family)}
                                className="p-2 rounded-lg hover:bg-[#9cf5c5]/40 text-[#00603e] hover:text-[#005234] transition-colors"
                                title="Registrar Visita Periódica"
                              >
                                <HeartHandshake className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditFamily(family)}
                              className="p-2 rounded-lg hover:bg-[#e7eeff] text-[#00603e] hover:text-[#005234] transition-colors"
                              title="Editar Cadastro da Família"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenProntuario(family)}
                              className="p-2 rounded-lg hover:bg-[#e7eeff] text-[#455f88] transition-colors"
                              title="Visualizar Prontuário Social"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </button>
                            {family.status === 'promovida' || family.status === 'inativa' ? (
                              <span
                                className="p-2 rounded-lg text-[#bec9c0] cursor-not-allowed opacity-50 inline-flex items-center"
                                title={`Entrega bloqueada: Família com status "${family.statusLabel}" (apenas histórico estatístico)`}
                              >
                                <Package className="w-4 h-4 text-[#76777d]" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onSelectFamilyForDelivery(family)}
                                className="p-2 rounded-lg hover:bg-[#e7eeff] text-[#00603e] transition-colors"
                                title="Realizar Entrega Rápida"
                              >
                                <Package className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setFamilyToDelete(family)}
                              className="p-2 rounded-lg hover:bg-[#ffdad6] text-[#ba1a1a] transition-colors"
                              title="Excluir Família"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            {family.status === 'promovida' || family.status === 'inativa' ? (
                              <span
                                className="px-3 py-1.5 rounded-xl bg-[#e2e2e9] text-[#76777d] text-[11px] font-bold inline-flex items-center gap-1.5 cursor-not-allowed border border-[#d8e3fa]"
                                title={`Entrega Bloqueada: Família com status "${family.statusLabel}" não recebe cestas básicas (apenas histórico estatístico)`}
                              >
                                <Lock className="w-3.5 h-3.5 text-[#76777d]" />
                                <span>Bloqueada ({family.statusLabel})</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onSelectFamilyForDelivery(family)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#00603e] hover:bg-[#1b7a53] text-white text-[12px] font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                                title="Entregar Cesta Básica"
                              >
                                <Package className="w-3.5 h-3.5" />
                                <span>Entregar Cesta</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenProntuario(family)}
                              className="p-2 rounded-lg hover:bg-[#e7eeff] text-[#455f88] transition-colors"
                              title="Consultar Prontuário"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW (Visible on <md screens for exceptional touch UX) */}
          <div className="block md:hidden divide-y divide-[#dee8ff]">
            {displayedFamilies.map((family) => (
              <div key={family.id} className="p-4 flex flex-col gap-3 hover:bg-[#f0f3ff]/40 transition-colors">
                {/* Header: Avatar, Name & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                        family.status === 'em_acompanhamento'
                          ? 'bg-[#9cf5c5] text-[#00603e]'
                          : family.status === 'promovida'
                          ? 'bg-[#d6e3ff] text-[#004282]'
                          : 'bg-[#e2e2e9] text-[#45474c]'
                      }`}
                    >
                      {family.initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[14px] text-[#111c2c] truncate">
                        {family.name}
                      </span>
                      <span className="text-[11px] text-[#3f4942] font-mono">
                        CPF: {family.cpf}
                      </span>
                    </div>
                  </div>

                  {/* Status pill & quick change */}
                  {isAdmin ? (
                    <div className="relative inline-flex items-center shrink-0">
                      <select
                        value={family.status}
                        onChange={(e) => onUpdateFamilyStatus && onUpdateFamilyStatus(family.id, e.target.value as FamilyStatus)}
                        className={`text-[10px] font-bold pl-2.5 pr-5 py-1 rounded-full cursor-pointer border appearance-none transition-all shadow-xs focus:outline-none focus:ring-2 ${
                          family.status === 'em_acompanhamento'
                            ? 'bg-[#9cf5c5]/80 text-[#005234] border-[#00603e]/30'
                            : family.status === 'promovida'
                            ? 'bg-[#d6e3ff] text-[#004282] border-[#004282]/30'
                            : 'bg-[#e2e2e9] text-[#45474c] border-[#76777d]/30'
                        }`}
                        title="Alterar status"
                      >
                        <option value="em_acompanhamento">Em acompanhamento</option>
                        <option value="promovida">Promovida</option>
                        <option value="inativa">Inativa</option>
                      </select>
                      <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 pointer-events-none opacity-60" />
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                      family.status === 'em_acompanhamento'
                        ? 'bg-[#9cf5c5]/80 text-[#005234] border-[#00603e]/30'
                        : family.status === 'promovida'
                        ? 'bg-[#d6e3ff] text-[#004282] border-[#004282]/30'
                        : 'bg-[#e2e2e9] text-[#45474c] border-[#76777d]/30'
                    }`}>
                      {family.statusLabel}
                    </span>
                  )}
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-2 text-[12px] p-2.5 rounded-xl bg-[#f0f3ff]">
                  <div>
                    <span className="text-[#6f7a72] block text-[10px] uppercase font-bold">Bairro & Endereço</span>
                    <span className="font-bold text-[#111c2c] truncate block">{family.bairro}</span>
                    <span className="text-[#3f4942] text-[11px] truncate block">{family.address}</span>
                  </div>
                  <div>
                    <span className="text-[#6f7a72] block text-[10px] uppercase font-bold">Composição / Renda</span>
                    <span className="font-bold text-[#111c2c] block">{1 + family.dependents.length} pessoas</span>
                    <span className="text-[#814400] font-bold text-[11px] block">R$ {family.perCapitaIncome.toFixed(2).replace('.', ',')} / pessoa</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#3f4942]">
                  <span>Última entrega: <strong>{family.lastDeliveryDate}</strong></span>
                  <span>Contato: <strong>{family.phone}</strong></span>
                </div>

                {/* Mobile action bar with 44px touch targets */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#dee8ff]">
                  {family.status === 'promovida' || family.status === 'inativa' ? (
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-2.5 rounded-xl bg-[#e2e2e9] text-[#76777d] font-bold text-[11px] flex items-center justify-center gap-1.5 min-h-[44px] cursor-not-allowed border border-[#d8e3fa]"
                      title={`Entrega Bloqueada: Família com status "${family.statusLabel}" não pode receber cestas básicas (apenas histórico estatístico)`}
                    >
                      <Lock className="w-4 h-4 text-[#76777d]" />
                      <span>Bloqueada ({family.statusLabel})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectFamilyForDelivery(family)}
                      className="flex-1 py-2.5 rounded-xl bg-[#00603e] text-white font-bold text-[12px] flex items-center justify-center gap-1.5 min-h-[44px] shadow-sm"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Entregar Cesta</span>
                    </button>
                  )}

                  {isAdmin ? (
                    <div className="flex items-center gap-1 shrink-0">
                      {onRegisterVisit && (
                        <button
                          type="button"
                          onClick={() => onRegisterVisit(family)}
                          className="p-2.5 rounded-xl bg-[#9cf5c5]/40 text-[#00603e] hover:bg-[#9cf5c5] min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Registrar Visita Periódica"
                        >
                          <HeartHandshake className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditFamily(family)}
                        className="p-2.5 rounded-xl bg-[#f0f3ff] text-[#00603e] hover:bg-[#dee8ff] min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="Editar Cadastro"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenProntuario(family)}
                        className="p-2.5 rounded-xl bg-[#f0f3ff] text-[#455f88] hover:bg-[#dee8ff] min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="Prontuário"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFamilyToDelete(family)}
                        className="p-2.5 rounded-xl bg-[#ffdad6]/60 text-[#ba1a1a] hover:bg-[#ffdad6] min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenProntuario(family)}
                      className="p-2.5 rounded-xl bg-[#f0f3ff] text-[#455f88] hover:bg-[#dee8ff] min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Consultar Prontuário"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {displayedFamilies.length === 0 && (
            <div className="p-8 text-center text-[#3f4942]">
              <p className="font-bold text-[15px]">Nenhuma família encontrada para os filtros aplicados.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 text-[13px] text-[#00603e] font-bold underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}

          {/* Pagination & Table Footer */}
          <div className="px-4 sm:px-6 py-4 bg-[#f0f3ff] border-t border-[#dee8ff] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] sm:text-[13px] text-[#3f4942]">
            <span className="text-center sm:text-left">
              Exibindo <strong>{displayedFamilies.length}</strong> de <strong>{filteredFamilies.length}</strong> famílias filtradas
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-[#d8e3fa] bg-white text-[#111c2c] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#dee8ff]/50 min-h-[36px]"
              >
                Anterior
              </button>
              <span className="font-bold text-[#111c2c]">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-[#d8e3fa] bg-white text-[#111c2c] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#dee8ff]/50 min-h-[36px]"
              >
                Próxima
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Family Confirmation Modal */}
      {familyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-[#263142]/40 backdrop-blur-sm"
            onClick={() => setFamilyToDelete(null)}
          />
          <div className="relative bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <div className="w-10 h-10 rounded-xl bg-[#ffdad6] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-bold text-[#111c2c]">
                Excluir Cadastro da Família?
              </h3>
            </div>

            <p className="text-[13px] text-[#3f4942] leading-relaxed">
              Tem certeza que deseja remover o prontuário de <strong className="text-[#111c2c]">{familyToDelete.name}</strong> (CPF: {familyToDelete.cpf})? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFamilyToDelete(null)}
                className="w-full sm:w-auto px-4 py-2.5 text-[13px] font-bold text-[#3f4942] hover:bg-[#f0f3ff] rounded-xl min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteFamily(familyToDelete);
                  setFamilyToDelete(null);
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-[13px] font-bold bg-[#ba1a1a] text-white rounded-xl hover:bg-[#93000a] transition-colors shadow-sm min-h-[44px]"
              >
                Sim, Excluir Família
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
