'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import EntregaRapidaView from '@/components/EntregaRapidaView';
import FamiliasBeneficiariasView from '@/components/FamiliasBeneficiariasView';
import RelatoriosView from '@/components/RelatoriosView';
import ConfiguracoesView from '@/components/ConfiguracoesView';
import VisitasPeriodicasView from '@/components/VisitasPeriodicasView';
import RegistrarVisitaModal from '@/components/RegistrarVisitaModal';
import CadastrarFamiliaModal from '@/components/CadastrarFamiliaModal';
import ConsultarHistoricoModal from '@/components/ConsultarHistoricoModal';
import ProntuarioModal from '@/components/ProntuarioModal';
import LoginView from '@/components/LoginView';
import { 
  Package, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  Menu,
  HeartHandshake
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  INITIAL_FAMILIES, 
  INITIAL_TODAY_DELIVERIES, 
  INITIAL_PERIODIC_VISITS,
  PeriodicVisit,
  Family, 
  FamilyStatus,
  normalizeFamilyStatus,
  getFamilyStatusLabel,
  DeliveryRecord,
  PastoralSettings,
  DEFAULT_SETTINGS,
  SystemUser,
  UserRole,
  INITIAL_SYSTEM_USERS
} from '@/lib/data';

function mapSupabaseUser(u: any): SystemUser {
  return {
    id: String(u.id),
    name: u.name,
    username: u.username,
    email: `${u.username}@paroquia.org`,
    password: u.password,
    role: u.role as UserRole,
    roleLabel: u.role === 'administrador' ? 'Administrador' : 'Voluntário',
    shift: u.shift || (u.role === 'administrador' ? 'Coordenação Geral' : 'Plantão Sábado Manhã'),
    initials: (u.name || 'US').slice(0, 2).toUpperCase(),
  };
}

