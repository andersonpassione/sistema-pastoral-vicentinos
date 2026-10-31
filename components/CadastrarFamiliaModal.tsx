'use client';

import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  Edit3,
  MapPin, 
  Users, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Package, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  Home,
  AlertCircle,
  Loader2,
  Search,
  Sparkles,
  Ban
} from 'lucide-react';
import { Family, Dependent, FamilyStatus, getFamilyStatusLabel, normalizeFamilyStatus } from '@/lib/data';
import { formatCpf, validateCpf, formatCep } from '@/lib/cpf';

interface CadastrarFamiliaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (family: Family, triggerFirstDelivery: boolean) => void;
  familyToEdit?: Family | null;
  existingFamilies?: Family[];
}

export default function CadastrarFamiliaModal({
  isOpen,
  onClose,
  onSave,
  familyToEdit,
  existingFamilies = []
}: CadastrarFamiliaModalProps) {
  const isEditing = Boolean(familyToEdit);

  // Wizard Step: always starts at Step 1 (Responsável Legal)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Helper to normalize gender to exactly 3 options
  const normalizeGender = (val?: string) => {
    if (!val) return '';
    const lower = val.toLowerCase();
    if (lower.includes('homem')) return 'Homem';
    if (lower.includes('outro') || lower.includes('não-binário')) return 'Outros';
    return 'Mulher';
  };

  // Status state
  const [status, setStatus] = useState<FamilyStatus>(
    normalizeFamilyStatus(familyToEdit?.status)
  );

  // Form State: starts completely empty if new family, or pre-filled if editing
  const [nome, setNome] = useState(familyToEdit?.name || '');
  const [cpf, setCpf] = useState(familyToEdit?.cpf ? formatCpf(familyToEdit.cpf) : '');
  const [rg, setRg] = useState(familyToEdit?.rg || '');
  const [birthDate, setBirthDate] = useState(familyToEdit?.birthDate || '');
  const [phone, setPhone] = useState(familyToEdit?.phone || '');
  const [genderIdentity, setGenderIdentity] = useState(familyToEdit ? normalizeGender(familyToEdit.genderIdentity) : '');

  const [cep, setCep] = useState(familyToEdit ? '08540-120' : '');
  const addressParts = (familyToEdit?.address || '').split(',');
  const [logradouro, setLogradouro] = useState(familyToEdit ? (addressParts[0]?.trim() || familyToEdit.address) : '');
  const [numero, setNumero] = useState(familyToEdit ? (addressParts[1]?.trim() || '') : '');
  const [bairro, setBairro] = useState(familyToEdit?.bairro || '');
  
  const initialHousing = familyToEdit
    ? (familyToEdit.housingType?.toLowerCase().includes('alugada') ? 'Alugada' : familyToEdit.housingType)
    : '';
  const [tipoHabitacao, setTipoHabitacao] = useState(initialHousing);
  const [valorAluguel, setValorAluguel] = useState(
    familyToEdit?.rentValue ? familyToEdit.rentValue.toFixed(2).replace('.', ',') : ''
  );
  const [pontoReferencia, setPontoReferencia] = useState(familyToEdit?.referencePoint || '');

  const [dependents, setDependents] = useState<Dependent[]>(
    familyToEdit?.dependents ? [...familyToEdit.dependents] : []
  );

  const [newDepName, setNewDepName] = useState('');
  const [newDepRel, setNewDepRel] = useState('Filho(a)');
  const [newDepAge, setNewDepAge] = useState('');
  const [newDepNotes, setNewDepNotes] = useState('');
  const [showAddDepForm, setShowAddDepForm] = useState(false);

  const [dependentsNotes, setDependentsNotes] = useState(familyToEdit?.dependentsNotes || '');

  const [rendaTotal, setRendaTotal] = useState(
    familyToEdit ? familyToEdit.monthlyIncome.toFixed(2).replace('.', ',') : ''
  );
  const [beneficio, setBeneficio] = useState(familyToEdit?.benefitType || 'Bolsa Família Ativo');
  const [observacoes, setObservacoes] = useState(familyToEdit?.pastoralNotes || '');

  // CEP lookup state
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepStatusMessage, setCepStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // CPF validation status
  const cleanCpfDigits = cpf.replace(/\D/g, '');
  const isCpfComplete = cleanCpfDigits.length === 11;
  const isCpfValid = isCpfComplete ? validateCpf(cpf) : null;
  const duplicateFamily = (isCpfComplete && existingFamilies.length > 0)
    ? existingFamilies.find((f) => f.id !== familyToEdit?.id && f.cpf.replace(/\D/g, '') === cleanCpfDigits)
    : null;
  const isAlugada = tipoHabitacao === 'Alugada' || tipoHabitacao.toLowerCase().includes('alugada');

  if (!isOpen) return null;

  // Calculate per capita
  const numericRenda = parseFloat(rendaTotal.replace(/\./g, '').replace(',', '.')) || 0;
  const totalMembers = 1 + dependents.length;
  const perCapita = (numericRenda / (totalMembers || 1)).toFixed(2);
  const isExtremaPobreza = Number(perCapita) <= 218;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      buscarCep(clean);
    } else {
      setCepStatusMessage(null);
    }
  };

  const buscarCep = async (cleanDigits: string) => {
    setIsSearchingCep(true);
    setCepStatusMessage({ text: 'Buscando endereço pelo CEP...' });
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanDigits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setLogradouro(data.logradouro);
        if (data.bairro) setBairro(data.bairro);
        setCepStatusMessage({ 
          text: `Endereço localizado: ${data.logradouro || ''}${data.bairro ? ', ' + data.bairro : ''}${data.localidade ? ' - ' + data.localidade : ''}` 
        });
      } else {
        setCepStatusMessage({ text: 'CEP não encontrado nos Correios. Preencha manualmente.', isError: true });
      }
    } catch {
      // Offline fallback
      if (cleanDigits === '08540120') {
        setLogradouro('Rua dos Girassóis');
        setBairro('Vila Esperança');
        setCepStatusMessage({ text: 'Endereço localizado: Rua dos Girassóis, Vila Esperança' });
      } else {
        setCepStatusMessage({ text: 'Não foi possível consultar automaticamente. Preencha o endereço.', isError: true });
      }
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleAddDependent = () => {
    if (!newDepName.trim()) return;
    const ageNum = parseInt(newDepAge) || 0;
    let tag = 'Adulto';
    if (ageNum < 6) tag = 'Primeira Infância';
    else if (ageNum <= 17) tag = 'Criança / Estudante';
    else if (ageNum >= 60) tag = 'Idoso Prioritário';

    const newDep: Dependent = {
      id: 'dep-' + Date.now(),
      name: newDepName,
      relationship: newDepRel,
      age: ageNum,
      notes: newDepNotes.trim() || undefined,
      tag
    };

    setDependents([...dependents, newDep]);
    setNewDepName('');
    setNewDepAge('');
    setNewDepNotes('');
    setShowAddDepForm(false);
  };

  const handleRemoveDependent = (id: string) => {
    setDependents(dependents.filter((d) => d.id !== id));
  };

  const handleFormSubmit = (triggerDelivery: boolean) => {
    if (!nome.trim()) {
      alert('Por favor, informe o nome completo do responsável legal.');
      setCurrentStep(1);
      return;
    }

    if (cleanCpfDigits.length > 0 && !validateCpf(cpf)) {
      alert('O CPF informado é inválido. Por favor, verifique os 11 dígitos.');
      setCurrentStep(1);
      return;
    }

    if (duplicateFamily) {
      alert(`Cadastro Bloqueado: Já existe uma família cadastrada com este CPF ("${duplicateFamily.name}", Bairro: ${duplicateFamily.bairro}). Não é permitido cadastro duplicado com o mesmo CPF.`);
      setCurrentStep(1);
      return;
    }

    // Regra de negócio: Famílias promovidas ou inativas não recebem cestas básicas
    const effectiveTriggerDelivery = triggerDelivery && status === 'em_acompanhamento';

    const initials = nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');

    const isAlugada = tipoHabitacao === 'Alugada' || tipoHabitacao.toLowerCase().includes('alugada');
    const numericRent = isAlugada
      ? (parseFloat(valorAluguel.replace(/\./g, '').replace(',', '.')) || undefined)
      : undefined;

    const savedFamily: Family = {
      id: familyToEdit ? familyToEdit.id : 'fam-' + Date.now(),
      name: nome,
      cpf: cpf || '000.000.000-00',
      nis: familyToEdit?.nis || ('160.' + Math.floor(1000 + Math.random() * 9000) + '.' + Math.floor(100 + Math.random() * 900) + '-0'),
      rg,
      birthDate,
      phone,
      genderIdentity: genderIdentity || 'Mulher',
      bairro: bairro || 'Vila Esperança',
      address: numero ? `${logradouro || 'Endereço não informado'}, ${numero}` : (logradouro || 'Endereço não informado'),
      housingType: tipoHabitacao || 'Alugada',
      rentValue: numericRent,
      referencePoint: pontoReferencia,
      dependents,
      monthlyIncome: numericRenda,
      perCapitaIncome: Number(perCapita),
      benefitType: beneficio,
      status: status,
      statusLabel: getFamilyStatusLabel(status),
      lastDeliveryDate: familyToEdit?.lastDeliveryDate || 'Primeira Retirada',
      lastDeliveryDaysAgo: familyToEdit ? familyToEdit.lastDeliveryDaysAgo : 0,
      lastDeliveryBasketType: familyToEdit?.lastDeliveryBasketType || 'Cesta Básica',
      recommendedBasket: familyToEdit?.recommendedBasket || 'Cesta Básica',
      pastoralNotes: observacoes,
      dependentsNotes: dependentsNotes.trim() || undefined,
      hasScheduleVisit: familyToEdit?.hasScheduleVisit ?? true,
      initials: initials || (familyToEdit?.initials ?? 'NF'),
      vulnerabilityLevel: isExtremaPobreza ? 'extrema' : 'baixa',
      avatarUrl: familyToEdit?.avatarUrl
    };

    onSave(savedFamily, effectiveTriggerDelivery);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#263142]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-3xl bg-white shadow-2xl h-full flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#f0f3ff] flex items-center justify-between border-b border-[#dee8ff]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1b7a53] text-white flex items-center justify-center shrink-0 shadow-sm">
              {isEditing ? <Edit3 className="w-5 h-5 sm:w-6 sm:h-6" /> : <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#9cf5c5] text-[#005234] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0">
                  {isEditing ? 'Editar Prontuário' : 'Novo Prontuário'}
                </span>
                <span className="text-[11px] sm:text-[12px] text-[#3f4942] truncate">
                  {familyToEdit ? `Protocolo #${familyToEdit.id.slice(-6).toUpperCase()}` : 'Protocolo #2026.10-994'}
                </span>
              </div>
              <h2 className="text-[17px] sm:text-[20px] text-[#111c2c] font-bold leading-tight truncate">
                {isEditing ? `Editar: ${familyToEdit?.name}` : 'Cadastrar Nova Família'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#dee8ff] text-[#3f4942] hover:text-[#111c2c] transition-colors shrink-0"
            title="Fechar (Esc)"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Navigation Steps Tabs */}
        <div className="px-4 sm:px-6 bg-white border-b border-[#dee8ff] flex items-center gap-4 sm:gap-6 overflow-x-auto pb-0">
          {[
            { step: 1, label: 'Responsável Legal' },
            { step: 2, label: 'Endereço & Moradia' },
            { step: 3, label: 'Composição Familiar' },
            { step: 4, label: 'Critérios' }
          ].map((item) => {
            const isActive = currentStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setCurrentStep(item.step)}
                className={`py-3 text-[13px] font-bold border-b-2 flex items-center gap-1.5 shrink-0 transition-colors ${
                  isActive
                    ? 'text-[#00603e] border-[#00603e]'
                    : 'text-[#3f4942] border-transparent hover:text-[#111c2c]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                    isActive
                      ? 'bg-[#00603e] text-white'
                      : 'bg-[#e7eeff] text-[#3f4942]'
                  }`}
                >
                  {item.step}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* STEP 1: Responsável Legal (Sempre o primeiro a abrir) */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#00603e] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-[#111c2c] text-[14px]">
                    Titular do Benefício Social
                  </span>
                  <p className="text-[12px] text-[#3f4942]">
                    Os dados devem corresponder preferencialmente à mãe ou chefe de família com documento oficial com foto.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">
                    Nome Completo do Responsável *
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite o nome completo"
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                    required
                  />
                </div>

                {/* CPF com Máscara e Validação Oficial */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold flex items-center justify-between">
                    <span>CPF *</span>
                    {duplicateFamily ? (
                      <span className="text-[11px] text-[#ba1a1a] font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a]" /> CPF Duplicado
                      </span>
                    ) : isCpfComplete && isCpfValid ? (
                      <span className="text-[11px] text-[#00603e] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00603e]" /> CPF Válido
                      </span>
                    ) : null}
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border text-[#111c2c] font-mono text-[14px] focus:outline-none focus:ring-2 transition-all ${
                      duplicateFamily
                        ? 'border-[#ba1a1a] bg-[#fff0ef] focus:ring-[#ba1a1a]'
                        : isCpfComplete
                        ? isCpfValid
                          ? 'border-[#80d8aa] focus:ring-[#00603e]'
                          : 'border-[#ffb4ab] bg-[#fff8f7] focus:ring-[#ba1a1a]'
                        : 'border-[#d8e3fa] focus:ring-[#1b7a53]'
                    }`}
                    required
                  />
                  {duplicateFamily ? (
                    <div className="p-2.5 rounded-lg bg-[#fff0ef] border border-[#ffb4ab] text-[11px] text-[#ba1a1a] font-bold flex items-start gap-1.5 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
                      <div>
                        <span>Não é permitido cadastro duplicado: Este CPF já está cadastrado para a família de <strong>{duplicateFamily.name}</strong> ({duplicateFamily.bairro}).</span>
                      </div>
                    </div>
                  ) : isCpfComplete && !isCpfValid ? (
                    <span className="text-[11px] text-[#ba1a1a] font-bold flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                      CPF inválido. Verifique os dígitos informados.
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold flex items-center justify-between">
                    <span>RG</span>
                    <span className="text-[11px] text-[#6f7a72] font-normal">Opcional</span>
                  </label>
                  <input
                    type="text"
                    value={rg}
                    onChange={(e) => setRg(e.target.value)}
                    placeholder="Ex.: 44.120.942-X"
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">Data de Nascimento *</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">Telefone / WhatsApp para Notificação *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 90000-0000"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                    />
                    <MessageSquare className="w-4 h-4 text-[#1b7a53] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">Identidade de Gênero</label>
                  <select
                    value={genderIdentity}
                    onChange={(e) => setGenderIdentity(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                  >
                    {!genderIdentity && (
                      <option value="" disabled>Selecione a opção</option>
                    )}
                    <option value="Mulher">Mulher</option>
                    <option value="Homem">Homem</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                {/* Status Cadastral da Família */}
                <div className="md:col-span-2 flex flex-col gap-2 pt-3 border-t border-[#dee8ff]">
                  <label className="text-[12px] text-[#3f4942] font-bold flex items-center justify-between">
                    <span>Situação / Status da Família *</span>
                    <span className="text-[11px] text-[#00603e] font-semibold">Defina o status de acompanhamento</span>
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Option 1: Em acompanhamento */}
                    <button
                      type="button"
                      onClick={() => setStatus('em_acompanhamento')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                        status === 'em_acompanhamento'
                          ? 'border-[#00603e] bg-[#9cf5c5]/25 ring-2 ring-[#00603e]/20 shadow-sm'
                          : 'border-[#d8e3fa] bg-[#f0f3ff] hover:bg-[#dee8ff]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#9cf5c5] text-[#005234] text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full bg-[#00603e]" />
                          Em acompanhamento
                        </span>
                        {status === 'em_acompanhamento' && (
                          <CheckCircle2 className="w-4 h-4 text-[#00603e]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#3f4942] leading-tight">
                        Ativa. Recebe assistência alimentar regular e visitas pastorais.
                      </p>
                    </button>

                    {/* Option 2: Promovida */}
                    <button
                      type="button"
                      onClick={() => setStatus('promovida')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                        status === 'promovida'
                          ? 'border-[#004282] bg-[#d6e3ff]/40 ring-2 ring-[#004282]/20 shadow-sm'
                          : 'border-[#d8e3fa] bg-[#f0f3ff] hover:bg-[#dee8ff]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d6e3ff] text-[#004282] text-[11px] font-bold">
                          <Sparkles className="w-3 h-3 text-[#004282]" />
                          Promovida
                        </span>
                        {status === 'promovida' && (
                          <CheckCircle2 className="w-4 h-4 text-[#004282]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#3f4942] leading-tight">
                        Superou vulnerabilidade alimentar. Autonomia familiar alcançada.
                      </p>
                    </button>

                    {/* Option 3: Inativa */}
                    <button
                      type="button"
                      onClick={() => setStatus('inativa')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                        status === 'inativa'
                          ? 'border-[#45474c] bg-[#e2e2e9]/50 ring-2 ring-[#45474c]/20 shadow-sm'
                          : 'border-[#d8e3fa] bg-[#f0f3ff] hover:bg-[#dee8ff]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e2e2e9] text-[#45474c] text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full bg-[#76777d]" />
                          Inativa
                        </span>
                        {status === 'inativa' && (
                          <CheckCircle2 className="w-4 h-4 text-[#45474c]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#3f4942] leading-tight">
                        Cadastro suspenso, sem contato recente ou mudança de paróquia.
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!nome.trim()) {
                      alert('Informe o nome do responsável.');
                      return;
                    }
                    if (cleanCpfDigits.length > 0 && !validateCpf(cpf)) {
                      alert('O CPF digitado é inválido. Corrija para avançar.');
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#1b7a53] text-white font-bold text-[13px] hover:bg-[#00603e] transition-colors"
                >
                  Avançar para Endereço →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Endereço & Moradia (com Busca Automática de CEP) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] flex items-start gap-3">
                <Home className="w-5 h-5 text-[#455f88] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-[#111c2c] text-[14px]">
                    Territorialidade & Condições de Moradia
                  </span>
                  <p className="text-[12px] text-[#3f4942]">
                    Digite o CEP para preenchimento automático do logradouro e bairro pela base postal.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CEP com Autocomplete */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold flex items-center justify-between">
                    <span>CEP</span>
                    {isSearchingCep && (
                      <span className="text-[11px] text-[#00603e] flex items-center gap-1 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] font-mono text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                    />
                    <Search className="w-4 h-4 text-[#6f7a72] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {cepStatusMessage && (
                    <span className={`text-[11px] font-semibold mt-0.5 ${cepStatusMessage.isError ? 'text-[#ba1a1a]' : 'text-[#00603e]'}`}>
                      {cepStatusMessage.text}
                    </span>
                  )}
                </div>

                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">Logradouro / Rua *</label>
                  <input
                    type="text"
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    placeholder="Rua, Avenida, Travessa..."
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">Número *</label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Nº ou S/N"
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">Bairro *</label>
                  <input
                    type="text"
                    list="bairros-sugestoes"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Informe o bairro"
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                    required
                  />
                  <datalist id="bairros-sugestoes">
                    <option value="Vila Esperança" />
                    <option value="Centro" />
                    <option value="Jardim Alvorada" />
                    <option value="Zona Rural" />
                  </datalist>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">Tipo de Habitação</label>
                  <select
                    value={tipoHabitacao}
                    onChange={(e) => setTipoHabitacao(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                  >
                    {!tipoHabitacao && (
                      <option value="" disabled>Selecione o tipo de habitação</option>
                    )}
                    <option value="Alugada">Alugada</option>
                    <option value="Própria">Própria</option>
                    <option value="Cedida por terceiros/familiares">Cedida por terceiros/familiares</option>
                    <option value="Ocupação / Assentamento Informal">Ocupação / Assentamento Informal</option>
                  </select>
                </div>

                {/* Campo dinâmico: Valor do Aluguel quando Alugada for selecionada */}
                {isAlugada && (
                  <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[12px] text-[#3f4942] font-bold flex items-center justify-between">
                      <span>Valor do Aluguel (R$)</span>
                      <span className="text-[11px] text-[#00603e] font-semibold">Mensal</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#455f88]">
                        R$
                      </span>
                      <input
                        type="text"
                        value={valorAluguel}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d,.]/g, '');
                          setValorAluguel(val);
                        }}
                        placeholder="Ex.: 650,00"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f0f3ff] border border-[#80d8aa] text-[#111c2c] text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                      />
                    </div>
                  </div>
                )}

                <div className="md:col-span-3 flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">Ponto de Referência / Instruções de Acesso</label>
                  <input
                    type="text"
                    value={pontoReferencia}
                    onChange={(e) => setPontoReferencia(e.target.value)}
                    placeholder="Ex.: Próximo à mercearia, portão azul nos fundos"
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2 rounded-xl bg-[#e7eeff] text-[#455f88] font-bold text-[13px]"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-[#1b7a53] text-white font-bold text-[13px] hover:bg-[#00603e] transition-colors"
                >
                  Avançar para Composição Familiar →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Composição Familiar */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-bold text-[#111c2c] text-[16px]">
                    Núcleo Familiar Residente
                  </span>
                  <span className="text-[12px] text-[#3f4942]">
                    Família composta por {1 + dependents.length} pessoas (1 responsável + {dependents.length} dependentes)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDepForm(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#9cf5c5] text-[#005234] hover:bg-[#80d8aa] font-bold text-[12px] flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Dependente</span>
                </button>
              </div>

              {/* Add dependent form inline */}
              {showAddDepForm && (
                <div className="p-4 rounded-xl bg-[#e7eeff] border border-[#d8e3fa] space-y-3 animate-in fade-in">
                  <span className="text-[13px] font-bold text-[#111c2c] block">Novo Membro do Núcleo Familiar</span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do dependente"
                      value={newDepName}
                      onChange={(e) => setNewDepName(e.target.value)}
                      className="sm:col-span-5 px-3 py-2 rounded-lg bg-white border border-[#dee8ff] text-[13px]"
                    />
                    <select
                      value={newDepRel}
                      onChange={(e) => setNewDepRel(e.target.value)}
                      className="sm:col-span-4 px-3 py-2 rounded-lg bg-white border border-[#dee8ff] text-[13px]"
                    >
                      <option>Filho(a)</option>
                      <option>Mãe/Pai (Idoso)</option>
                      <option>Cônjuge/Companheiro(a)</option>
                      <option>Neto(a)</option>
                      <option>Irmão(ã)</option>
                      <option>Outro Dependente</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Idade (anos)"
                      value={newDepAge}
                      onChange={(e) => setNewDepAge(e.target.value)}
                      className="sm:col-span-3 px-3 py-2 rounded-lg bg-white border border-[#dee8ff] text-[13px]"
                    />
                    <input
                      type="text"
                      placeholder="Observação do dependente (ex.: creche, PCD, estudante, idoso, etc.)"
                      value={newDepNotes}
                      onChange={(e) => setNewDepNotes(e.target.value)}
                      className="sm:col-span-12 px-3 py-2 rounded-lg bg-white border border-[#dee8ff] text-[13px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDepForm(false)}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#3f4942]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDependent}
                      className="px-4 py-1.5 rounded-lg bg-[#00603e] text-white text-[12px] font-bold"
                    >
                      Confirmar Inclusão
                    </button>
                  </div>
                </div>
              )}

              {/* Dependents list */}
              {dependents.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#f0f3ff] border border-dashed border-[#bec9c0] text-center text-[#6f7a72] text-[13px] space-y-1">
                  <p>Nenhum dependente adicional adicionado até o momento.</p>
                  <p className="text-[11px] text-[#3f4942]">Caso o titular more sozinho ou você queira incluir filhos e idosos depois, clique no botão acima.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dependents.map((dep, idx) => (
                    <div
                      key={dep.id}
                      className="p-3.5 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#dee8ff] flex items-center justify-center font-bold text-[#3f4942] text-[13px] shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#111c2c] text-[13px]">
                            {dep.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[12px] text-[#3f4942] flex-wrap">
                            <span>{dep.relationship} • {dep.age} anos</span>
                            {dep.notes && (
                              <>
                                <span>•</span>
                                <span className="text-[#00603e] font-semibold">{dep.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {dep.tag && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#d8e3fa] text-[#111c2c] text-[11px] font-semibold">
                            {dep.tag}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDependent(dep.id)}
                          className="text-[#6f7a72] hover:text-[#ba1a1a] p-1 transition-colors"
                          title="Remover dependente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campo de Observação na Tela de Composição Familiar */}
              <div className="flex flex-col gap-1.5 pt-3 border-t border-[#dee8ff]">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] text-[#3f4942] font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#00603e]" />
                    <span>Observações sobre os Dependentes e Composição Familiar</span>
                  </label>
                  <span className="text-[11px] text-[#6f7a72]">(Opcional)</span>
                </div>
                <textarea
                  rows={3}
                  value={dependentsNotes}
                  onChange={(e) => setDependentsNotes(e.target.value)}
                  placeholder="Adicione informações adicionais sobre os dependentes cadastrados (ex.: necessidades escolares ou de creche, cuidados especiais de saúde na primeira infância ou idosos, alergias, rotina de atendimento)..."
                  className="w-full p-3.5 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[13px] placeholder:text-[#6f7a72] focus:outline-none focus:ring-2 focus:ring-[#1b7a53] resize-none"
                />
                <span className="text-[11px] text-[#6f7a72]">
                  Esta anotação ficará registrada no prontuário da família para rápida consulta dos voluntários.
                </span>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2 rounded-xl bg-[#e7eeff] text-[#455f88] font-bold text-[13px]"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-[#1b7a53] text-white font-bold text-[13px] hover:bg-[#00603e] transition-colors"
                >
                  Avançar para Critérios & Renda →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Critérios */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-[#814400] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-[#111c2c] text-[14px]">
                    Enquadramento & Renda
                  </span>
                  <p className="text-[12px] text-[#3f4942]">
                    Definição do grau de prioridade de entrega e adaptação de insumos alimentares especiais.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">
                    Renda Familiar Mensal Total Estimada (R$)
                  </label>
                  <input
                    type="text"
                    value={rendaTotal}
                    onChange={(e) => setRendaTotal(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] font-mono text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                  />
                  {rendaTotal ? (
                    <span className="text-[11px] text-[#814400] font-bold mt-0.5">
                      Renda per capita: R$ {perCapita.replace('.', ',')}/pessoa ({isExtremaPobreza ? 'Extrema Pobreza' : 'Baixa Renda'})
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#6f7a72] mt-0.5">
                      Informe o valor total estimado (salários, bicos e pensões).
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-[#3f4942] font-bold">
                    Benefício de Transferência de Renda
                  </label>
                  <select
                    value={beneficio}
                    onChange={(e) => setBeneficio(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
                  >
                    <option>Bolsa Família Ativo</option>
                    <option>Bolsa Família Bloqueado / Cancelado</option>
                    <option>BPC / LOAS</option>
                    <option>Nenhum Benefício Governamental</option>
                  </select>
                </div>
              </div>

              {/* Observações / Informações complementares */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] text-[#3f4942] font-bold">
                    Observações / Informações Complementares
                  </label>
                  <span className="text-[11px] text-[#3f4942]">(Opcional)</span>
                </div>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex.: Solicitação de fraldas geriátricas, situação de saúde no domicílio, melhor horário para visita fraterna..."
                  className="w-full p-3.5 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[13px] placeholder:text-[#6f7a72] focus:outline-none focus:ring-2 focus:ring-[#1b7a53] resize-none"
                />
              </div>

              {/* Status & Entitlement Confirmation Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                status === 'em_acompanhamento'
                  ? 'bg-[#9cf5c5]/30 border-[#80d8aa]/60'
                  : status === 'promovida'
                  ? 'bg-[#d6e3ff]/40 border-[#b3cbff]'
                  : 'bg-[#e2e2e9]/60 border-[#c6c6ce]'
              }`}>
                <div className="flex items-center gap-3">
                  {status === 'em_acompanhamento' && <CheckCircle2 className="w-6 h-6 text-[#00603e] shrink-0" />}
                  {status === 'promovida' && <Sparkles className="w-6 h-6 text-[#004282] shrink-0" />}
                  {status === 'inativa' && <Ban className="w-6 h-6 text-[#45474c] shrink-0" />}
                  
                  <div className="flex flex-col">
                    <span className={`font-bold text-[14px] ${
                      status === 'em_acompanhamento' ? 'text-[#00603e]' : status === 'promovida' ? 'text-[#004282]' : 'text-[#45474c]'
                    }`}>
                      Status: {getFamilyStatusLabel(status)}
                    </span>
                    <span className="text-[12px] text-[#3f4942]">
                      {status === 'em_acompanhamento' && 'Família acolhida, apta para atendimento regular com entrega de cestas básicas e visitas pastorais.'}
                      {status === 'promovida' && 'Família superou a vulnerabilidade alimentar. Cadastro mantido para fins de histórico estatístico (não recebe cestas básicas).'}
                      {status === 'inativa' && 'Cadastro inativo. Mantido exclusivamente para histórico estatístico (não recebe cestas básicas).'}
                    </span>
                  </div>
                </div>

                {/* Quick toggle in Step 4 */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 bg-white/70 p-1 rounded-xl border border-black/5">
                  <button
                    type="button"
                    onClick={() => setStatus('em_acompanhamento')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      status === 'em_acompanhamento'
                        ? 'bg-[#00603e] text-white shadow-xs'
                        : 'text-[#3f4942] hover:bg-[#dee8ff]/50'
                    }`}
                  >
                    Em acompanhamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('promovida')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      status === 'promovida'
                        ? 'bg-[#004282] text-white shadow-xs'
                        : 'text-[#3f4942] hover:bg-[#dee8ff]/50'
                    }`}
                  >
                    Promovida
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inativa')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      status === 'inativa'
                        ? 'bg-[#45474c] text-white shadow-xs'
                        : 'text-[#3f4942] hover:bg-[#dee8ff]/50'
                    }`}
                  >
                    Inativa
                  </button>
                </div>
              </div>

              {/* Step 4 Back navigation */}
              <div className="flex items-center justify-start pt-2 border-t border-[#dee8ff]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-[#f0f3ff] text-[#3f4942] font-semibold text-[13px] hover:bg-[#dee8ff] transition-colors min-h-[44px]"
                >
                  ← Voltar para Composição Familiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-[#f0f3ff] border-t border-[#dee8ff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 h-11 sm:h-12 rounded-xl text-[#3f4942] hover:text-[#111c2c] font-semibold text-[14px] hover:bg-[#dee8ff]/50 transition-colors order-2 sm:order-1 min-h-[44px]"
          >
            Cancelar
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={() => handleFormSubmit(false)}
              disabled={Boolean(duplicateFamily)}
              className="w-full sm:w-auto px-6 h-11 sm:h-12 rounded-xl bg-[#00603e] hover:bg-[#1b7a53] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[14px] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] min-h-[44px]"
            >
              {isEditing ? <Edit3 className="w-4 h-4" /> : null}
              <span>{isEditing ? 'Salvar Alterações' : 'Salvar Cadastro'}</span>
            </button>
            {!isEditing && (
              status === 'em_acompanhamento' ? (
                <button
                  type="button"
                  onClick={() => handleFormSubmit(true)}
                  disabled={Boolean(duplicateFamily)}
                  className="w-full sm:w-auto px-6 h-11 sm:h-12 rounded-xl bg-[#1b7a53] hover:bg-[#00603e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[13px] sm:text-[14px] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] min-h-[44px]"
                >
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Salvar e Já Realizar 1ª Entrega</span>
                </button>
              ) : (
                <div className="text-[11px] text-[#45474c] bg-[#e2e2e9] px-3.5 py-2.5 rounded-xl font-medium flex items-center gap-1.5 self-center border border-[#c6c6ce]">
                  <AlertCircle className="w-4 h-4 text-[#76777d] shrink-0" />
                  <span>Famílias {getFamilyStatusLabel(status)} não recebem cestas (apenas histórico estatístico).</span>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
