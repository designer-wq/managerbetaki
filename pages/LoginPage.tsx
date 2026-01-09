import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, User, ArrowLeft, ChevronRight, LayoutGrid, Crown } from 'lucide-react';

interface Profile {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    job_title: string | null;
    job_title_name?: string | null;
    role_name?: string | null;
    role: string;
}

const LoginPage = () => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [profilesLoading, setProfilesLoading] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { getSupabase } = await import('../lib/supabase');
                const supabase = getSupabase();

                if (!supabase) return;

                const { data, error } = await supabase.rpc('get_login_profiles');

                if (error) {
                    console.error('Error fetching login profiles:', error);
                    return;
                }

                setProfiles(data || []);
            } catch (err) {
                console.error('Failed to load profiles:', err);
            } finally {
                setProfilesLoading(false);
            }
        };

        fetchProfiles();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfile) return;

        setError('');
        setLoading(true);

        try {
            const { getSupabase } = await import('../lib/supabase');
            const supabase = getSupabase();
            if (!supabase) return;

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: selectedProfile.email.trim().toLowerCase(),
                password: password.trim()
            });

            if (authError) {
                setError('Senha incorreta.');
                setLoading(false);
                return;
            }

            if (data.user) {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao fazer login.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    // Helper to get color based on role
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Administrador': return 'bg-primary text-zinc-900 border-primary';
            case 'Gerente': return 'bg-violet-500 text-white border-violet-500';
            default: return 'bg-zinc-700 text-zinc-300 border-zinc-600';
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/5 blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">

                {/* Header Logo */}
                <div className="mb-12 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#a5b900] flex items-center justify-center shadow-[0_0_40px_-5px_rgba(188,210,0,0.3)]">
                        <LayoutGrid className="text-zinc-900" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Manager <span className="text-primary">Mkt</span></h1>
                </div>

                {/* Main Content Area - WIDENED for 3 columns */}
                <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500 delay-150">

                    {!selectedProfile ? (
                        // PROFILE SELECTION VIEW
                        <div className="flex flex-col gap-6">
                            <h2 className="text-3xl font-bold text-white text-center mb-4">Quem está acessando?</h2>

                            {profilesLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            ) : profiles.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                                    {profiles.map((profile) => (
                                        <button
                                            key={profile.id}
                                            onClick={() => setSelectedProfile(profile)}
                                            className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5"
                                        >
                                            <div className="relative">
                                                {/* Ícone de Coroa para Administradores */}
                                                {(profile.role_name || profile.role || '').toLowerCase().includes('admin') && (
                                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                                                        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-1.5 rounded-full shadow-lg shadow-amber-500/30">
                                                            <Crown size={14} className="text-zinc-900" />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl flex items-center justify-center overflow-hidden group-hover:border-primary/20 transition-colors duration-300">
                                                    {profile.avatar_url ? (
                                                        <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-2xl sm:text-3xl font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                                            {getInitials(profile.name)}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Cargo Badge (faixa verde sempre) */}
                                                <div className="absolute -bottom-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-zinc-900 border-primary">
                                                    {(profile.job_title_name || profile.job_title || '').trim() || 'Sem cargo'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-lg font-medium text-white group-hover:text-primary transition-colors line-clamp-1">{profile.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 px-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                                    <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                    <h3 className="text-zinc-300 font-medium mb-1">Nenhum perfil encontrado</h3>
                                    <p className="text-zinc-500 text-sm">Contate o administrador para cadastrar sua conta.</p>
                                </div>
                            )}

                        </div>
                    ) : (
                        // PASSWORD ENTRY VIEW - Constrained width
                        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden max-w-[500px] mx-auto">
                            {/* User Info Header */}
                            <div className="flex flex-col items-center gap-4 mb-8">
                                <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-950 shadow-xl flex items-center justify-center overflow-hidden mb-2">
                                    {selectedProfile.avatar_url ? (
                                        <img src={selectedProfile.avatar_url} alt={selectedProfile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-zinc-400">
                                            {getInitials(selectedProfile.name)}
                                        </span>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-white mb-1">Olá, {selectedProfile.name.split(' ')[0]}</h2>
                                    <p className="text-zinc-400 text-sm">Digite sua senha para entrar</p>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="flex flex-col gap-5">
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-primary transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Sua senha"
                                        autoFocus
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !password}
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_-5px_rgba(188,210,0,0.4)]"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>Entrar no Sistema</span>
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <button
                                onClick={() => {
                                    setSelectedProfile(null);
                                    setPassword('');
                                    setError('');
                                }}
                                className="mt-8 w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                <span>Trocar de conta</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-12 text-zinc-600 text-xs text-center">
                    &copy; 2025 Manager Mkt Bet Aki
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