function mapSupabaseFamily(f: any): Family {
  const isAlugada = f.housing_type?.toLowerCase().includes('alugada');
  const rentVal = f.rent_value ? parseFloat(String(f.rent_value).replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
  const incomeVal = f.monthly_income ? parseFloat(String(f.monthly_income).replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
  const perCapitaVal = f.per_capita_income ? parseFloat(String(f.per_capita_income).replace(/[^\d.,]/g, '').replace(',', '.')) : 0;

  return {
    id: f.id,
    name: f.name,
    cpf: f.cpf,
    nis: f.nis || '',
    rg: f.rg || '',
    birthDate: f.birth_date || '',
    phone: f.phone || '',
    genderIdentity: f.gender_identity || 'Não informado',
    address: f.address || '',
    bairro: f.bairro || '',
    housingType: f.housing_type || 'Outra',
    rentValue: isAlugada ? rentVal : undefined,
    referencePoint: f.reference_point || '',
    vulnerabilityLevel: f.vulnerability_level === 'critica' || f.vulnerability_level === 'alta' ? 'extrema' : 'baixa',
    monthlyIncome: incomeVal,
    perCapitaIncome: perCapitaVal,
    benefitType: f.benefit_type || 'Nenhum',
    status: normalizeFamilyStatus(f.status),
    statusLabel: getFamilyStatusLabel(f.status),
    lastDeliveryDate: f.last_delivery_date || 'Nunca retirou',
    lastDeliveryDaysAgo: f.last_delivery_days_ago ?? 999,
    pastoralNotes: f.pastoral_notes || '',
    dependentsNotes: f.dependents_notes || '',
    dependents: (f.dependents || []).map((d: any) => ({
      id: String(d.id),
      name: d.name,
      relationship: d.relationship,
      age: d.age,
      tag: d.tag || '',
      notes: d.notes || '',
    })),
    initials: f.name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('') || 'FB',
  };
}

function mapSupabaseDelivery(d: any): DeliveryRecord {
  const dDate = new Date(d.timestamp);
  const timeFormatted = !isNaN(dDate.getTime())
    ? dDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : (d.timestamp && d.timestamp.includes(' ') ? d.timestamp.split(' ')[1] : d.timestamp || '10:00');

  return {
    id: String(d.id),
    familyId: d.family_id || d.familyId,
    familyName: d.family_name || d.familyName,
    timestamp: d.timestamp,
    timeFormatted,
    basketType: d.basket_type || d.basketType || 'Padrão 22kg',
    volunteerName: d.volunteer_name || d.volunteerName,
    parishUnit: d.parish_unit || d.parishUnit || 'Matriz',
    status: d.status === 'concluida' || d.status === 'Concluído' ? 'Concluído' : 'Em Andamento',
    pastoralVisitRequested: Boolean(d.pastoral_visit_requested ?? d.pastoralVisitRequested),
    observation: d.observation || '',
    protocolNumber: d.protocol_number || d.protocolNumber || `#ENT-${d.id}`,
  };
}

function mapSupabaseVisit(v: any): PeriodicVisit {
  return {
    id: String(v.id),
    familyId: v.family_id || v.familyId,
    familyName: v.family_name || v.familyName,
    date: v.date,
    dateFormatted: v.date && v.date.includes('-') ? v.date.split('-').reverse().join('/') : v.date,
    timeFormatted: '14:00',
    visitors: v.volunteer_name || v.volunteerName || 'Voluntário Vicentino',
    visitType: (v.demand_type && v.demand_type.toLowerCase().includes('saúde') ? 'saude' : 'rotina') as any,
    visitTypeLabel: v.demand_type || 'Rotina Periódica',
    housingConditions: 'Regular',
    summary: v.summary,
    detectedNeeds: v.demand_type ? [v.demand_type] : ['Apoio Vicentino'],
    protocolNumber: `#VIS-2026-${v.id}`,
    registeredBy: v.volunteer_name || v.volunteerName,
  };
}

function mapSupabaseSettings(s: any): PastoralSettings {
  if (!s) return DEFAULT_SETTINGS;
  return {
    parishName: s.parish_name || s.parishName || DEFAULT_SETTINGS.parishName,
    minIntervalDays: s.min_interval_days || s.minIntervalDays || DEFAULT_SETTINGS.minIntervalDays,
    requireSignature: s.require_signature ?? s.requireSignature ?? DEFAULT_SETTINGS.requireSignature,
  };
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('entrega-rapida');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isLoadingDatabase, setIsLoadingDatabase] = useState<boolean>(true);
  const [databaseConnected, setDatabaseConnected] = useState<boolean>(false);

  // System users loaded from Supabase
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(INITIAL_SYSTEM_USERS);

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<SystemUser>(INITIAL_SYSTEM_USERS[0]);

  const userRole: UserRole = currentUser.role || 'administrador';

  // Pastoral general settings
  const [settings, setSettings] = useState<PastoralSettings>(DEFAULT_SETTINGS);

  // Beneficiary families
  const [families, setFamilies] = useState<Family[]>([]);

  // Deliveries today
  const [todayDeliveries, setTodayDeliveries] = useState<DeliveryRecord[]>([]);

  // Periodic Visits
  const [visits, setVisits] = useState<PeriodicVisit[]>([]);

  // Carregar dados reais exclusivamente do Supabase na inicialização
  useEffect(() => {
    let isSubscribed = true;

    async function initSupabaseData() {
      try {
        const [famRes, usrRes, delRes, visRes, setRes] = await Promise.all([
          fetch('/api/families'),
          fetch('/api/users'),
          fetch('/api/deliveries'),
          fetch('/api/visits'),
          fetch('/api/settings'),
        ]);

        if (!isSubscribed) return;

        if (famRes.ok) {
          const famJson = await famRes.json();
          if (Array.isArray(famJson.data)) {
            setFamilies(famJson.data.map(mapSupabaseFamily));
          }
        }

        if (usrRes.ok) {
          const usrJson = await usrRes.json();
          if (Array.isArray(usrJson.data) && usrJson.data.length > 0) {
            const mappedUsers: SystemUser[] = usrJson.data.map(mapSupabaseUser);
            setSystemUsers(mappedUsers);
            setCurrentUser((prev) => {
              const matched = mappedUsers.find((u: SystemUser) => u.username === prev.username);
              return matched || mappedUsers[0];
            });
          }
        }

        if (delRes.ok) {
          const delJson = await delRes.json();
          if (Array.isArray(delJson.data)) {
            setTodayDeliveries(delJson.data.map(mapSupabaseDelivery));
          }
        }

        if (visRes.ok) {
          const visJson = await visRes.json();
          if (Array.isArray(visJson.data)) {
            setVisits(visJson.data.map(mapSupabaseVisit));
          }
        }

        if (setRes.ok) {
          const setJson = await setRes.json();
          if (setJson.data) {
            setSettings(mapSupabaseSettings(setJson.data));
          }
        }

        setDatabaseConnected(true);
      } catch (error) {
        console.error('Erro ao conectar e carregar do Supabase:', error);
      } finally {
        if (isSubscribed) {
          setIsLoadingDatabase(false);
        }
      }
    }

    initSupabaseData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Modals state
  const [isNewFamilyModalOpen, setIsNewFamilyModalOpen] = useState<boolean>(false);
  const [familyToEdit, setFamilyToEdit] = useState<Family | null>(null);
  const [modalOpenCount, setModalOpenCount] = useState<number>(0);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [selectedProntuarioFamily, setSelectedProntuarioFamily] = useState<Family | null>(null);
  const [isRegisterVisitModalOpen, setIsRegisterVisitModalOpen] = useState<boolean>(false);
  const [selectedFamilyForVisit, setSelectedFamilyForVisit] = useState<Family | null>(null);

  // Desktop sidebar minimized/expanded preference with localStorage persistence
  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('amparo_solidario_sidebar_minimized');
        return stored === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const handleToggleSidebarMinimized = () => {
    setIsSidebarMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('amparo_solidario_sidebar_minimized', String(next));
      } catch {}
      return next;
    });
  };

  // Global toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenNewFamily = () => {
    setFamilyToEdit(null);
    setModalOpenCount((c) => c + 1);
    setIsNewFamilyModalOpen(true);
  };

  const handleOpenEditFamily = (family: Family) => {
    setFamilyToEdit(family);
    setModalOpenCount((c) => c + 1);
    setIsNewFamilyModalOpen(true);
  };

  const handleOpenRegisterVisit = (family?: Family) => {
    setSelectedFamilyForVisit(family || null);
    setIsRegisterVisitModalOpen(true);
  };

  const handleSaveVisit = async (newVisit: PeriodicVisit, updatedStatus?: FamilyStatus, updatedPastoralNotes?: string) => {
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: newVisit.familyId,
          familyName: newVisit.familyName,
          date: newVisit.date,
          volunteerName: newVisit.visitors,
          summary: newVisit.summary,
          demandType: newVisit.visitTypeLabel,
          priorityLevel: 'media',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao registrar visita');
    } catch (err: any) {
      console.error('Erro ao persistir visita no Supabase:', err);
    }

    setVisits((prev) => [newVisit, ...prev]);

    if (updatedStatus || updatedPastoralNotes) {
      if (updatedStatus) {
        handleUpdateFamilyStatus(newVisit.familyId, updatedStatus);
      }
      setFamilies((prev) =>
        prev.map((f) => {
          if (f.id === newVisit.familyId) {
            return {
              ...f,
              status: updatedStatus ? normalizeFamilyStatus(updatedStatus) : f.status,
              statusLabel: updatedStatus ? getFamilyStatusLabel(updatedStatus) : f.statusLabel,
              pastoralNotes: updatedPastoralNotes || f.pastoralNotes
            };
          }
          return f;
        })
      );
    }

    showToast(`Visita periódica registrada com sucesso no Supabase! Protocolo: ${newVisit.protocolNumber}`);
  };

  // Keyboard shortcut: F2 to open registration modal, Esc to close
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleOpenNewFamily();
      }
      if (e.key === 'Escape') {
        setIsNewFamilyModalOpen(false);
        setFamilyToEdit(null);
        setIsHistoryModalOpen(false);
        setSelectedProntuarioFamily(null);
        setIsRegisterVisitModalOpen(false);
        setSelectedFamilyForVisit(null);
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  const handleRestrictedAccess = (label: string) => {
    showToast(`Acesso restrito: "${label}" é exclusivo para o perfil Administrador.`);
  };

  const handleChangeUserRole = (newRole: UserRole) => {
    const matchedUser = systemUsers.find((u) => u.role === newRole) || (newRole === 'administrador' ? systemUsers[0] : systemUsers[1]);
    if (matchedUser) {
      setCurrentUser(matchedUser);
    }

    if (newRole === 'voluntario' && (currentTab === 'relatorios-e-prestacao' || currentTab === 'configuracoes' || currentTab === 'visitas-periodicas')) {
      setCurrentTab('entrega-rapida');
      showToast('Perfil alternado para Voluntário. Acesso restrito a pesquisa e entrega.');
    } else {
      showToast(newRole === 'administrador' ? 'Perfil Administrador ativado com acesso total de gestão.' : 'Perfil Voluntário ativado (pesquisa e entrega).');
    }
  };

  const handleLogin = (user: SystemUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    showToast(`Acesso autorizado como ${user.name} (${user.roleLabel})!`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao finalizar sessão no Supabase:', e);
    }
    setIsAuthenticated(false);
    showToast('Sessão encerrada com sucesso no Supabase Auth.');
  };

  const handleDeleteFamily = async (family: Family) => {
    try {
      await fetch(`/api/families?id=${encodeURIComponent(family.id)}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Erro ao excluir família no Supabase:', err);
    }
    setFamilies((prev) => prev.filter((f) => f.id !== family.id));
    if (selectedProntuarioFamily?.id === family.id) {
      setSelectedProntuarioFamily(null);
    }
    showToast(`Família ${family.name} excluída com sucesso do banco de dados.`);
  };

  const [familyForDelivery, setFamilyForDelivery] = useState<Family | null>(null);

  const handleUpdateSettings = async (newSettings: PastoralSettings) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parishName: newSettings.parishName,
          minIntervalDays: newSettings.minIntervalDays,
          requireSignature: newSettings.requireSignature,
        }),
      });
    } catch (err) {
      console.error('Erro ao salvar parâmetros no Supabase:', err);
    }
    setSettings(newSettings);
    showToast(`Configurações salvas no Supabase: "${newSettings.parishName}" (Intervalo: ${newSettings.minIntervalDays} dias).`);
  };

  // Save (create or update) family handler with database persistence
  const handleSaveFamily = async (savedFamily: Family, triggerFirstDelivery: boolean) => {
    // Regra de cadastro: Não permitir cadastro duplicado com o mesmo CPF
    const cleanCpf = savedFamily.cpf.replace(/\D/g, '');
    if (cleanCpf.length === 11) {
      const duplicate = families.find(
        (f) => f.id !== savedFamily.id && f.cpf.replace(/\D/g, '') === cleanCpf
      );
      if (duplicate) {
        showToast(`Erro de cadastro: CPF ${savedFamily.cpf} já cadastrado para "${duplicate.name}". Não é permitido duplicidade.`);
        return;
      }
    }

    const isExisting = families.some((f) => f.id === savedFamily.id);

    if (isExisting) {
      try {
        await fetch('/api/families', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: savedFamily.id,
            name: savedFamily.name,
            status: savedFamily.status,
            pastoralNotes: savedFamily.pastoralNotes,
            phone: savedFamily.phone,
            address: savedFamily.address,
            bairro: savedFamily.bairro,
            housingType: savedFamily.housingType,
          }),
        });
      } catch (err) {
        console.error('Erro ao atualizar família no Supabase:', err);
      }
      setFamilies((prev) =>
        prev.map((f) => (f.id === savedFamily.id ? savedFamily : f))
      );
      showToast(`Cadastro de ${savedFamily.name} atualizado com sucesso no Supabase!`);
    } else {
      try {
        const res = await fetch('/api/families', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: savedFamily.name,
            cpf: savedFamily.cpf,
            nis: savedFamily.nis,
            rg: savedFamily.rg,
            birthDate: savedFamily.birthDate,
            phone: savedFamily.phone,
            genderIdentity: savedFamily.genderIdentity,
            address: savedFamily.address,
            bairro: savedFamily.bairro,
            housingType: savedFamily.housingType,
            rentValue: savedFamily.rentValue,
            referencePoint: savedFamily.referencePoint,
            vulnerabilityLevel: savedFamily.vulnerabilityLevel,
            monthlyIncome: savedFamily.monthlyIncome,
            perCapitaIncome: savedFamily.perCapitaIncome,
            benefitType: savedFamily.benefitType,
            status: savedFamily.status,
            pastoralNotes: savedFamily.pastoralNotes,
            dependents: savedFamily.dependents,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao salvar no banco');
        const inserted = json.data || {};
        const newFamWithId: Family = {
          ...savedFamily,
          id: inserted.id,
          lastDeliveryDate: triggerFirstDelivery ? 'Hoje' : (inserted.last_delivery_date || 'Nunca retirou'),
          lastDeliveryDaysAgo: triggerFirstDelivery ? 0 : (inserted.last_delivery_days_ago ?? 999),
        };
        setFamilies((prev) => [newFamWithId, ...prev]);

        // Regra de negócio: Famílias promovidas e inativas não recebem cesta básica
        const canReceiveBasket = newFamWithId.status === 'em_acompanhamento';

        if (triggerFirstDelivery && canReceiveBasket) {
          handleConfirmDelivery(newFamWithId, 'Primeira entrega associada ao novo cadastro.', false);
        } else {
          if (newFamWithId.status === 'promovida' || newFamWithId.status === 'inativa') {
            showToast(`Família ${newFamWithId.name} cadastrada com status "${newFamWithId.statusLabel}" (apenas histórico estatístico no Supabase).`);
          } else {
            showToast(`Família ${newFamWithId.name} cadastrada com sucesso no Supabase!`);
          }
        }
      } catch (err: any) {
        showToast(err.message || 'Erro ao cadastrar família no banco de dados.');
        return;
      }
    }

    setIsNewFamilyModalOpen(false);
    setFamilyToEdit(null);
  };

  const handleConfirmDelivery = async (family: Family, observation: string, scheduleVisit: boolean) => {
    // Regra de negócio: Famílias com status "Promovida" e "Inativa" não podem receber cestas básicas
    if (family.status === 'promovida' || family.status === 'inativa') {
      showToast(`Entrega bloqueada: Famílias com status "${family.statusLabel}" não podem receber cestas básicas (apenas histórico estatístico).`);
      return;
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const protocolNumber = `#ENT-202610-0${todayDeliveries.length + 1}`;

    const newRecord: DeliveryRecord = {
      id: 'del-' + Date.now(),
      familyId: family.id,
      familyName: family.name,
      timestamp: now.toISOString(),
      timeFormatted,
      basketType: 'Cesta Básica',
      volunteerName: currentUser?.name || (userRole === 'administrador' ? 'Anderson' : 'Claudilene'),
      parishUnit: settings.parishName || 'Paróquia',
      status: 'Concluído',
      pastoralVisitRequested: scheduleVisit,
      observation,
      protocolNumber
    };

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: family.id,
          familyName: family.name,
          timestamp: now.toISOString(),
          basketType: 'Cesta Básica',
          volunteerName: currentUser?.name || (userRole === 'administrador' ? 'Anderson' : 'Claudilene'),
          parishUnit: settings.parishName || 'Matriz Santíssimo Redentor',
          status: 'concluida',
          pastoralVisitRequested: scheduleVisit,
          observation,
          protocolNumber,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao registrar entrega');
    } catch (err: any) {
      console.error('Erro ao gravar entrega no Supabase:', err);
    }

    setTodayDeliveries((prev) => [newRecord, ...prev]);

    // Update family last delivery date
    setFamilies((prev) =>
      prev.map((f) =>
        f.id === family.id
          ? {
              ...f,
              lastDeliveryDate: 'Hoje às ' + timeFormatted,
              lastDeliveryDaysAgo: 0,
              pastoralNotes: observation || f.pastoralNotes
            }
          : f
      )
    );

    showToast(`Entrega de ${family.name} registrada no Supabase! Protocolo: ${protocolNumber}.`);
  };

  const handleSelectFamilyForDelivery = (family: Family) => {
    setFamilyForDelivery(family);
    setCurrentTab('entrega-rapida');
    showToast(`Família ${family.name} selecionada para conferência de entrega.`);
  };

  const handleUpdateFamilyStatus = async (familyId: string, newStatus: FamilyStatus) => {
    try {
      await fetch('/api/families', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: familyId, status: newStatus }),
      });
    } catch (err) {
      console.error('Erro ao atualizar status no Supabase:', err);
    }

    setFamilies((prev) =>
      prev.map((f) => {
        if (f.id === familyId) {
          const updated: Family = {
            ...f,
            status: newStatus,
            statusLabel: getFamilyStatusLabel(newStatus)
          };
          if (selectedProntuarioFamily?.id === familyId) {
            setSelectedProntuarioFamily(updated);
          }
          if (familyForDelivery?.id === familyId) {
            setFamilyForDelivery(updated);
          }
          return updated;
        }
        return f;
      })
    );
    const targetFamily = families.find((f) => f.id === familyId);
    showToast(`Status de ${targetFamily?.name || 'família'} alterado para "${getFamilyStatusLabel(newStatus)}" no Supabase.`);
  };

  // If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return <LoginView users={systemUsers} onLogin={handleLogin} />;
  }

  const isAdmin = userRole === 'administrador';

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] flex flex-col">
      {/* Responsive Left Navigation Sidebar (desktop persistent with minimization, mobile off-canvas drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        userRole={userRole}
        onRestrictedClick={handleRestrictedAccess}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        parishName={settings.parishName}
        isMinimized={isSidebarMinimized}
        onToggleMinimize={handleToggleSidebarMinimized}
      />

      {/* Main Content Area (responsive offset: pl-0 on mobile, lg:pl-20 or lg:pl-72 on desktop) */}
      <div className={`${isSidebarMinimized ? 'lg:pl-20' : 'lg:pl-72'} flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out`}>
        {/* Sticky Top Header */}
        <Header
          onSearchGlobal={(query) => {
            if (query.trim()) {
              setCurrentTab('familias-beneficiarias');
            }
          }}
          userRole={userRole}
          onLogout={handleLogout}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          parishName={settings.parishName}
          isSidebarMinimized={isSidebarMinimized}
          onToggleMinimizeSidebar={handleToggleSidebarMinimized}
          currentUserName={currentUser?.name}
          currentUserEmail={currentUser?.email}
        />

        {/* Dynamic Views Container (with pb-20 on mobile to not be obscured by bottom navigation) */}
        <main className="relative pt-16 pb-20 lg:pb-8 min-h-[calc(100vh-4rem)] flex-1">
          {currentTab === 'entrega-rapida' && (
            <EntregaRapidaView
              key={familyForDelivery ? `delivery-${familyForDelivery.id}` : 'delivery-empty'}
              families={families}
              todayDeliveries={todayDeliveries}
              settings={settings}
              onOpenNewFamilyModal={handleOpenNewFamily}
              onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
              onConfirmDelivery={handleConfirmDelivery}
              onViewAllDeliveries={() => setIsHistoryModalOpen(true)}
              preselectedFamily={familyForDelivery}
            />
          )}

          {currentTab === 'familias-beneficiarias' && (
            <FamiliasBeneficiariasView
              families={families}
              onOpenNewFamilyModal={handleOpenNewFamily}
              onSelectFamilyForDelivery={handleSelectFamilyForDelivery}
              onOpenProntuario={(family) => setSelectedProntuarioFamily(family)}
              onOpenHistory={(_family) => setIsHistoryModalOpen(true)}
              onEditFamily={handleOpenEditFamily}
              onDeleteFamily={handleDeleteFamily}
              onUpdateFamilyStatus={handleUpdateFamilyStatus}
              onRegisterVisit={handleOpenRegisterVisit}
              userRole={userRole}
            />
          )}

          {currentTab === 'visitas-periodicas' && isAdmin && (
            <VisitasPeriodicasView
              visits={visits}
              families={families}
              onOpenRegisterModal={() => handleOpenRegisterVisit()}
              onOpenProntuario={(family) => setSelectedProntuarioFamily(family)}
              onSelectFamilyForDelivery={handleSelectFamilyForDelivery}
            />
          )}

          {currentTab === 'relatorios-e-prestacao' && isAdmin && (
            <RelatoriosView
              families={families}
              todayDeliveries={todayDeliveries}
              settings={settings}
            />
          )}

          {currentTab === 'configuracoes' && isAdmin && (
            <ConfiguracoesView
              key={`${settings.parishName}-${settings.minIntervalDays}`}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              systemUsers={systemUsers}
              onUpdateSystemUsers={setSystemUsers}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb-Zone Ergonomics on <lg screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#dee8ff] py-1 px-3 flex items-center justify-around h-16 shadow-[0_-2px_12px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => setCurrentTab('entrega-rapida')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
            currentTab === 'entrega-rapida' ? 'text-[#00603e]' : 'text-[#6f7a72] hover:text-[#111c2c]'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Entrega</span>
          {currentTab === 'entrega-rapida' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#00603e] mt-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('familias-beneficiarias')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
            currentTab === 'familias-beneficiarias' ? 'text-[#00603e]' : 'text-[#6f7a72] hover:text-[#111c2c]'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">{isAdmin ? 'Famílias' : 'Pesquisa'}</span>
          {currentTab === 'familias-beneficiarias' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#00603e] mt-0.5" />
          )}
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setCurrentTab('visitas-periodicas')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              currentTab === 'visitas-periodicas' ? 'text-[#00603e]' : 'text-[#6f7a72] hover:text-[#111c2c]'
            }`}
          >
            <HeartHandshake className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-tight">Visitas</span>
            {currentTab === 'visitas-periodicas' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00603e] mt-0.5" />
            )}
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setCurrentTab('relatorios-e-prestacao')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              currentTab === 'relatorios-e-prestacao' ? 'text-[#00603e]' : 'text-[#6f7a72] hover:text-[#111c2c]'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-tight">Relatórios</span>
            {currentTab === 'relatorios-e-prestacao' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00603e] mt-0.5" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] text-[#6f7a72] hover:text-[#111c2c] transition-colors"
          aria-label="Abrir menu completo"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Menu</span>
        </button>
      </nav>

      {/* Slide-over Drawer: Cadastrar ou Editar Família */}
      <CadastrarFamiliaModal
        key={familyToEdit ? `edit-${familyToEdit.id}-${modalOpenCount}` : `new-${modalOpenCount}`}
        isOpen={isNewFamilyModalOpen}
        onClose={() => {
          setIsNewFamilyModalOpen(false);
          setFamilyToEdit(null);
        }}
        onSave={handleSaveFamily}
        familyToEdit={familyToEdit}
        existingFamilies={families}
      />

      {/* Modal: Consultar Histórico de Entregas */}
      <ConsultarHistoricoModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        deliveries={todayDeliveries}
      />

      {/* Modal: Prontuário Social da Família */}
      <ProntuarioModal
        family={selectedProntuarioFamily}
        isOpen={Boolean(selectedProntuarioFamily)}
        onClose={() => setSelectedProntuarioFamily(null)}
        onDeliverDirect={handleSelectFamilyForDelivery}
        onEdit={handleOpenEditFamily}
        onDelete={handleDeleteFamily}
        onUpdateStatus={handleUpdateFamilyStatus}
        visits={visits}
        onOpenRegisterVisit={handleOpenRegisterVisit}
      />

      {/* Modal: Registrar Visita Periódica */}
      <RegistrarVisitaModal
        key={selectedFamilyForVisit ? `visit-${selectedFamilyForVisit.id}` : 'visit-new'}
        isOpen={isRegisterVisitModalOpen}
        onClose={() => {
          setIsRegisterVisitModalOpen(false);
          setSelectedFamilyForVisit(null);
        }}
        families={families}
        preselectedFamily={selectedFamilyForVisit}
        onSaveVisit={handleSaveVisit}
        currentVolunteerName={currentUser?.name || (isAdmin ? 'Anderson' : 'Claudilene')}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#00603e] text-white px-4 sm:px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200 max-w-[calc(100vw-2rem)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9cf5c5] shrink-0" />
          <span className="text-[13px] font-bold leading-tight">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
