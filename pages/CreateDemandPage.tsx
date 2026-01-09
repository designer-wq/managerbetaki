import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CreateDemandForm from '../components/demands/CreateDemandForm';

const CreateDemandPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 px-4 md:px-20 lg:px-40 py-8 flex justify-center bg-zinc-900 overflow-y-auto">
      <div className="w-full max-w-[960px] flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Link to="/demands" className="text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Criar Nova Demanda</h1>
            </div>
            <p className="text-zinc-400 text-base font-normal leading-normal pl-9">Preencha os detalhes abaixo para iniciar uma nova solicitação.</p>
          </div>
          <div className="hidden md:flex gap-3">
            <Link to="/demands" className="flex items-center justify-center h-10 px-6 rounded-full bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-colors">
              Cancelar
            </Link>
            <button className="flex items-center justify-center h-10 px-6 rounded-full bg-transparent text-primary text-sm font-bold hover:bg-primary/10 transition-colors border border-primary">
              Salvar Rascunho
            </button>
          </div>
        </div>

        <CreateDemandForm onCancel={() => navigate('/demands')} />

      </div>
    </div>
  );
};

export default CreateDemandPage;