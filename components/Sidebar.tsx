'use client';

import React from 'react';
import { 
  Package, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  Church, 
  Lock,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  HeartHandshake
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: 'administrador' | 'voluntario' | 'coordenador';
  onRestrictedClick: (tabLabel: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  parishName?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  userRole,
  onRestrictedClick,
  isOpen = false,
  onClose,
  parishName,
  isMinimized = false,
  onToggleMinimize
}: SidebarProps) {
  const isAdmin = userRole === 'administrador' || userRole === 'coordenador';

  const navItems = [
    {
      id: 'entrega-rapida',
      label: 'Entrega Rápida',
      icon: Package,
      requiresAdmin: false
    },
    {
      id: 'familias-beneficiarias',
      label: isAdmin ? 'Famílias Beneficiárias' : 'Pesquisa de Famílias',
      icon: Users,
      requiresAdmin: false
    },
    {
      id: 'visitas-periodicas',
      label: 'Visitas Periódicas',
      icon: HeartHandshake,
      requiresAdmin: true
    },
    {
      id: 'relatorios-e-prestacao',
      label: 'Relatórios & Prestação',
      icon: FileSpreadsheet,
      requiresAdmin: true
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      requiresAdmin: true
    }
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.requiresAdmin && !isAdmin) {
      onRestrictedClick(item.label);
      return;
    }
    onSelectTab(item.id);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#263142]/50 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar drawer: persistent on desktop (lg:), slide-over on mobile */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-[#dee8ff]/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isMinimized ? 'w-72 lg:w-20' : 'w-72'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className={`h-16 lg:h-20 flex items-center border-b border-[#dee8ff]/60 select-none transition-all ${
            isMinimized ? 'px-3 justify-between lg:justify-center' : 'px-5 lg:px-6 justify-between'
          }`}>
            {isMinimized ? (
              <>
                {/* On desktop minimized: single icon that toggles */}
                <div className="hidden lg:flex flex-col items-center justify-center">
                  <button
                    type="button"
                    onClick={onToggleMinimize}
                    className="w-10 h-10 rounded-xl bg-[#9cf5c5] flex items-center justify-center text-[#00603e] shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-transform"
                    title="Expandir menu de navegação"
                    aria-label="Expandir menu de navegação"
                  >
                    <Church className="w-5 h-5 stroke-[2.2]" />
                  </button>
                </div>

                {/* On mobile: standard brand title and close button */}
                <div className="flex lg:hidden items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#9cf5c5] flex items-center justify-center text-[#00603e] shrink-0 shadow-sm">
                    <Church className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[16px] font-bold text-[#00603e] leading-tight tracking-tight truncate">
                      Sistema de Gestão
                    </span>
                    <span className="text-[10px] font-bold text-[#3f4942] uppercase tracking-wider truncate" title={parishName || 'Pastoral dos Vicentinos'}>
                      {parishName || 'Pastoral dos Vicentinos'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-[#3f4942] hover:bg-[#f0f3ff] lg:hidden"
                  aria-label="Fechar menu lateral"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#9cf5c5] flex items-center justify-center text-[#00603e] shrink-0 shadow-sm">
                    <Church className="w-5 h-5 lg:w-6 lg:h-6 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[16px] lg:text-[17px] font-bold text-[#00603e] leading-tight tracking-tight truncate">
                      Sistema de Gestão
                    </span>
                    <span className="text-[10px] lg:text-[11px] font-bold text-[#3f4942] uppercase tracking-wider truncate" title={parishName || 'Pastoral dos Vicentinos'}>
                      {parishName || 'Pastoral dos Vicentinos'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Desktop minimize button */}
                  <button
                    type="button"
                    onClick={onToggleMinimize}
                    className="hidden lg:flex p-2 rounded-xl text-[#455f88] hover:text-[#111c2c] hover:bg-[#f0f3ff] transition-colors"
                    title="Minimizar menu lateral"
                    aria-label="Minimizar menu lateral"
                  >
                    <PanelLeftClose className="w-5 h-5" />
                  </button>

                  {/* Mobile close button */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg text-[#3f4942] hover:bg-[#f0f3ff] lg:hidden"
                    aria-label="Fechar menu lateral"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Navigation Items */}
          <nav className={`flex flex-col gap-1.5 py-5 lg:py-6 ${
            isMinimized ? 'px-3 lg:px-2.5 lg:items-center' : 'px-3 lg:px-4'
          }`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isLocked = item.requiresAdmin && !isAdmin;

              if (isMinimized) {
                return (
                  <React.Fragment key={item.id}>
                    {/* Desktop Icon-Only Minimized button */}
                    <button
                      type="button"
                      onClick={() => handleNavClick(item)}
                      title={`${item.label}${isLocked ? ' (Exclusivo Administrador)' : ''}`}
                      className={`relative hidden lg:flex w-12 h-12 rounded-xl items-center justify-center transition-all duration-200 group ${
                        isActive
                          ? 'bg-[#00603e] text-white shadow-md'
                          : isLocked
                          ? 'text-[#6f7a72] opacity-75 hover:bg-[#f0f3ff]'
                          : 'text-[#455f88] hover:bg-[#dee8ff]/60 hover:text-[#111c2c]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {isLocked && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f0f3ff] border border-[#d8e3fa] text-[#6f7a72] flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      )}
                      
                      {/* Floating tooltip on hover */}
                      <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[#111c2c] text-white text-[12px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg pointer-events-none">
                        {item.label}
                        {isLocked && ' (Administrador)'}
                      </span>
                    </button>

                    {/* Mobile normal item (in mobile drawer) */}
                    <button
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={`flex lg:hidden items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-[14px] transition-all duration-200 text-left min-h-[44px] ${
                        isActive
                          ? 'bg-[#00603e] text-white shadow-sm'
                          : isLocked
                          ? 'text-[#6f7a72] opacity-75 hover:bg-[#f0f3ff]'
                          : 'text-[#3f4942] hover:bg-[#dee8ff]/50 hover:text-[#111c2c]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : isLocked ? 'text-[#6f7a72]' : 'text-[#455f88]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isLocked && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#f0f3ff] text-[#6f7a72] font-bold shrink-0">
                          <Lock className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center justify-between px-3.5 lg:px-4 py-3 rounded-xl font-semibold text-[14px] transition-all duration-200 text-left min-h-[44px] ${
                    isActive
                      ? 'bg-[#00603e] text-white shadow-sm'
                      : isLocked
                      ? 'text-[#6f7a72] opacity-75 hover:bg-[#f0f3ff]'
                      : 'text-[#3f4942] hover:bg-[#dee8ff]/50 hover:text-[#111c2c]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : isLocked ? 'text-[#6f7a72]' : 'text-[#455f88]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isLocked && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#f0f3ff] text-[#6f7a72] font-bold shrink-0">
                      <Lock className="w-3 h-3" /> Admin
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info badge */}
        {isMinimized ? (
          <>
            {/* Desktop icon footer */}
            <div className="hidden lg:flex flex-col items-center gap-2 p-2 mb-3">
              <button
                type="button"
                onClick={onToggleMinimize}
                className="w-10 h-10 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#455f88] flex items-center justify-center transition-colors"
                title="Expandir menu de navegação"
                aria-label="Expandir menu"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
              <div 
                className="w-2.5 h-2.5 rounded-full bg-[#00603e] animate-pulse" 
                title={isAdmin ? 'Anderson • Administrador' : 'Claudilene • Voluntário'}
              />
            </div>

            {/* Mobile full footer */}
            <div className="flex lg:hidden p-4 border-t border-[#dee8ff]/60 mx-3 mb-3 bg-[#f0f3ff] rounded-2xl flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00603e]" />
                <span className="text-[11px] font-bold text-[#00603e] uppercase tracking-wide">
                  {isAdmin ? 'Anderson (Administrador)' : 'Claudilene (Voluntário)'}
                </span>
              </div>
              <span className="text-[11px] text-[#3f4942] block mt-0.5">
                {isAdmin ? 'Acesso total ao sistema' : 'Pesquisa e entrega da cesta'}
              </span>
            </div>
          </>
        ) : (
          <div className="p-4 border-t border-[#dee8ff]/60 mx-3 mb-3 bg-[#f0f3ff] rounded-2xl flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00603e]" />
                <span className="text-[11px] font-bold text-[#00603e] uppercase tracking-wide">
                  {isAdmin ? 'Anderson (Administrador)' : 'Claudilene (Voluntário)'}
                </span>
              </div>
              <span className="text-[11px] text-[#3f4942] block mt-0.5">
                {isAdmin ? 'Acesso total de gestão' : 'Pesquisa & entrega da cesta'}
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleMinimize}
              className="hidden lg:flex p-1.5 rounded-lg text-[#6f7a72] hover:text-[#111c2c] hover:bg-[#dee8ff]/60 transition-colors"
              title="Minimizar menu lateral"
              aria-label="Minimizar menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
