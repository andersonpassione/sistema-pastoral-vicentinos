'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  User, 
  Check, 
  Plus, 
  Trash2, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Database,
  Edit2
} from 'lucide-react';
import { PastoralSettings, SystemUser, UserRole } from '@/lib/data';

interface ConfiguracoesViewProps {
  settings: PastoralSettings;
  onUpdateSettings: (newSettings: PastoralSettings) => void;
  systemUsers: SystemUser[];
  onUpdateSystemUsers: (users: SystemUser[]) => void;
}

export default function ConfiguracoesView({ 
  settings, 
  onUpdateSettings,
  systemUsers,
  onUpdateSystemUsers
}: ConfiguracoesViewProps) {
  const [minIntervalDays, setMinIntervalDays] = useState(settings.minIntervalDays || 30);
  const [parishName, setParishName] = useState(settings.parishName || 'Paróquia São Vicente de Paulo');
  const [requireSignature, setRequireSignature] = useState(settings.requireSignature ?? true);
  const [saved, setSaved] = useState(false);

  // New user form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newRole, setNewRole] = useState<UserRole>('voluntario');
  const [newShift, setNewShift] = useState('Plantão Semanal');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Edit password state
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minIntervalDays,
          parishName,
          requireSignature,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao salvar no banco de dados');
      }

      onUpdateSettings({
        ...settings,
        minIntervalDays,
        parishName,
        requireSignature,
      });
      setSaved(true);
      setFeedbackMessage('Parâmetros salvos e sincronizados no Supabase com sucesso!');
      setTimeout(() => {
        setSaved(false);
        setFeedbackMessage('');
      }, 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao conectar ao banco de dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) return;

    if (newPassword.trim().length < 6) {
      alert('Por segurança do Supabase Auth, a senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          username: newUsername.trim().toLowerCase(),
          password: newPassword.trim(),
          role: newRole,
          shift: newShift,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao criar usuário no Supabase');
      }

      const createdUser = json.data;
      const initials = newName.trim().slice(0, 2).toUpperCase();
      const newUser: SystemUser = {
        id: String(createdUser.id),
        uid: createdUser.uid,
        name: createdUser.name,
        username: createdUser.username,
        email: createdUser.email || `${createdUser.username}@paroquia.org`,
        password: '••••••••',
        role: createdUser.role as UserRole,
        roleLabel: createdUser.role === 'administrador' ? 'Administrador' : 'Voluntário',
        shift: createdUser.shift || newShift,
        initials,
      };

      onUpdateSystemUsers([...systemUsers, newUser]);
      setFeedbackMessage(`Novo usuário "${newUser.name}" cadastrado e protegido no Supabase Auth com sucesso!`);
      setTimeout(() => setFeedbackMessage(''), 4500);

      setNewName('');
      setNewUsername('');
      setNewPassword('123456');
      setShowAddUserModal(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar usuário no banco de dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditedPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editPasswordValue.trim()) return;

    if (editPasswordValue.trim().length < 6) {
      alert('No Supabase Auth, a nova senha deve conter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          uid: editingUser.uid,
          username: editingUser.username,
          password: editPasswordValue.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao atualizar senha no Supabase');
      }

      const updated = systemUsers.map((u) => {
        if (u.id === editingUser.id || u.username === editingUser.username) {
          return { ...u, password: '••••••••' };
        }
        return u;
      });

      onUpdateSystemUsers(updated);
      setFeedbackMessage(`Senha de "${editingUser.name}" criptografada e alterada com sucesso no Supabase Auth!`);
      setTimeout(() => setFeedbackMessage(''), 4500);

      setEditingUser(null);
      setEditPasswordValue('');
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar senha no banco de dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (systemUsers.length <= 1) {
      alert('Não é possível remover o único usuário do sistema.');
      return;
    }
    if (!confirm('Tem certeza que deseja remover este usuário permanentemente do banco de dados?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao excluir usuário');
      }

      onUpdateSystemUsers(systemUsers.filter((u) => u.id !== userId));
      setFeedbackMessage('Usuário excluído com sucesso do banco de dados.');
      setTimeout(() => setFeedbackMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Falha ao excluir usuário no banco de dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-[#9cf5c5] text-[#005234] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            Área do Administrador
          </span>
          <span className="text-[#3f4942] text-[11px]">•</span>
          <span className="text-[#3f4942] text-[10px] sm:text-[11px]">Sistema de Gestão Pastoral dos Vicentinos</span>
        </div>
        <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#111c2c] tracking-tight leading-tight">
          Configurações e Gestão de Usuários
        </h1>
        <p className="text-[13px] sm:text-[14px] text-[#3f4942]">
          Gerenciamento de senhas, perfis de Administrador e Voluntário, e parâmetros paroquiais de entrega.
        </p>
      </div>

      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-[#9cf5c5]/30 border border-[#1b7a53]/40 flex items-center gap-3 text-[#005234] font-semibold text-[13px] animate-in fade-in">
          <Check className="w-5 h-5 text-[#00603e] shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Database sync live notice */}
      <div className="p-4 rounded-2xl bg-[#9cf5c5]/20 border border-[#9cf5c5] flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00603e] text-white flex items-center justify-center shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div className="text-[12px] sm:text-[13px]">
          <strong className="text-[#005234] block">Conexão Ativa com o Supabase:</strong>
          <span className="text-[#233527]">
            Todas as alterações de senhas, novos usuários e parâmetros são persistidos diretamente na sua base do Supabase em tempo real.
          </span>
        </div>
      </div>

      {/* Users & Passwords Management Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#dee8ff] shadow-sm space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dee8ff]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9cf5c5]/50 text-[#00603e] flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-[16px] font-bold text-[#111c2c]">
                Usuários e Senhas de Acesso
              </h3>
              <p className="text-[11px] sm:text-[12px] text-[#3f4942]">
                <strong>Administrador:</strong> Acesso pleno (relatórios, config, visitas). <strong>Voluntário:</strong> Apenas pesquisa e entrega de cestas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddUserModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#00603e] hover:bg-[#1b7a53] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sm min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>

        {/* Supabase Auth Explanation Banner */}
        <div className="p-4 rounded-xl bg-[#e7eeff] border border-[#dee8ff] space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00603e]" />
            <h4 className="text-[13px] font-bold text-[#004282]">
              Autenticação Nativa Supabase Auth Ativa
            </h4>
          </div>
          <p className="text-[12px] text-[#3f4942] leading-relaxed">
            As senhas agora são protegidas pela infraestrutura de segurança do <strong>Supabase Auth</strong>: utilizam <strong>hashing Bcrypt irreversível com salt individual</strong> (nunca são trafegadas ou salvas em texto puro) e os acessos emitem <strong>tokens JWT criptografados</strong> com renovação automática.
          </p>
          <div className="pt-1 text-[11px] text-[#004282] font-semibold flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#00603e]" />
            <span>
              Você também pode criar, gerenciar e redefinir usuários diretamente no console web do Supabase em <strong>Authentication &gt; Users &gt; Add user</strong>.
            </span>
          </div>
        </div>

        {/* Modal / Form: Add User */}
        {showAddUserModal && (
          <form onSubmit={handleCreateUser} className="p-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#111c2c] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#00603e]" /> Cadastrar Novo Usuário com Senha
              </span>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-[12px] text-[#3f4942] hover:text-[#111c2c]"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#3f4942] block mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#dee8ff] text-[13px] text-[#111c2c]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#3f4942] block mb-1">Usuário para Login</label>
                <input
                  type="text"
                  placeholder="Ex: joao"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#dee8ff] text-[13px] text-[#111c2c]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#3f4942] block mb-1">Perfil de Acesso</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#dee8ff] text-[13px] text-[#111c2c] font-medium"
                >
                  <option value="voluntario">Voluntário (Pesquisa & Entrega)</option>
                  <option value="administrador">Administrador (Gestão Plena)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#3f4942] block mb-1">Senha de Acesso</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Defina a senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 pl-3 pr-8 rounded-lg bg-white border border-[#dee8ff] text-[13px] text-[#111c2c]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3f4942]"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#3f4942] hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#00603e] text-white text-[12px] font-bold hover:bg-[#1b7a53]"
              >
                Salvar Usuário
              </button>
            </div>
          </form>
        )}

        {/* Edit Password Modal */}
        {editingUser && (
          <form onSubmit={handleSaveEditedPassword} className="p-4 rounded-xl bg-[#ffeed4] border border-[#ffcd85] space-y-3 animate-in fade-in">
            <span className="text-[13px] font-bold text-[#814400] block">
              Alterar Senha do Usuário: {editingUser.name} ({editingUser.roleLabel})
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Nova senha..."
                value={editPasswordValue}
                onChange={(e) => setEditPasswordValue(e.target.value)}
                className="h-10 px-3 rounded-lg bg-white border border-[#ffcd85] text-[13px] text-[#111c2c] flex-1"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#00603e] text-white text-[12px] font-bold min-h-[40px]"
              >
                Confirmar Nova Senha
              </button>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3 py-2 rounded-lg bg-white text-[#3f4942] text-[12px] font-semibold min-h-[40px]"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Users Table (Desktop) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#f0f3ff] text-[#3f4942] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l-lg">Usuário</th>
                <th className="py-2.5 px-3">Login</th>
                <th className="py-2.5 px-3">Perfil</th>
                <th className="py-2.5 px-3">Permissões de Acesso</th>
                <th className="py-2.5 px-3">Senha</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee8ff]">
              {systemUsers.map((user) => {
                const isAdmin = user.role === 'administrador';
                return (
                  <tr key={user.id} className="hover:bg-[#f0f3ff]/40">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full font-bold text-[12px] flex items-center justify-center shrink-0 ${
                          isAdmin ? 'bg-[#9cf5c5] text-[#00603e]' : 'bg-[#dee8ff] text-[#004282]'
                        }`}>
                          {user.initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#111c2c]">{user.name}</span>
                          <span className="text-[11px] text-[#3f4942]">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-[12px] font-bold text-[#004282] bg-[#f0f3ff] px-2 py-0.5 rounded border border-[#dee8ff]">
                        {user.username}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        isAdmin
                          ? 'bg-[#9cf5c5] text-[#005234] border-[#00603e]/30'
                          : 'bg-[#d6e3ff] text-[#004282] border-[#004282]/30'
                      }`}>
                        {isAdmin ? 'Administrador' : 'Voluntário'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[12px] text-[#3f4942]">
                        {isAdmin 
                          ? 'Gestão total: relatórios, config, visitas e cadastros'
                          : 'Apenas pesquisa de famílias e entrega de cestas'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-[#9cf5c5]/25 border border-[#9cf5c5] text-[#00603e] px-2 py-0.5 rounded-md font-semibold">
                        <ShieldCheck className="w-3 h-3 text-[#00603e]" />
                        Criptografada (Auth)
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(user);
                            setEditPasswordValue(user.password);
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#dee8ff] text-[#004282] min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                          title="Alterar senha deste usuário"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.username !== 'anderson' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded-lg hover:bg-[#ffdad6] text-[#ba1a1a] min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                            title="Remover usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Users Mobile Cards */}
        <div className="block sm:hidden divide-y divide-[#dee8ff]">
          {systemUsers.map((user) => {
            const isAdmin = user.role === 'administrador';
            return (
              <div key={user.id} className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full font-bold text-[12px] flex items-center justify-center shrink-0 ${
                      isAdmin ? 'bg-[#9cf5c5] text-[#00603e]' : 'bg-[#dee8ff] text-[#004282]'
                    }`}>
                      {user.initials}
                    </div>
                    <div>
                      <strong className="text-[13px] text-[#111c2c] block">{user.name}</strong>
                      <span className="text-[11px] text-[#3f4942]">Login: <strong>{user.username}</strong></span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isAdmin ? 'bg-[#9cf5c5] text-[#005234]' : 'bg-[#d6e3ff] text-[#004282]'
                  }`}>
                    {isAdmin ? 'Administrador' : 'Voluntário'}
                  </span>
                </div>

                <div className="text-[11px] text-[#3f4942]">
                  {isAdmin ? 'Acesso pleno ao sistema.' : 'Apenas pesquisa e entrega de cestas.'}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#00603e] font-semibold">
                    <ShieldCheck className="w-3 h-3 text-[#00603e]" />
                    Senha protegida no Supabase Auth
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(user);
                        setEditPasswordValue(user.password);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-[#dee8ff] text-[#004282] rounded-lg"
                    >
                      Alterar Senha
                    </button>
                    {user.username !== 'anderson' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-[#ba1a1a]"
                        aria-label="Excluir usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* General Pastoral Operational Parameters */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#dee8ff] shadow-sm space-y-5 sm:space-y-6">
        <h3 className="text-[15px] sm:text-[16px] font-bold text-[#111c2c]">Parâmetros Gerais da Pastoral</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-bold text-[#3f4942] block mb-1">
              Intervalo Mínimo entre Retiradas (dias)
            </label>
            <input
              type="number"
              value={minIntervalDays}
              onChange={(e) => setMinIntervalDays(Number(e.target.value))}
              className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px]"
            />
            <span className="text-[11px] text-[#6f7a72] mt-1 block">
              Padrão paroquial recomendado: 30 dias para cestas regulares.
            </span>
          </div>

          <div>
            <label className="text-[12px] font-bold text-[#3f4942] block mb-1">
              Nome da Paróquia
            </label>
            <input
              type="text"
              value={parishName}
              onChange={(e) => setParishName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[#111c2c] text-[14px]"
            />
          </div>
        </div>

        <div className="border-t border-[#dee8ff] pt-4">
          <label className="flex items-start sm:items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requireSignature}
              onChange={(e) => setRequireSignature(e.target.checked)}
              className="w-5 h-5 rounded text-[#00603e] accent-[#00603e] shrink-0 mt-0.5 sm:mt-0"
            />
            <div>
              <span className="text-[13px] font-bold text-[#111c2c] block">
                Exigir assinatura no ato da retirada
              </span>
              <span className="text-[11px] sm:text-[12px] text-[#3f4942]">
                Gera folha de prestação física para prestação de contas com a coordenação vicentina.
              </span>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-[#dee8ff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {saved ? (
            <span className="text-[12px] font-bold text-[#00603e] flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Configurações salvas com sucesso!
            </span>
          ) : (
            <span className="text-[12px] text-[#3f4942]">Sistema atualizado</span>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-6 h-11 sm:h-12 rounded-xl bg-[#00603e] hover:bg-[#1b7a53] text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-colors shadow-sm min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>
    </div>
  );
}
