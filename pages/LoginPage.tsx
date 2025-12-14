import React, { useState } from 'react';
import { BarChart3, Mail, Lock, ArrowRight, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchByColumn } from '../lib/api';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Fetch user by email
            const user = await fetchByColumn('profiles', 'email', email);

            if (!user) {
                setError('Email ou senha inválidos.'); // Generic error for security
                setLoading(false);
                return;
            }

            // Verify password (plaintext for MVP as requested)
            if (user.password !== password) {
                setError('Email ou senha inválidos.');
                setLoading(false);
                return;
            }

            if (user.status !== 'active') {
                setError('Esta conta está inativa. Contate o administrador.');
                setLoading(false);
                return;
            }

            // Login successful
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url
            }));

            // Force reload or just navigate (navigate is cleaner, but need to ensure App context updates if existing)
            // For now assuming simple local storage check on protected routes or header
            navigate('/');

        } catch (err) {
            console.error(err);
            setError('Ocorreu um erro ao tentar fazer login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-900 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-[480px] bg-zinc-900 rounded-2xl shadow-2xl ring-1 ring-zinc-800 backdrop-blur-sm">
                <div className="px-8 pt-10 pb-6 flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <BarChart3 className="text-white" size={24} />
                        </div>
                        <span className="text-sm font-bold text-primary tracking-wider uppercase">Marketing OS</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-[-0.033em]">
                        Manager Mkt Bet Aki
                    </h1>
                    <p className="text-zinc-400 text-base font-normal leading-normal">
                        Bem-vindo de volta!
                    </p>
                </div>

                <form className="px-8 pb-10 flex flex-col gap-6" onSubmit={handleLogin}>
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2 group/field">
                        <label className="text-sm font-semibold text-white ml-1 transition-colors group-focus-within/field:text-primary">Endereço de E-mail</label>
                        <div className="relative">
                            <input
                                className="flex w-full h-14 rounded-full border-none bg-zinc-800 px-6 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                name="email"
                                placeholder="usuario@exemplo.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-zinc-500">
                                <Mail size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 group/field">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-semibold text-white transition-colors group-focus-within/field:text-primary">Senha</label>
                            <a className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors" href="#">Esqueceu a senha?</a>
                        </div>
                        <div className="relative">
                            <input
                                className="flex w-full h-14 rounded-full border-none bg-zinc-800 pl-6 pr-12 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                name="password"
                                placeholder="Digite sua senha"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button className="absolute inset-y-0 right-5 flex items-center text-zinc-500 hover:text-primary transition-colors cursor-pointer" type="button">
                                <Lock size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full h-14 rounded-full bg-primary text-white text-base font-medium tracking-[0.015em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(188,210,0,0.3)] hover:shadow-[0_0_25px_-5px_rgba(188,210,0,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="font-bold">Entrando...</span>
                            ) : (
                                <>
                                    <span className="font-bold">Entrar</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>


            <p className="mt-8 text-xs text-center text-zinc-500 relative z-10">
                © 2025 Manger Mkt Bet Aki. Todos os direitos reservados. Createby: Felipe Mota
            </p>
        </div >
    );
};

export default LoginPage;