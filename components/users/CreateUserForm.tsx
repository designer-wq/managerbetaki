import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Key, Check, Briefcase } from 'lucide-react';
import { createRecord, updateRecord, fetchTable } from '../../lib/api';

interface CreateUserFormProps {
    onCancel?: () => void;
    onSuccess?: () => void;
    initialData?: any;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onCancel, onSuccess, initialData }) => {
    const isEditMode = !!initialData;
    const [showPassword, setShowPassword] = useState(false);
    const [origins, setOrigins] = useState<any[]>([]);
    const [jobTitles, setJobTitles] = useState<any[]>([]);

    // Refs
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const roleEnumRef = useRef<HTMLSelectElement>(null); // For ADMIN, GERENTE, DESIGNER
    const jobTitleRef = useRef<HTMLSelectElement>(null); // For Job Title (Foreign Key)
    const originRef = useRef<HTMLSelectElement>(null);
    const permissionRef = useRef<HTMLSelectElement>(null); // High-jack existing roleRef or new one? Original was roleRef for Permission Level. I will use permissionRef and update refs.
    const statusRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Update refs when initialData changes OR when options load
        if (initialData) {
            if (nameRef.current) nameRef.current.value = initialData.name || '';
            if (emailRef.current) emailRef.current.value = initialData.email || '';
            if (permissionRef.current) permissionRef.current.value = initialData.permission_level || '1';
            // Normalize role to lowercase for consistency with new options
            if (roleEnumRef.current) roleEnumRef.current.value = (initialData.role || 'designer').toLowerCase();

            // Re-apply select values when options become available
            if (jobTitleRef.current) jobTitleRef.current.value = initialData.job_title_id || '';
            if (originRef.current) originRef.current.value = initialData.origin || '';

            if (statusRef.current) statusRef.current.checked = initialData.status === 'active';
        } else {
            // Reset for new user
            if (nameRef.current) nameRef.current.value = '';
            if (emailRef.current) emailRef.current.value = '';
            if (permissionRef.current) permissionRef.current.value = '1';
            if (roleEnumRef.current) roleEnumRef.current.value = 'designer'; // Default to designer for new users
            if (jobTitleRef.current) jobTitleRef.current.value = '';
            if (originRef.current) originRef.current.value = '';
            if (statusRef.current) statusRef.current.checked = true;
            if (passwordRef.current) passwordRef.current.value = '';
            if (confirmPasswordRef.current) confirmPasswordRef.current.value = '';
        }
    }, [initialData, origins, jobTitles]);

    useEffect(() => {
        // Fetch origins and job titles
        const loadData = async () => {
            const [originsData, jobTitlesData] = await Promise.all([
                fetchTable('origins'),
                fetchTable('job_titles')
            ]);
            setOrigins(originsData || []);
            setJobTitles(jobTitlesData || []);
        };
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = nameRef.current?.value;
        const email = emailRef.current?.value.trim().toLowerCase();
        const permissionLevel = "4"; // Force Admin level for everyone
        const roleName = roleEnumRef.current?.value;
        const jobTitleId = jobTitleRef.current?.value || null;
        const origin = originRef.current?.value;
        const status = statusRef.current?.checked ? 'active' : 'inactive';

        if (!name || !email || !permissionLevel || !roleName) {
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



        try {
            if (initialData) {
                // 1. UPDATE AUTH (Email/Password) - Only if needed or always if cheap
                // We keep calling update-user for Email/Password management
                // But we won't rely on it for Profile data to avoid sync issues
                const { getSupabase } = await import('../../lib/supabase');
                const supabase = getSupabase();

                if (!supabase) throw new Error("Supabase client not initialized");

                // Only call auth update if email or password provided
                if (email !== initialData.email || (password && password.length > 0)) {
                    const { data, error } = await supabase.functions.invoke('update-user', {
                        body: {
                            id: initialData.id,
                            email,
                            password: password || undefined,
                        }
                    });
                    if (error) {
                        console.error("Auth Update Error:", error);
                        // Don't throw immediately, try to save profile data anyway? 
                        // No, auth error is critical for email/pass.
                        throw error;
                    }
                }

                // 2. UPDATE PROFILE (Direct DB Update)
                // This ensures 'origin', 'job_title_id', 'role', 'name', 'status' are saved correctly
                // regardless of what the Edge Function does.
                await updateRecord('profiles', initialData.id, {
                    name,
                    role: roleName,
                    permission_level: parseInt(permissionLevel),
                    origin: origin || null,
                    job_title_id: jobTitleId,
                    status
                });

                alert('Usuário atualizado com sucesso!');

            } else {
                if (!password) {
                    alert('Senha é obrigatória para novos usuários.');
                    return;
                }

                // 1. CREATE USER (Auth via Edge Function)
                const { getSupabase } = await import('../../lib/supabase');
                const supabase = getSupabase();

                if (!supabase) throw new Error("Supabase client not initialized");

                const { data, error } = await supabase.functions.invoke('create-user', {
                    body: {
                        email,
                        password,
                        name, // Function might create initial profile, but we will overwrite/update it to be sure
                        role: roleName,
                        permission_level: parseInt(permissionLevel),
                        origin: origin || null
                    }
                });

                if (error) throw error;
                if (data?.error) throw new Error(data.error);

                const newUserId = data?.user?.id;

                if (newUserId) {
                    // 2. UPDATE/ENSURE PROFILE DATA
                    // The create-user function might set some defaults, but we enforce form values here.
                    // especially job_title_id which the function probably doesn't know about.
                    await updateRecord('profiles', newUserId, {
                        name,
                        role: roleName,
                        permission_level: parseInt(permissionLevel),
                        origin: origin || null,
                        job_title_id: jobTitleId,
                        status
                    });
                }

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
                        <input
                            ref={nameRef}
                            defaultValue={initialData?.name}
                            onChange={(e) => {
                                // Auto-generate email from name if in Create Mode
                                if (!isEditMode && emailRef.current) {
                                    const name = e.target.value;
                                    const parts = name.trim().toLowerCase().split(/\s+/);
                                    if (parts.length > 0 && parts[0]) {
                                        let generated = parts[0];
                                        if (parts.length > 1) {
                                            generated = parts[0].charAt(0) + parts[parts.length - 1];
                                        }
                                        emailRef.current.value = `${generated}@manager.com`;
                                    } else if (parts.length === 0 || !parts[0]) {
                                        emailRef.current.value = ''; // Clear email if name is empty
                                    }
                                }
                            }}
                            className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 transition-all"
                            placeholder="João Silva"
                            type="text"
                        />
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
                    <div className="flex flex-col gap-2">
                        <label className="flex flex-col gap-2">
                            <span className="text-white text-sm font-medium pl-1">Senha Atual</span>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                <input
                                    readOnly
                                    defaultValue={initialData.password || "Não definida"}
                                    className="w-full bg-zinc-900/30 border border-zinc-700 text-zinc-400 rounded-[6px] py-3.5 pl-12 pr-4 cursor-not-allowed font-mono"
                                    type="text"
                                />
                            </div>
                        </label>

                        <div className="flex items-center justify-between py-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                            >
                                {showPassword ? (
                                    <>Minimizar alteração</>
                                ) : (
                                    <>Alterar Senha de Acesso</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {(!initialData || showPassword) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
                        <label className="flex flex-col gap-2">
                            <span className="text-white text-sm font-medium pl-1">
                                {initialData ? 'Nova Senha' : 'Senha'}
                            </span>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={20} />
                                <input ref={passwordRef} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 transition-all font-mono" placeholder="••••••••" type="text" />
                            </div>
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-white text-sm font-medium pl-1">Confirmar Senha</span>
                            <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={20} />
                                <input ref={confirmPasswordRef} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 transition-all font-mono" placeholder="••••••••" type="text" />
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
                            <option value="">Selecione um Cargo...</option>
                            {jobTitles.map(jt => (
                                <option key={jt.id} value={jt.id}>{jt.name}</option>
                            ))}
                        </select>
                    </div>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-white text-sm font-medium pl-1">Função (Nível de Acesso)</span>
                    <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors z-10" size={20} />
                        <select ref={roleEnumRef} defaultValue={initialData?.role || "designer"} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 pl-12 pr-4 text-white appearance-none cursor-pointer">
                            <option value="admin">Admin - Acesso Total</option>
                            <option value="gerente">Gerente - Gestão de Equipe</option>
                            <option value="designer">Designer - Produção</option>
                            <option value="visualizador">Visualizador - Somente Leitura</option>
                        </select>
                    </div>
                    <p className="text-xs text-zinc-500 pl-1">
                        Define quais páginas e ações o usuário pode acessar conforme a Matriz de Permissões.
                    </p>
                </label>

                {/* Permission Level removed as per user request (All users are Admin/Level 4) */}
                <label className="flex flex-col gap-2">
                    <span className="text-white text-sm font-medium pl-1">Origem</span>
                    <div className="relative">
                        <select ref={originRef} defaultValue={initialData?.origin || ""} className="w-full bg-zinc-900/50 border border-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-[6px] py-3.5 px-4 text-white appearance-none cursor-pointer">
                            <option value="">Selecione...</option>
                            <option value="">Selecione...</option>
                            {origins.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
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
