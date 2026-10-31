'use client';

import React, { useState } from 'react';
import { 
  Church, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  User, 
  LogIn,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { SystemUser, UserRole } from '@/lib/data';
import { supabase } from '@/lib/supabase';

interface LoginViewProps {
  users: SystemUser[];
  onLogin: (user: SystemUser) => void;
}

export default function LoginView({ users, onLogin }: LoginViewProps) {
  const adminUser = users.find((u) => u.role === 'administrador') || users[0];
  const [selectedRole, setSelectedRole] = useState<UserRole>('administrador');
  const [usernameInput, setUsernameInput] = useState<string>(() => adminUser?.username || 'anderson');
  const [passwordInput, setPasswordInput] = useState<string>('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    if (role === 'administrador') {
      const targetAdmin = users.find((u) => u.role === 'administrador') || users[0];
      setUsernameInput(targetAdmin?.username || 'anderson');
      setPasswordInput('123456');
    } else {
      const volUser = users.find((u) => u.role === 'voluntario') || users[1];
      setUsernameInput(volUser?.username || 'claudilene');
      setPasswordInput('123456');
    }
  };

  const handleQuickFill = (role: UserRole) => {
    handleRoleChange(role);
  };

  const executeAuth = async (emailOrUsername: string, pass: string) => {
    setIsLoading(true);
    setError('');

    try {
      const cleanInput = emailOrUsername.trim().toLowerCase();
      // Normalize to email if username only
      const email = cleanInput.includes('@') ? cleanInput : `${cleanInput}@paroquia.org`;

      // 1. Tentar login oficial via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (authError) {
        // Se as credenciais estiverem incorretas no Supabase Auth
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('E-mail/usuário ou senha incorretos no Supabase Auth.');
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('E-mail ainda não confirmado no Supabase.');
        } else {
          throw new Error(authError.message || 'Erro na autenticação com o Supabase.');
        }
      }

      // 2. Login no Supabase Auth teve sucesso!
      const authUser = authData.user;
      const meta = authUser?.user_metadata || {};
      
      // Encontrar ou mapear usuário correspondente no sistema
      const matchedUser = users.find(
        (u) =>
          u.uid === authUser.id ||
          u.email?.toLowerCase() === email ||
          u.username.toLowerCase() === (meta.username || cleanInput.split('@')[0])
      );

      const resolvedRole: UserRole = (meta.role || matchedUser?.role || (email.startsWith('anderson') ? 'administrador' : 'voluntario')) as UserRole;
      const resolvedName = meta.name || matchedUser?.name || (resolvedRole === 'administrador' ? 'Anderson' : 'Claudilene');
      const resolvedShift = meta.shift || matchedUser?.shift || 'Plantão';

      const finalUser: SystemUser = {
        id: matchedUser?.id || authUser.id,
        uid: authUser.id,
        name: resolvedName,
        username: meta.username || matchedUser?.username || cleanInput.split('@')[0],
        email: email,
        password: '••••••••',
        role: resolvedRole,
        roleLabel: resolvedRole === 'administrador' ? 'Administrador' : 'Voluntário',
        shift: resolvedShift,
        initials: resolvedName.slice(0, 2).toUpperCase(),
      };

      onLogin(finalUser);
    } catch (err: any) {
      console.error('Falha no login Supabase Auth:', err);
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanInput = usernameInput.trim();
    if (!cleanInput) {
      setError('Por favor, informe o nome de usuário ou e-mail.');
      return;
    }

    if (!passwordInput) {
      setError('Por favor, digite a senha de acesso.');
      return;
    }

    if (passwordInput.length < 6) {
      setError('A senha no Supabase Auth deve ter no mínimo 6 caracteres.');
      return;
    }

    await executeAuth(cleanInput, passwordInput);
  };

  return (
    <div className="min-h-screen bg-[#f0f3ff] flex flex-col justify-center items-center p-4 selection:bg-[#9cf5c5] selection:text-[#002112]">
      <div className="w-full max-w-md mx-auto space-y-6">
        
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#9cf5c5] text-[#00603e] shadow-md ring-4 ring-white">
            <Church className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[#111c2c] tracking-tight">
              Sistema de Gestão
            </h1>
            <p className="text-[13px] font-bold text-[#00603e] uppercase tracking-wider">
              Pastoral dos Vicentinos
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#dee8ff] space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5e9] border border-[#c8e6c9] text-[#1b5e20] text-[11px] font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Autenticação Nativa Supabase Auth Ativa</span>
            </div>
            <h2 className="text-[18px] font-bold text-[#111c2c]">
              Identificação Segura de Usuário
            </h2>
            <p className="text-[12px] sm:text-[13px] text-[#3f4942]">
              Credenciais protegidas com hash criptográfico e tokens JWT.
            </p>
          </div>

          {/* Role selector toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#f0f3ff] rounded-xl border border-[#d8e3fa]">
            <button
              type="button"
              onClick={() => handleRoleChange('administrador')}
              className={`py-2 px-3 rounded-lg text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedRole === 'administrador'
                  ? 'bg-white text-[#00603e] shadow-sm'
                  : 'text-[#3f4942] hover:text-[#111c2c]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Administrador</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('voluntario')}
              className={`py-2 px-3 rounded-lg text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedRole === 'voluntario'
                  ? 'bg-white text-[#00603e] shadow-sm'
                  : 'text-[#3f4942] hover:text-[#111c2c]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Voluntário</span>
            </button>
          </div>

          {/* Role Permission Hint */}
          <div className="p-3 rounded-xl bg-[#f9f9ff] border border-[#dee8ff] text-[11px] sm:text-[12px] text-[#3f4942]">
            {selectedRole === 'administrador' ? (
              <span className="text-[#004282] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00603e] shrink-0" />
                <span><strong>Anderson (Administrador):</strong> Acesso total a relatórios, configurações e gestão.</span>
              </span>
            ) : (
              <span className="text-[#a45800] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00603e] shrink-0" />
                <span><strong>Claudilene (Voluntário):</strong> Acesso focado em <strong>pesquisa de famílias</strong> e <strong>entrega da cesta</strong>.</span>
              </span>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-[#ffdad6] border border-[#ffb4ab] text-[#ba1a1a] text-[12px] font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                <p className="font-normal text-[11px] text-[#ba1a1a]/80 mt-0.5">
                  Dica: Senha padrão de teste é <strong>123456</strong> (mínimo de 6 caracteres do Supabase).
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuário */}
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#3f4942]">
                Usuário ou E-mail (Supabase Auth)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#3f4942] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Ex: anderson ou anderson@paroquia.org"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00603e]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold text-[#3f4942]">
                  Senha de Acesso
                </label>
                <span className="text-[11px] text-[#00603e] font-semibold">
                  Padrão seguro: 123456
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#3f4942] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00603e]"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3f4942] hover:text-[#111c2c]"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#00603e] hover:bg-[#1b7a53] disabled:opacity-70 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando no Supabase Auth...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar com Supabase Auth</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access Helper */}
          <div className="pt-3 border-t border-[#dee8ff] text-center space-y-2">
            <span className="text-[11px] text-[#3f4942] font-semibold block">
              Preenchimento rápido de credenciais cadastradas:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('administrador')}
                className="px-3 py-2 rounded-xl bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004282] text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#00603e]" />
                <span>Anderson (Admin)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('voluntario')}
                className="px-3 py-2 rounded-xl bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004282] text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <User className="w-3.5 h-3.5 text-[#00603e]" />
                <span>Claudilene (Voluntária)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="p-3.5 rounded-2xl bg-white/70 border border-[#dee8ff] text-[11px] text-[#3f4942] space-y-1 text-center">
          <p className="font-semibold text-[#00603e] flex items-center justify-center gap-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Gerenciamento pelo Painel Supabase:</span>
          </p>
          <p>
            Você pode adicionar ou redefinir usuários diretamente em{' '}
            <strong className="text-[#111c2c]">Authentication &gt; Users &gt; Add user</strong> no painel do Supabase.
          </p>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[12px] text-[#6f7a72] flex items-center justify-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-[#00603e]" />
          <span>Paróquia São Vicente de Paulo • Pastoral dos Vicentinos</span>
        </div>

      </div>
    </div>
  );
}
