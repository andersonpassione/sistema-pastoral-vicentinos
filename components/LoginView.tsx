'use client';

import React, { useState } from 'react';
import { 
  Church, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn,
  HeartHandshake,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { SystemUser, UserRole } from '@/lib/data';
import { supabase } from '@/lib/supabase';

interface LoginViewProps {
  users?: SystemUser[];
  onLogin: (user: SystemUser) => void;
}

export default function LoginView({ users = [], onLogin }: LoginViewProps) {
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanInput) {
      setError('Por favor, informe o seu usuário ou e-mail.');
      return;
    }

    if (!cleanPassword) {
      setError('Por favor, digite a sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      // Resolução dinâmica de e-mail para o Supabase Auth (sem nenhum dado hardcoded no código fonte)
      const candidateEmails: string[] = [];

      if (cleanInput.includes('@')) {
        candidateEmails.push(cleanInput);
      } else {
        // Se foi informado apenas o username, verifica se o perfil já foi carregado do banco
        const matchedSystemUser = users.find(
          (u) => u.username?.toLowerCase() === cleanInput
        );
        if (matchedSystemUser?.email && !candidateEmails.includes(matchedSystemUser.email)) {
          candidateEmails.push(matchedSystemUser.email);
        }
        candidateEmails.push(`${cleanInput}@paroquia.org`);
      }

      let authResponse: any = null;
      let lastErrorMessage = 'Usuário ou senha incorretos.';

      // Autenticação direta no Supabase Auth usando a senha exata digitada pelo usuário
      for (const email of candidateEmails) {
        try {
          const res = await supabase.auth.signInWithPassword({
            email,
            password: cleanPassword,
          });
          if (!res.error && res.data?.user) {
            authResponse = res;
            break;
          } else if (res.error) {
            lastErrorMessage = res.error.message;
          }
        } catch (e: any) {
          lastErrorMessage = e.message || lastErrorMessage;
        }
      }

      if (!authResponse?.data?.user) {
        throw new Error('Usuário ou senha incorretos no Supabase.');
      }

      const authUser = authResponse.data.user;
      const meta = authUser?.user_metadata || {};

      // Localizar perfil correspondente dinamicamente no banco ou usar metadados do Supabase Auth
      const matchedUser = users.find(
        (u) =>
          u.uid === authUser.id ||
          u.email?.toLowerCase() === authUser.email?.toLowerCase() ||
          u.username?.toLowerCase() === cleanInput
      );

      const resolvedRole: UserRole = (
        meta.role || 
        matchedUser?.role || 
        'voluntario'
      ) as UserRole;

      const resolvedName = meta.name || matchedUser?.name || cleanInput.split('@')[0];
      const resolvedShift = meta.shift || matchedUser?.shift || (resolvedRole === 'administrador' ? 'Coordenação Geral' : 'Plantão Vicentino');

      const finalUser: SystemUser = {
        id: matchedUser?.id || authUser.id,
        uid: authUser.id,
        name: resolvedName,
        username: meta.username || matchedUser?.username || cleanInput.split('@')[0],
        email: authUser.email || (cleanInput.includes('@') ? cleanInput : `${cleanInput}@paroquia.org`),
        password: '',
        role: resolvedRole,
        roleLabel: resolvedRole === 'administrador' ? 'Administrador' : 'Voluntário',
        shift: resolvedShift,
        initials: resolvedName.slice(0, 2).toUpperCase(),
      };

      onLogin(finalUser);
    } catch (err: any) {
      console.error('Falha na autenticação Supabase Auth:', err);
      setError(err.message || 'Usuário ou senha incorretos no Supabase.');
    } finally {
      setIsLoading(false);
    }
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#dee8ff] space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-[20px] font-bold text-[#111c2c]">
              Identificação de Usuário
            </h2>
            <p className="text-[13px] text-[#3f4942]">
              Informe seu usuário ou e-mail e senha para acessar o sistema.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-[#ffdad6] border border-[#ffb4ab] text-[#ba1a1a] text-[13px] font-medium flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuário ou E-mail */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#3f4942]">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#3f4942] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Digite seu usuário ou e-mail"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00603e] transition-all"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#3f4942]">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#3f4942] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00603e] transition-all"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3f4942] hover:text-[#111c2c]"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#00603e] hover:bg-[#1b7a53] disabled:opacity-70 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] min-h-[44px] cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando credenciais...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Acessar o Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Clean Footer */}
        <div className="text-center text-[12px] text-[#6f7a72] flex items-center justify-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-[#00603e]" />
          <span>Paróquia São Vicente de Paulo • Pastoral dos Vicentinos</span>
        </div>

      </div>
    </div>
  );
}
