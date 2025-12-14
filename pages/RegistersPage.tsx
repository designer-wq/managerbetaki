import React from 'react';
import { FolderPlus } from 'lucide-react';
import GeneralSettings from '../components/settings/GeneralSettings';

const RegistersPage = () => {
    return (
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Cadastros</h1>
                    <p className="text-zinc-400">Gerencie origens, tipos de demanda e status.</p>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    <GeneralSettings />
                </div>
            </div>
        </div>
    );
};

export default RegistersPage;
