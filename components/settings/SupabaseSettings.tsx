import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Skeleton } from '../ui/Skeleton';
import { Save, Activity, Database, Lock, Globe } from 'lucide-react';

const SupabaseSettings = () => {
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [dbName, setDbName] = useState("designer-wq's Project");
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const savedUrl = localStorage.getItem('supabase_url');
        const savedKey = localStorage.getItem('supabase_key');
        const savedDb = localStorage.getItem('supabase_db');
        if (savedUrl) setUrl(savedUrl);
        if (savedKey) setKey(savedKey);
        if (savedDb) setDbName(savedDb);
    }, []);

    const testConnection = async (saveAfter = false) => {
        setStatus('testing');
        setMessage('');

        try {
            if (!url || !key) {
                throw new Error('URL e Chave são obrigatórios');
            }

            const client = createClient(url, key);

            // Tenta fazer uma requisição simples. Mesmo que a tabela não exista,
            // se a conexão for bem sucedida, o erro será diferente de um erro de rede.
            // Usamos 'health_check' como nome de tabela fictícia.
            const { error } = await client.from('health_check').select('*').limit(1);

            // Se o erro for de conexão (network), lançamos exceção.
            // Se for "relation does not exist" ou similar, significa que conectou no Supabase,
            // só a tabela que não existe (o que é esperado).
            if (error && (error.message.includes('FetchError') || error.message.includes('Failed to fetch'))) {
                throw error;
            }

            setStatus('success');
            setMessage(' Conexão estabelecida com sucesso!');

            if (saveAfter) {
                localStorage.setItem('supabase_url', url);
                localStorage.setItem('supabase_key', key);
                localStorage.setItem('supabase_db', dbName);
            }
        } catch (e) {
            console.error(e);
            setStatus('error');
            setMessage(' Erro ao conectar. Verifique as credenciais.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await testConnection(true);
        setIsSaving(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
                <div className="card-enterprise p-6">
                    <form onSubmit={handleSave} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Globe size={16} />
                                URL do Projeto
                            </label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://seu-projeto.supabase.co"
                                className="w-full bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-zinc-600"
                            />
                            <p className="text-xs text-zinc-500">A URL base do seu projeto Supabase</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Lock size={16} />
                                Chave de API (Anon/Public)
                            </label>
                            <input
                                type="password"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                                className="w-full bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-zinc-600 font-mono"
                            />
                            <p className="text-xs text-zinc-500">Sua chave pública (anon key)</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Database size={16} />
                                Nome do Banco de Dados
                            </label>
                            <input
                                type="text"
                                value={dbName}
                                onChange={(e) => setDbName(e.target.value)}
                                placeholder="production_db"
                                className="w-full bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-zinc-600"
                            />
                        </div>

                        {/* Status Message */}
                        {status === 'testing' ? (
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2 w-full">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-3 w-[150px]" />
                                </div>
                            </div>
                        ) : message && (
                            <div className={`p-4 rounded-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${status === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                                }`}>
                                <Activity size={20} />
                                <span className="font-medium">{message}</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-zinc-700/50">
                            <button
                                type="button"
                                onClick={() => testConnection(false)}
                                className="w-full sm:w-auto bg-orange-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Activity size={18} />
                                Testar Conexão
                            </button>

                            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                                <button
                                    type="submit"
                                    disabled={isSaving || status === 'testing'}
                                    className="w-full sm:w-auto bg-[#6c5ce7] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#5b4bc4] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={18} />
                                    {isSaving ? 'Salvando...' : 'Salvar Integração'}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>

            {/* Info/Help Panel */}
            <div className="lg:col-span-1">
                <div className="card-enterprise p-6 space-y-4">
                    <h3 className="font-semibold text-white">Como configurar?</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Para conectar o SupaIntegra ao seu projeto Supabase, você precisará das credenciais de acesso.
                    </p>
                    <ol className="list-decimal list-inside text-sm text-zinc-400 space-y-2 marker:text-[#6c5ce7]">
                        <li>Acesse o painel do Supabase</li>
                        <li>Vá para Project Settings &gt; API</li>
                        <li>Copie a URL do Projeto</li>
                        <li>Copie a chave "anon" public</li>
                    </ol>
                </div>
            </div>

        </div>
    );
};

export default SupabaseSettings;
