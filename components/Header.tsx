'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  X, 
  User, 
  ShieldCheck, 
  LogOut,
  Menu,
  Church,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { Family } from '@/lib/data';

interface HeaderProps {
  families?: Family[];
  onSearchGlobal?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  onSelectFamilyForDelivery?: (family: Family) => void;
  onOpenProntuario?: (family: Family) => void;
  userRole: 'administrador' | 'voluntario' | 'coordenador';
  onChangeUserRole?: (role: 'administrador' | 'voluntario') => void;
  onLogout: () => void;
  onToggleMobileSidebar?: () => void;
  parishName?: string;
  isSidebarMinimized?: boolean;
  onToggleMinimizeSidebar?: () => void;
  currentUserName?: string;
  currentUserEmail?: string;
}

export default function Header({
  families = [],
  onSearchGlobal,
  onSearchSubmit,
  onSelectFamilyForDelivery,
  onOpenProntuario,
  userRole,
  onLogout,
  onToggleMobileSidebar,
  isSidebarMinimized = false,
  onToggleMinimizeSidebar,
  currentUserName,
  currentUserEmail
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const matchingFamilies = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];
    const cleanDigits = q.replace(/[.\-\s]/g, '');
    return families
      .filter((f) => {
        const matchName = f.name.toLowerCase().includes(q);
        const matchCpf = cleanDigits ? f.cpf.replace(/[.\-\s]/g, '').includes(cleanDigits) : false;
        const matchNis = cleanDigits && f.nis ? f.nis.replace(/[.\-\s]/g, '').includes(cleanDigits) : false;
        const matchBairro = f.bairro ? f.bairro.toLowerCase().includes(q) : false;
        return matchName || matchCpf || matchNis || matchBairro;
      })
      .slice(0, 8);
  }, [families, searchValue]);

  const notifications = [
    {
      id: 1,
      title: 'Visita Pastoral de Acolhimento Solicitada',
      text: 'Dona Maria Francisca solicitou presença dos vicentinos no próximo sábado.',
      time: 'Há 40 min',
      type: 'warning'
    },
    {
      id: 2,
      title: 'Plantão Paroquial Ativo',
      text: 'Atendimentos de entrega de benefícios em andamento na Paróquia.',
      time: 'Há 1 hora',
      type: 'success'
    }
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setShowSearchResults(Boolean(val.trim()));
    if (onSearchGlobal) {
      onSearchGlobal(val);
    }
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;

    if (matchingFamilies.length === 1 && onSelectFamilyForDelivery) {
      onSelectFamilyForDelivery(matchingFamilies[0]);
      setShowSearchResults(false);
      return;
    }

    setShowSearchResults(false);
    if (onSearchSubmit) {
      onSearchSubmit(q);
    }
  };

  const isAdmin = userRole === 'administrador' || userRole === 'coordenador';
  const displayName = currentUserName || (isAdmin ? 'Administrador' : 'Voluntário');

  return (
    <header className={`fixed top-0 left-0 ${isSidebarMinimized ? 'lg:left-20' : 'lg:left-72'} right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-[#dee8ff]/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-3 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out`}>
      {/* Left side: Hamburger on mobile / Toggle on desktop + Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md mr-2">
        {/* Desktop Minimize/Expand Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleMinimizeSidebar}
          className="hidden lg:flex p-2 rounded-xl text-[#455f88] hover:text-[#111c2c] hover:bg-[#f0f3ff] transition-colors shrink-0 min-h-[40px] min-w-[40px] items-center justify-center border border-[#d8e3fa]/70"
          title={isSidebarMinimized ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
          aria-label={isSidebarMinimized ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
        >
          {isSidebarMinimized ? (
            <PanelLeftOpen className="w-5 h-5 text-[#00603e]" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-[#455f88]" />
          )}
        </button>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 sm:p-2.5 rounded-xl text-[#3f4942] hover:text-[#111c2c] hover:bg-[#f0f3ff] transition-colors lg:hidden shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small screen mobile brand mark (visible on very small screens) */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0 sm:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#9cf5c5] flex items-center justify-center text-[#00603e]">
            <Church className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>

        {/* Global Search Bar with Live Dropdown */}
        <div ref={searchContainerRef} className="relative flex-1 min-w-0">
          <form onSubmit={handleSearchFormSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3f4942] w-4 h-4 pointer-events-none" />
            <input
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchValue.trim()) setShowSearchResults(true);
              }}
              type="text"
              placeholder="Buscar por CPF ou Nome..."
              className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa]/80 text-[#111c2c] placeholder:text-[#6f7a72] text-[12px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1b7a53] transition-all"
            />
            {searchValue && (
              <button 
                type="button"
                onClick={() => {
                  setSearchValue('');
                  setShowSearchResults(false);
                  if (onSearchGlobal) onSearchGlobal('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6f7a72] hover:text-[#111c2c] p-1"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && searchValue.trim() && (
            <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-16 sm:top-full sm:mt-2 sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-[#dee8ff] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2.5 bg-[#f0f3ff] border-b border-[#dee8ff] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3f4942]">
                  Famílias Encontradas ({matchingFamilies.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowSearchResults(false)}
                  className="text-[#6f7a72] hover:text-[#111c2c] p-0.5"
                  aria-label="Fechar resultados"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {matchingFamilies.length > 0 ? (
                <div className="max-h-72 overflow-y-auto divide-y divide-[#dee8ff]/60">
                  {matchingFamilies.map((fam) => {
                    const isActive = fam.status === 'em_acompanhamento';
                    return (
                      <div
                        key={fam.id}
                        className="p-3 hover:bg-[#f0f3ff]/70 transition-colors flex items-center justify-between gap-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowSearchResults(false);
                            if (onSelectFamilyForDelivery) {
                              onSelectFamilyForDelivery(fam);
                            } else if (onOpenProntuario) {
                              onOpenProntuario(fam);
                            }
                          }}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#9cf5c5] text-[#00603e] font-bold text-[12px] flex items-center justify-center shrink-0">
                            {fam.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-bold text-[#111c2c] truncate">
                                {fam.name}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                                isActive
                                  ? 'bg-[#9cf5c5]/60 text-[#005234]'
                                  : fam.status === 'promovida'
                                    ? 'bg-[#d6e3ff] text-[#004282]'
                                    : 'bg-[#e2e2e9] text-[#45474c]'
                              }`}>
                                {fam.statusLabel}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#3f4942] block truncate">
                              CPF: {fam.cpf} {fam.bairro ? `• ${fam.bairro}` : ''}
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {onOpenProntuario && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowSearchResults(false);
                                onOpenProntuario(fam);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#004282] text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Abrir Prontuário Social"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Prontuário</span>
                            </button>
                          )}
                          {onSelectFamilyForDelivery && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowSearchResults(false);
                                onSelectFamilyForDelivery(fam);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-[#00603e] hover:bg-[#1b7a53] text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Selecionar para Entrega Rápida"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Entrega</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 text-center text-[12px] text-[#3f4942]">
                  Nenhuma família encontrada para &quot;{searchValue}&quot;.
                </div>
              )}

              {onSearchSubmit && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchResults(false);
                    onSearchSubmit(searchValue.trim());
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] hover:bg-[#f0f3ff] border-t border-[#dee8ff] text-[12px] font-bold text-[#00603e] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Ver resultados em Famílias Beneficiárias</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right controls: Notifications & User Role Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Notifications toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2.5 rounded-xl text-[#3f4942] hover:text-[#111c2c] hover:bg-[#f0f3ff] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Avisos e comunicados pastorais"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-xl border border-[#dee8ff] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#dee8ff]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[14px] text-[#111c2c]">Notificações do Plantão</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#9cf5c5] text-[#005234] text-[11px] font-bold">
                    {unreadNotifications} novas
                  </span>
                </div>
                <button
                  onClick={() => setUnreadNotifications(0)}
                  className="text-[11px] text-[#00603e] font-semibold hover:underline"
                >
                  Marcar lidas
                </button>
              </div>

              <div className="flex flex-col gap-2.5 mt-3 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eeff] transition-colors">
                    <span className="text-[12px] font-bold text-[#111c2c] block leading-tight">
                      {n.title}
                    </span>
                    <p className="text-[11px] text-[#3f4942] mt-1 leading-relaxed">
                      {n.text}
                    </p>
                    <span className="text-[10px] text-[#6f7a72] mt-1 block">
                      {n.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-7 w-px bg-[#dee8ff] hidden sm:block" />

        {/* User Profile with Role Selection: Administrador (Anderson) or Voluntário (Claudilene) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 sm:pr-2.5 rounded-xl hover:bg-[#f0f3ff] transition-all cursor-pointer text-left min-h-[44px]"
            title="Alternar entre perfil Administrador ou Voluntário"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#9cf5c5] text-[#00603e] font-bold flex items-center justify-center text-[12px] sm:text-[13px] ring-2 ring-[#80d8aa]/40 shadow-sm shrink-0">
              {(displayName || 'US').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-[#111c2c] font-bold leading-tight">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#3f4942]" />
              </div>
              <span className="text-[11px] text-[#3f4942] leading-tight">
                {isAdmin ? 'Administrador' : 'Voluntário'}
              </span>
            </div>
          </button>

          {/* User Profile Details Modal / Dropdown */}
          {showUserMenu && (
            <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-xl border border-[#dee8ff] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
              {/* Profile Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#dee8ff]">
                <div className="w-11 h-11 rounded-full bg-[#9cf5c5] text-[#00603e] font-bold flex items-center justify-center text-[14px] ring-2 ring-[#80d8aa]/40 shadow-sm shrink-0">
                  {(displayName || 'US').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-bold text-[#111c2c] truncate">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-[#3f4942] truncate">
                    {currentUserEmail || ''}
                  </span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isAdmin 
                        ? 'bg-[#9cf5c5] text-[#005234] border-[#00603e]/30' 
                        : 'bg-[#d6e3ff] text-[#004282] border-[#004282]/30'
                    }`}>
                      {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      <span>{isAdmin ? 'Perfil Administrador' : 'Perfil Voluntário'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-[12px] font-bold text-[#004282] bg-[#e7eeff] hover:bg-[#dee8ff] transition-colors min-h-[42px]"
                >
                  <User className="w-4 h-4 text-[#00603e]" />
                  <span>Trocar de Usuário (Fazer Login)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-[12px] font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-colors min-h-[42px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="p-2.5 rounded-xl text-[#3f4942] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Sair do sistema (Encerrar plantão)"
          aria-label="Sair do sistema"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
