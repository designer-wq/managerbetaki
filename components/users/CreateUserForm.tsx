import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Key, Check, Briefcase } from 'lucide-react';
import { createRecord, updateRecord, fetchTable } from '../../lib/api';

interface CreateUserFormProps {
    onCancel?: () => void;
    onSuccess?: () => void;
    initialData?: any;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onCancel, onSuccess, initialData }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [origins, setOrigins] = useState<any[]>([]);
    const [jobTitles, setJobTitles] = useState<any[]>([]);

    // Refs
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const roleRef = useRef<HTMLSelectElement>(null);
    const originRef = useRef<HTMLSelectElement>(null);
    const jobTitleRef = useRef<HTMLSelectElement>(null);
    const statusRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Update refs when initialData changes
        if (initialData) {
            if (nameRef.current) nameRef.current.value = initialData.name || '';
            if (emailRef.current) emailRef.current.value = initialData.email || '';
            if (roleRef.current) roleRef.current.value = initialData.role || 'Editor';
            if (originRef.current) originRef.current.value = initialData.origin || '';
            if (jobTitleRef.current) jobTitleRef.current.value = initialData.job_title_id || '';
            if (statusRef.current) statusRef.current.checked = initialData.status === 'active';
        } else {
            // Reset for new user
            if (nameRef.current) nameRef.current.value = '';
            if (emailRef.current) emailRef.current.value = '';
            if (roleRef.current) roleRef.current.value = 'Editor';
            if (originRef.current) originRef.current.value = '';
            if (jobTitleRef.current) jobTitleRef.current.value = '';
            if (statusRef.current) statusRef.current.checked = true;
            if (passwordRef.current) passwordRef.current.value = '';
            if (confirmPasswordRef.current) confirmPasswordRef.current.value = '';
        }
    }, [initialData]);

    useEffect(() => {
        // Fetch origins and job titles
        const loadData = async () => {
            const [originsData, jobsData] = await Promise.all([
                fetchTable('origins'),
                fetchTable('job_titles')
            ]);
            setOrigins(originsData || []);
            setJobTitles(jobsData || []);
        };
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = nameRef.current?.value;
        const email = emailRef.current?.value;
        const role = roleRef.current?.value;
        const origin = originRef.current?.value;
        const jobTitleId = jobTitleRef.current?.value;
        const status = statusRef.current?.checked ? 'active' : 'inactive';

        if (!name || !email || !role) {
            alert('Por favor, preencha os campos obrigatórios.');
            return;
        }

        let password = null;
        if (!initialData || showPassword) {
            password = passwordRef.current?.value;
            const confirm = confirmPasswordRef.current?.value;

            if (password !== confirm) {
                alert('As senhas não coincidem.');
                return;
            }
            if ((!initialData || (initialData && showPassword && password)) && (!password || password.length < 6)) {
                alert('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
        }

        const userData: any = {
            name,
            email,
            role,
            origin,
            job_title_id: jobTitleId || null,
            status,
        };

        if (password) {
            userData.password = password;
        }

        try {
            if (initialData) {
                await updateRecord('profiles', initialData.id, userData);
                alert('Usuário atualizado com sucesso!');
            } else {
                if (!password) {
                    alert('Senha é obrigatória para novos usuários.');
                    return;
                }
                await createRecord('profiles', userData);
                alert('Usuário criado com sucesso!');
            }
            if (onSuccess) onSuccess();
            if (onCancel) onCancel();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Erro ao salvar usuário.');
        }
    };

    return (
        <form className="flex flex-col gap-8 pb-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
                <label className="flex flex-col gap-2">
                    <span className="text-white text-sm font-medium pl-1">Nome Completo</span>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={20} />
                        <input ref={nameRef} defaultValue={initialData?.name} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 transition-all" placeholder="João Silva" type="text" />
                    </div>
                </label>
                <label className="flex flex-col gap-2">
                    <span className="text-white text-sm font-medium pl-1">Email de Trabalho</span>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={20} />
                        <input ref={emailRef} defaultValue={initialData?.email} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 transition-all" placeholder="joao@empresa.com" type="email" />
                    </div>
                </label>

                {initialData && (
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-zinc-400">Senha de Acesso</span>
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            {showPassword ? 'Cancelar Alteração de Senha' : 'Alterar Senha'}
                        </button>
                    </div>
                )}

                {(!initialData || showPassword) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <label className="flex flex-col gap-2">
                            <span className="text-white text-sm font-medium pl-1">
                                {initialData ? 'Nova Senha' : 'Senha'}
                            </span>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={20} />
                                <input ref={passwordRef} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 transition-all" placeholder="••••••••" type="password" />
                            </div>
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-white text-sm font-medium pl-1">Confirmar Senha</span>
                            <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={20} />
                                <input ref={confirmPasswordRef} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 transition-all" placeholder="••••••••" type="password" />
                            </div>
                        </label>
                    </div>
                )}
            </div>

            <div className="h-px bg-zinc-800 w-full"></div>

            <div className="grid grid-cols-1 gap-6">
                <label className="flex flex-col gap-2">
                    <span className="text-white text-sm font-medium pl-1">Cargo</span>
                    <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors z-10" size={20} />
                        <select ref={jobTitleRef} defaultValue={initialData?.job_title_id || ""} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 pl-12 pr-4 text-white appearance-none cursor-pointer">
                            <option value="">Selecione...</option>
                            {jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                        </select>
                    </div>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-white text-sm font-medium pl-1">Nível de Permissão</span>
                    <div className="relative">
                        <select ref={roleRef} defaultValue={initialData?.role || "Editor"} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 px-4 text-white appearance-none cursor-pointer">
                            <option value="Administrador">Administrador</option>
                            <option value="Gerente">Gerente</option>
                            <option value="Editor">Editor</option>
                            <option value="Visualizador">Visualizador</option>
                        </select>
                    </div>
                </label>
                <label className="flex flex-col gap-2">
                    <span className="text-white text-sm font-medium pl-1">Origem</span>
                    <div className="relative">
                        <select ref={originRef} defaultValue={initialData?.origin || ""} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 px-4 text-white appearance-none cursor-pointer">
                            <option value="">Selecione...</option>
                            {origins.length > 0 ? (
                                origins.map(o => <option key={o.id} value={o.name}>{o.name}</option>)
                            ) : (
                                <>
                                    <option value="Depto. Marketing">Depto. Marketing</option>
                                    <option value="Depto. Vendas">Depto. Vendas</option>
                                    <option value="Agência Externa">Agência Externa</option>
                                </>
                            )}
                        </select>
                    </div>
                </label>

                <div className="flex flex-col gap-2">
                    <span className="text-white text-sm font-medium pl-1">Status da Conta</span>
                    <label className="flex items-center justify-between w-full bg-zinc-900/50 border border-zinc-600 rounded-[6px] p-3 px-4 cursor-pointer group h-[58px]">
                        <span className="text-white text-sm font-medium group-hover:text-primary transition-colors">Usuário Ativo</span>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input ref={statusRef} defaultChecked={initialData ? initialData.status === 'active' : true} className="sr-only peer" type="checkbox" />
                            <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-zinc-800">
                <button
                    onClick={onCancel}
                    className="px-8 py-3.5 rounded-full text-white font-medium hover:text-primary transition-colors"
                    type="button"
                >
                    Cancelar
                </button>
                <button className="px-8 py-3.5 rounded-full bg-primary hover:bg-primary/90 text-zinc-900 font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2" type="submit">
                    <Check size={20} />
                    {initialData ? 'Salvar Alterações' : 'Salvar Usuário'}
                </button>
            </div>
        </form >
    );
};

export default CreateUserForm;
