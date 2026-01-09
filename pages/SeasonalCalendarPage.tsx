import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

// Seasonal dates database with emojis
const seasonalDates = [
    // Janeiro
    { date: '01-01', name: 'Dia da Confraternização Universal', category: 'feriado', emoji: '🎉' },
    { date: '01-01', name: 'Ano-Novo', category: 'feriado', emoji: '🎊' },
    { date: '01-01', name: 'Dia Mundial da Paz', category: 'conscientização', emoji: '☮️' },
    { date: '01-01', name: 'Janeiro Branco - Saúde Mental', category: 'conscientização', emoji: '🧠' },
    { date: '01-01', name: 'Janeiro Roxo - Hanseníase', category: 'conscientização', emoji: '💜' },
    { date: '01-02', name: 'Dia do Sanitarista', category: 'profissional', emoji: '🏥' },
    { date: '01-02', name: 'Dia do Confeiteiro', category: 'profissional', emoji: '🎂' },
    { date: '01-04', name: 'Dia Mundial do Braille', category: 'conscientização', emoji: '🤙' },
    { date: '01-06', name: 'Dia da Gratidão', category: 'cultura', emoji: '🙏' },
    { date: '01-06', name: 'Dia de Reis', category: 'religioso', emoji: '👑' },
    { date: '01-07', name: 'Dia do Leitor', category: 'cultura', emoji: '📚' },
    { date: '01-08', name: 'Dia do Fotógrafo', category: 'profissional', emoji: '📸' },
    { date: '01-09', name: 'Dia do Astronauta', category: 'profissional', emoji: '👨‍🚀' },
    { date: '01-09', name: 'Dia do Fico', category: 'cultura', emoji: '🇧🇷' },
    { date: '01-15', name: 'Dia do Compositor', category: 'profissional', emoji: '🎵' },
    { date: '01-19', name: 'Dia do Cabeleireiro', category: 'profissional', emoji: '💇' },
    { date: '01-20', name: 'Dia de São Sebastião', category: 'religioso', emoji: '⛪' },
    { date: '01-21', name: 'Dia Mundial da Religião', category: 'religioso', emoji: '⛪' },
    { date: '01-24', name: 'Dia da Previdência Social', category: 'profissional', emoji: '📋' },
    { date: '01-25', name: 'Aniversário de São Paulo', category: 'regional', emoji: '🏙️' },
    { date: '01-25', name: 'Dia do Carteiro', category: 'profissional', emoji: '📮' },
    { date: '01-26', name: 'Dia Mundial da Educação Ambiental', category: 'conscientização', emoji: '🌱' },
    { date: '01-30', name: 'Dia da Saudade', category: 'cultura', emoji: '💛' },
    { date: '01-30', name: 'Dia do Padrinho', category: 'comercial', emoji: '👨' },
    { date: '01-31', name: 'Dia do Mágico', category: 'profissional', emoji: '🎩' },

    // Fevereiro
    { date: '02-02', name: 'Dia de Iemanjá', category: 'religioso', emoji: '🌊' },
    { date: '02-02', name: 'Dia do Agente Fiscal', category: 'profissional', emoji: '📋' },
    { date: '02-04', name: 'Dia Mundial do Câncer', category: 'conscientização', emoji: '🎗️' },
    { date: '02-11', name: 'Dia do Zelador', category: 'profissional', emoji: '🧹' },
    { date: '02-14', name: 'Dia de São Valentim', category: 'internacional', emoji: '💕' },
    { date: '02-21', name: 'Carnaval', category: 'feriado', emoji: '🎭' },
    { date: '02-27', name: 'Dia do Livro Didático', category: 'cultura', emoji: '📖' },

    // Março
    { date: '03-01', name: 'Dia do Turismo Ecológico', category: 'conscientização', emoji: '🌿' },
    { date: '03-05', name: 'Dia do Filatelista', category: 'cultura', emoji: '📬' },
    { date: '03-08', name: 'Dia Internacional da Mulher', category: 'comemorativo', emoji: '👩' },
    { date: '03-10', name: 'Dia do Telefone', category: 'cultura', emoji: '📞' },
    { date: '03-14', name: 'Dia do Vendedor de Livros', category: 'profissional', emoji: '📚' },
    { date: '03-15', name: 'Dia do Consumidor', category: 'comercial', emoji: '🛒' },
    { date: '03-19', name: 'Dia de São José', category: 'religioso', emoji: '⛪' },
    { date: '03-20', name: 'Início do Outono', category: 'estação', emoji: '🍂' },
    { date: '03-21', name: 'Dia Internacional da Síndrome de Down', category: 'conscientização', emoji: '💙' },
    { date: '03-21', name: 'Dia da Poesia', category: 'cultura', emoji: '📝' },
    { date: '03-22', name: 'Dia Mundial da Água', category: 'conscientização', emoji: '💧' },
    { date: '03-27', name: 'Dia do Circo', category: 'cultura', emoji: '🎪' },
    { date: '03-31', name: 'Dia da Saúde e Nutrição', category: 'conscientização', emoji: '🥗' },

    // Abril
    { date: '04-01', name: 'Dia da Mentira', category: 'cultura', emoji: '🤥' },
    { date: '04-07', name: 'Dia Mundial da Saúde', category: 'conscientização', emoji: '🏥' },
    { date: '04-08', name: 'Dia do Correio', category: 'profissional', emoji: '📮' },
    { date: '04-13', name: 'Dia do Beijo', category: 'comemorativo', emoji: '💋' },
    { date: '04-15', name: 'Dia do Desarmamento Infantil', category: 'conscientização', emoji: '🕊️' },
    { date: '04-18', name: 'Dia Nacional do Livro Infantil', category: 'cultura', emoji: '📚' },
    { date: '04-19', name: 'Dia do Índio', category: 'cultura', emoji: '🪶' },
    { date: '04-21', name: 'Tiradentes', category: 'feriado', emoji: '🇧🇷' },
    { date: '04-22', name: 'Dia do Planeta Terra', category: 'conscientização', emoji: '🌍' },
    { date: '04-22', name: 'Descobrimento do Brasil', category: 'cultura', emoji: '🚢' },
    { date: '04-23', name: 'Dia de São Jorge', category: 'religioso', emoji: '⚔️' },
    { date: '04-28', name: 'Dia da Sogra', category: 'comemorativo', emoji: '👩‍🦳' },

    // Maio
    { date: '05-01', name: 'Dia do Trabalho', category: 'feriado', emoji: '👷' },
    { date: '05-03', name: 'Dia do Sertanejo', category: 'cultura', emoji: '🤠' },
    { date: '05-05', name: 'Dia do Manicure', category: 'profissional', emoji: '💅' },
    { date: '05-08', name: 'Dia do Artista Plástico', category: 'profissional', emoji: '🎨' },
    { date: '05-11', name: 'Dia das Mães', category: 'comercial', emoji: '👩‍👧' },
    { date: '05-13', name: 'Abolição da Escravatura', category: 'cultura', emoji: '⛓️' },
    { date: '05-15', name: 'Dia do Assistente Social', category: 'profissional', emoji: '🤝' },
    { date: '05-17', name: 'Dia contra a Homofobia', category: 'conscientização', emoji: '🏳️‍🌈' },
    { date: '05-18', name: 'Dia dos Museus', category: 'cultura', emoji: '🏛️' },
    { date: '05-25', name: 'Dia do Orgulho Nerd', category: 'cultura', emoji: '🤓' },
    { date: '05-28', name: 'Dia do Hambúrguer', category: 'comercial', emoji: '🍔' },

    // Junho
    { date: '06-01', name: 'Dia da Imprensa', category: 'profissional', emoji: '📰' },
    { date: '06-03', name: 'Dia do Profissional de RH', category: 'profissional', emoji: '👔' },
    { date: '06-05', name: 'Dia do Meio Ambiente', category: 'conscientização', emoji: '🌳' },
    { date: '06-10', name: 'Dia da Educação Ambiental', category: 'conscientização', emoji: '📗' },
    { date: '06-12', name: 'Dia dos Namorados', category: 'comercial', emoji: '❤️' },
    { date: '06-13', name: 'Dia de Santo Antônio', category: 'religioso', emoji: '⛪' },
    { date: '06-14', name: 'Dia do Doador de Sangue', category: 'conscientização', emoji: '🩸' },
    { date: '06-21', name: 'Início do Inverno', category: 'estação', emoji: '❄️' },
    { date: '06-24', name: 'São João', category: 'religioso', emoji: '🔥' },
    { date: '06-29', name: 'Dia de São Pedro', category: 'religioso', emoji: '⛪' },

    // Julho
    { date: '07-02', name: 'Dia do Bombeiro', category: 'profissional', emoji: '🚒' },
    { date: '07-08', name: 'Dia do Panificador', category: 'profissional', emoji: '🥖' },
    { date: '07-13', name: 'Dia do Rock', category: 'cultura', emoji: '🎸' },
    { date: '07-15', name: 'Dia do Homem', category: 'comemorativo', emoji: '👨' },
    { date: '07-17', name: 'Dia de Proteção às Florestas', category: 'conscientização', emoji: '🌲' },
    { date: '07-20', name: 'Dia do Amigo', category: 'comemorativo', emoji: '🤝' },
    { date: '07-25', name: 'Dia do Escritor', category: 'profissional', emoji: '✍️' },
    { date: '07-26', name: 'Dia dos Avós', category: 'comemorativo', emoji: '👴👵' },
    { date: '07-28', name: 'Dia do Agricultor', category: 'profissional', emoji: '🌾' },

    // Agosto
    { date: '08-01', name: 'Dia dos Pais (comercial)', category: 'comercial', emoji: '👨‍👦' },
    { date: '08-05', name: 'Dia Nacional da Saúde', category: 'conscientização', emoji: '🏥' },
    { date: '08-11', name: 'Dia dos Pais', category: 'comercial', emoji: '👨‍👧' },
    { date: '08-11', name: 'Dia do Estudante', category: 'comemorativo', emoji: '📚' },
    { date: '08-12', name: 'Dia dos Pais (Brasil)', category: 'comercial', emoji: '👔' },
    { date: '08-15', name: 'Dia da Informática', category: 'profissional', emoji: '💻' },
    { date: '08-19', name: 'Dia Mundial da Fotografia', category: 'cultura', emoji: '📷' },
    { date: '08-22', name: 'Dia do Folclore', category: 'cultura', emoji: '🎭' },
    { date: '08-25', name: 'Dia do Soldado', category: 'profissional', emoji: '🎖️' },
    { date: '08-29', name: 'Dia de Combate ao Fumo', category: 'conscientização', emoji: '🚭' },

    // Setembro
    { date: '09-01', name: 'Dia do Profissional de Ed. Física', category: 'profissional', emoji: '🏃' },
    { date: '09-05', name: 'Dia da Amazônia', category: 'conscientização', emoji: '🌳' },
    { date: '09-07', name: 'Independência do Brasil', category: 'feriado', emoji: '🇧🇷' },
    { date: '09-10', name: 'Setembro Amarelo', category: 'conscientização', emoji: '💛' },
    { date: '09-15', name: 'Dia do Cliente', category: 'comercial', emoji: '🛍️' },
    { date: '09-17', name: 'Dia do Dentista', category: 'profissional', emoji: '🦷' },
    { date: '09-21', name: 'Dia da Árvore', category: 'conscientização', emoji: '🌳' },
    { date: '09-22', name: 'Início da Primavera', category: 'estação', emoji: '🌸' },
    { date: '09-27', name: 'Dia do Idoso', category: 'conscientização', emoji: '👴' },

    // Outubro
    { date: '10-01', name: 'Dia Internacional da Música', category: 'cultura', emoji: '🎶' },
    { date: '10-04', name: 'Dia dos Animais', category: 'conscientização', emoji: '🐾' },
    { date: '10-05', name: 'Dia das Aves', category: 'conscientização', emoji: '🐦' },
    { date: '10-10', name: 'Outubro Rosa', category: 'conscientização', emoji: '🎀' },
    { date: '10-12', name: 'Dia das Crianças', category: 'comercial', emoji: '👦👧' },
    { date: '10-12', name: 'Nossa Senhora Aparecida', category: 'feriado', emoji: '⛪' },
    { date: '10-15', name: 'Dia do Professor', category: 'comemorativo', emoji: '👨‍🏫' },
    { date: '10-18', name: 'Dia do Médico', category: 'profissional', emoji: '👨‍⚕️' },
    { date: '10-28', name: 'Dia do Servidor Público', category: 'profissional', emoji: '🏛️' },
    { date: '10-31', name: 'Halloween', category: 'internacional', emoji: '🎃' },

    // Novembro
    { date: '11-01', name: 'Dia de Todos os Santos', category: 'religioso', emoji: '😇' },
    { date: '11-02', name: 'Finados', category: 'feriado', emoji: '🕯️' },
    { date: '11-05', name: 'Dia da Cultura', category: 'cultura', emoji: '🎭' },
    { date: '11-10', name: 'Novembro Azul', category: 'conscientização', emoji: '💙' },
    { date: '11-12', name: 'Dia do Supermercado', category: 'comercial', emoji: '🛒' },
    { date: '11-14', name: 'Dia do Bandeirante', category: 'cultura', emoji: '🏴' },
    { date: '11-15', name: 'Proclamação da República', category: 'feriado', emoji: '🇧🇷' },
    { date: '11-19', name: 'Dia da Bandeira', category: 'cultura', emoji: '🇧🇷' },
    { date: '11-20', name: 'Dia da Consciência Negra', category: 'feriado', emoji: '✊🏿' },
    { date: '11-25', name: 'Black Friday', category: 'comercial', emoji: '🏷️' },
    { date: '11-29', name: 'Cyber Monday', category: 'comercial', emoji: '💻' },

    // Dezembro
    { date: '12-01', name: 'Dia Mundial de Luta contra AIDS', category: 'conscientização', emoji: '🎗️' },
    { date: '12-08', name: 'Dia da Família', category: 'comemorativo', emoji: '👨‍👩‍👧‍👦' },
    { date: '12-10', name: 'Dia dos Direitos Humanos', category: 'conscientização', emoji: '✊' },
    { date: '12-13', name: 'Dia do Ótico', category: 'profissional', emoji: '👓' },
    { date: '12-21', name: 'Início do Verão', category: 'estação', emoji: '☀️' },
    { date: '12-24', name: 'Véspera de Natal', category: 'feriado', emoji: '🎄' },
    { date: '12-25', name: 'Natal', category: 'feriado', emoji: '🎅' },
    { date: '12-26', name: 'Boxing Day', category: 'comercial', emoji: '🎁' },
    { date: '12-31', name: 'Réveillon', category: 'feriado', emoji: '🥂' },
];

