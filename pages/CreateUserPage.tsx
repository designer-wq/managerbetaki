import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { UserPlus, Pencil, Trash2, Search, Briefcase, MoreVertical, Shield, CheckCircle, XCircle } from 'lucide-react';
import SlideOver from '../components/ui/SlideOver';
import CreateUserForm from '../components/users/CreateUserForm';
import { fetchProfiles } from '../lib/api';

const CreateUserPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // SlideOver & Edit State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { getSupabase } = await import('../lib/supabase');
      const supabase = getSupabase();

      const { data, error } = await (supabase as any).rpc('get_auth_users_list');

      if (error) throw error;

      // Map the RPC result to match the expected shape (nested job_titles)
      const mappedUsers = (data || []).map((u: any) => ({
        ...u,
        job_titles: u.job_title_name ? { name: u.job_title_name } : null
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error("Error fetching users from Auth:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleNewUser = () => {
    setSelectedUser(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      try {
        const { getSupabase } = await import('../lib/supabase');
        const supabase = getSupabase();
        if (!supabase) {
          alert('Erro: Conexão com Supabase não disponível');
          return;
        }

        // Get current session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('Erro: Você precisa estar logado para excluir usuários');
          return;
        }

        // Call the delete-user Edge Function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ userId: id }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao excluir usuário');
        }

        // Remove user from local state immediately
        setUsers(prevUsers => prevUsers.filter(u => u.id !== id));

        alert('Usuário excluído com sucesso!');

        // Also reload from server to ensure sync
        loadUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        alert(`Erro ao excluir usuário: ${error.message}`);
      }
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.job_titles?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
      <Header
        title="Equipe"
        subtitle="Gerencie os membros do time e permissões"
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 custom-scrollbar">
        <div className="max-w-7xl mx-auto">

          {/* Action Bar */}
          <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">Colaboradores</h1>
              <p className="text-zinc-400 mt-2">Visualize e gerencie quem tem acesso ao sistema.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleNewUser}
                className="flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-black hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
              >
                <UserPlus size={18} />
                <span>Novo Usuário</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex w-full items-center bg-zinc-900/50 px-4 py-3 border border-zinc-700/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all rounded-[6px]">
              <Search size={20} className="text-zinc-500" />
              <input
                className="ml-3 w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                placeholder="Buscar usuários por nome, email ou cargo..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="card-enterprise w-full overflow-hidden relative min-h-[400px]">
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 z-10"><span className="text-white">Carregando...</span></div>}

            <div className="w-full overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[1000px] table-auto border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-900">
                    <th className="px-6 py-4 font-semibold text-zinc-400">Nome / Email</th>
                    <th className="px-6 py-4 font-semibold text-zinc-400">Cargo</th>
                    <th className="px-6 py-4 font-semibold text-zinc-400">Origem</th>
                    <th className="px-6 py-4 font-semibold text-zinc-400">Nível</th>
                    <th className="px-6 py-4 font-semibold text-zinc-400">Status</th>
                    <th className="px-6 py-4 text-right font-semibold text-zinc-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                  {filteredUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-zinc-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-zinc-600 flex items-center justify-center text-white font-bold border border-zinc-500">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base">{user.name}</div>
                            <div className="text-xs text-zinc-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.job_titles ? (
                          <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-900 px-3 py-1 rounded-full w-fit text-xs font-medium border border-zinc-700">
                            <Briefcase size={12} className="text-zinc-500" />
                            {user.job_titles.name}
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs italic">Sem cargo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-300">{user.origin || "-"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'Administrador'
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          : user.role === 'Gerente'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'bg-zinc-700/50 text-zinc-300 border-zinc-600'
                          }`}>
                          <Shield size={10} />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.status === 'active' ? (
                            <div className="flex items-center gap-1.5 text-green-500 text-xs font-bold uppercase tracking-wider">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              Ativo
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold uppercase tracking-wider">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              Inativo
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 hover:bg-blue-500/10 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={selectedUser ? "Editar Usuário" : "Novo Usuário"}
      >
        <CreateUserForm
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            loadUsers();
          }}
          initialData={selectedUser}
        />
      </SlideOver>
    </div>
  );
};

export default CreateUserPage;