const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const categoryConfig: Record<string, { bg: string; text: string }> = {
    feriado: { bg: 'bg-red-500', text: 'text-white' },
    religioso: { bg: 'bg-purple-500', text: 'text-white' },
    comemorativo: { bg: 'bg-blue-500', text: 'text-white' },
    comercial: { bg: 'bg-amber-500', text: 'text-black' },
    conscientização: { bg: 'bg-orange-500', text: 'text-white' },
    internacional: { bg: 'bg-pink-500', text: 'text-white' },
    estação: { bg: 'bg-cyan-500', text: 'text-black' },
    regional: { bg: 'bg-teal-500', text: 'text-white' },
    cultura: { bg: 'bg-indigo-500', text: 'text-white' },
    profissional: { bg: 'bg-slate-600', text: 'text-white' },
};

const categoryLabels: Record<string, string> = {
    feriado: 'Feriado',
    religioso: 'Religioso',
    comemorativo: 'Comemorativo',
    comercial: 'Comercial',
    conscientização: 'Conscientização',
    internacional: 'Internacional',
    estação: 'Estação',
    regional: 'Regional',
    cultura: 'Cultura',
    profissional: 'Profissional',
};

const SeasonalCalendarPage = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Get dates for selected month
    const monthDates = useMemo(() => {
        const monthStr = String(selectedMonth + 1).padStart(2, '0');
        return seasonalDates
            .filter(d => d.date.startsWith(monthStr))
            .filter(d => selectedCategory === 'all' || d.category === selectedCategory)
            .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [selectedMonth, selectedCategory, searchTerm]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
            <Header
                title="Calendário Sazonal"
                subtitle="Datas comemorativas e oportunidades de marketing"
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Month Navigator */}
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                            <button
                                onClick={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)}
                                className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
                            >
                                <ChevronLeft size={20} className="text-zinc-400" />
                            </button>
                            <div className="min-w-[140px] text-center px-4">
                                <span className="text-white font-bold text-lg">{months[selectedMonth]}</span>
                            </div>
                            <button
                                onClick={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)}
                                className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
                            >
                                <ChevronRight size={20} className="text-zinc-400" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 flex-1 max-w-md">
                            <Search size={18} className="text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Buscar data..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent text-white text-sm outline-none flex-1 placeholder-zinc-500"
                            />
                        </div>
                    </div>

                    {/* Category Filters (Clickable Legend) */}
                    <div className="flex flex-wrap gap-2">
                        {/* All option */}
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === 'all'
                                ? 'bg-primary text-black ring-2 ring-primary/50'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                        >
                            Todos
                        </button>
                        {Object.entries(categoryConfig).map(([cat, config]) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === cat
                                    ? `${config.bg} ${config.text} ring-2 ring-offset-1 ring-offset-zinc-950 ring-white/30`
                                    : `${config.bg}/20 ${config.text.replace('text-white', 'text-zinc-300').replace('text-black', 'text-zinc-300')} hover:${config.bg}/40`
                                    }`}
                            >
                                {categoryLabels[cat]}
                            </button>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="text-zinc-500 text-sm">
                        {monthDates.length} data(s) em {months[selectedMonth]}
                        {selectedCategory !== 'all' && (
                            <span className="ml-2">
                                • Filtro: <span className="text-white">{categoryLabels[selectedCategory]}</span>
                            </span>
                        )}
                    </div>

                    {/* Cards Grid */}
                    {monthDates.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500">
                            Nenhuma data encontrada para este mês com os filtros selecionados.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {monthDates.map((d, i) => {
                                const [, day] = d.date.split('-');
                                const config = categoryConfig[d.category] || { bg: 'bg-zinc-600', text: 'text-white' };
                                const label = categoryLabels[d.category] || d.category;

                                return (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl px-4 py-3 transition-all group"
                                    >
                                        {/* Left - Emoji and Info */}
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <span className="text-2xl flex-shrink-0">{d.emoji}</span>
                                            <div className="min-w-0">
                                                <h3 className="text-white font-medium truncate text-sm" title={d.name}>
                                                    {d.name}
                                                </h3>
                                                <span className="text-zinc-500 text-xs">Dia {parseInt(day)}</span>
                                            </div>
                                        </div>

                                        {/* Right - Category Badge */}
                                        <div className={`px-2.5 py-1 rounded-md text-xs font-semibold flex-shrink-0 ml-2 ${config.bg} ${config.text}`}>
                                            {label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeasonalCalendarPage;
