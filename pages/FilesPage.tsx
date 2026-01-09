import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import { Search, ExternalLink, Folder, RefreshCw, Grid, List, Filter, Eye, X } from 'lucide-react';
import { fetchDemands } from '../lib/api';
import { thumbnailCache } from '../lib/thumbnailCache';

interface FileItem {
    id: string;
    demandId: string;
    demandTitle: string;
    driveLink: string;
    fileName: string;
    isFolder: boolean;
    createdAt: string;
    designer?: string;
    priority?: string;
    status?: string;
}

// Extract file ID from Google Drive link
const extractDriveId = (url: string): string | null => {
    if (!url) return null;

    // Skip folder links
    if (url.toLowerCase().includes('/folders/')) return null;

    const patterns = [
        /\/d\/([a-zA-Z0-9_-]+)/,  // /d/ID format
        /id=([a-zA-Z0-9_-]+)/,    // ?id=ID format  
        /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/ID format
        /open\?id=([a-zA-Z0-9_-]+)/, // open?id=ID format
        /uc\?id=([a-zA-Z0-9_-]+)/,   // uc?id=ID format
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            console.log(`🔍 Extracted file ID: ${match[1]} from ${url.substring(0, 50)}...`);
            return match[1];
        }
    }
    console.log(`⚠️ Could not extract ID from: ${url.substring(0, 50)}...`);
    return null;
};

// Check if it's a folder link
const isFolderLink = (url: string): boolean => {
    if (!url) return false;
    return url.toLowerCase().includes('/folders/');
};

// LocalStorage cache for successful thumbnails
const THUMB_CACHE_KEY = 'files_thumb_cache';
const THUMB_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface ThumbCacheEntry {
    url: string;
    timestamp: number;
}

const getThumbCache = (): Record<string, ThumbCacheEntry> => {
    try {
        const cached = localStorage.getItem(THUMB_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            // Clean expired entries
            const now = Date.now();
            const cleaned: Record<string, ThumbCacheEntry> = {};
            Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
                if (now - entry.timestamp < THUMB_CACHE_EXPIRY) {
                    cleaned[key] = entry;
                }
            });
            return cleaned;
        }
    } catch (e) {
        console.error('Error reading thumb cache:', e);
    }
    return {};
};

const setThumbCache = (fileId: string, url: string) => {
    try {
        const cache = getThumbCache();
        cache[fileId] = { url, timestamp: Date.now() };
        localStorage.setItem(THUMB_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error('Error writing thumb cache:', e);
    }
};

const getCachedThumb = (fileId: string): string | null => {
    const cache = getThumbCache();
    const entry = cache[fileId];
    if (entry && Date.now() - entry.timestamp < THUMB_CACHE_EXPIRY) {
        return entry.url;
    }
    return null;
};

// Preview Image Component - Uses localStorage cache for persistence
const PreviewImage: React.FC<{
    fileId: string;
    fileName: string;
}> = ({ fileId, fileName }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        // Check localStorage cache first
        const cached = getCachedThumb(fileId);
        if (cached) {
            setImageUrl(cached);
            setLoading(false);
            return;
        }

        // Generate fresh URL
        const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
        setImageUrl(url);
    }, [fileId]);

    const handleLoad = () => {
        setLoading(false);
        // Cache successful load
        if (imageUrl) {
            setThumbCache(fileId, imageUrl);
        }
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                <Folder className="text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-zinc-800">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-primary rounded-full animate-spin"></div>
                </div>
            )}
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={fileName}
                    className={`w-full h-full object-cover transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                />
            )}
        </div>
    );
};

const FilesPage = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<string>('all');
    const [cacheStats, setCacheStats] = useState<{ count: number; totalSize: number } | null>(null);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const demands = await fetchDemands();

            const extractedFiles: FileItem[] = demands
                .filter((d: any) => d.drive_link && d.drive_link.trim() !== '')
                .map((d: any) => ({
                    id: d.id,
                    demandId: d.id,
                    demandTitle: d.title || 'Sem título',
                    driveLink: d.drive_link,
                    fileName: d.title || 'Arquivo',
                    isFolder: isFolderLink(d.drive_link),
                    createdAt: d.created_at,
                    designer: d.responsible?.name || 'Não atribuído',
                    priority: d.priority || 'Média',
                    status: d.statuses?.name || 'Backlog'
                }));

            setFiles(extractedFiles);
        } catch (error) {
            console.error('Error loading files:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadCacheStats = useCallback(async () => {
        try {
            const stats = await thumbnailCache.getCacheStats();
            setCacheStats(stats);
        } catch (error) {
            console.error('Error loading cache stats:', error);
        }
    }, []);

    const clearCache = useCallback(async () => {
        if (!confirm('Tem certeza que deseja limpar o cache de thumbnails? Isso irá recarregar todas as imagens na próxima vez.')) {
            return;
        }
        try {
            await thumbnailCache.clear();
            // Also clear localStorage cache
            localStorage.removeItem(THUMB_CACHE_KEY);
            setCacheStats({ count: 0, totalSize: 0 });
            // Reload page to force image refresh
            window.location.reload();
        } catch (error) {
            console.error('Error clearing cache:', error);
            alert('Erro ao limpar cache');
        }
    }, []);

    useEffect(() => {
        loadFiles();
        loadCacheStats();
    }, [loadFiles, loadCacheStats]);

    // Filter files
    const filteredFiles = useMemo(() => {
        return files.filter(file => {
            const matchesSearch =
                file.demandTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.designer?.toLowerCase().includes(searchTerm.toLowerCase());

            if (filterType === 'all') return matchesSearch;
            if (filterType === 'folder') return matchesSearch && file.isFolder;
            if (filterType === 'file') return matchesSearch && !file.isFolder;
            return matchesSearch;
        });
    }, [files, searchTerm, filterType]);

    // Get priority color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Alta': return 'bg-red-500 text-white';
            case 'Baixa': return 'bg-blue-500 text-white';
            default: return 'bg-yellow-500 text-black';
        }
    };

    // Format bytes to human readable
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
            <Header
                title="Arquivos das Demandas"
                subtitle={`${filteredFiles.length} arquivos encontrados`}
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto">

                    {/* Filters Bar */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
                        {/* Search */}
                        <div className="flex w-full md:w-auto flex-1 items-center bg-zinc-900/50 px-4 py-3 border border-zinc-700/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all rounded-lg">
                            <Search size={20} className="text-zinc-500" />
                            <input
                                className="ml-3 w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                                placeholder="Buscar por demanda..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-2">
                            <Filter size={16} className="text-zinc-500" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-transparent text-sm text-white outline-none cursor-pointer"
                            >
                                <option value="all">Todos os tipos</option>
                                <option value="file">Arquivos</option>
                                <option value="folder">Pastas</option>
                            </select>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-primary text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-primary text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={loadFiles}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span className="text-sm">Atualizar</span>
                        </button>

                        {/* Cache Info & Clear Button */}
                        {cacheStats && cacheStats.count > 0 && (
                            <>
                                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm">
                                    <span className="text-primary font-medium">
                                        💾 {cacheStats.count} thumbnails ({formatBytes(cacheStats.totalSize)})
                                    </span>
                                </div>
                                <button
                                    onClick={clearCache}
                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                                    title="Limpar cache de thumbnails"
                                >
                                    <X size={16} />
                                    <span className="text-sm">Limpar Cache</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="text-center py-20 px-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                            <Folder className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-zinc-300 font-medium text-lg mb-2">Nenhum arquivo encontrado</h3>
                            <p className="text-zinc-500 text-sm">
                                {searchTerm || filterType !== 'all'
                                    ? 'Tente ajustar os filtros de busca.'
                                    : 'As demandas ainda não possuem links do Google Drive vinculados.'}
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* Grid View */
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredFiles.map((file) => {
                                const fileId = extractDriveId(file.driveLink);

                                return (
                                    <div
                                        key={file.id}
                                        className="group relative flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 overflow-hidden transition-all"
                                    >
                                        {/* Preview Area */}
                                        <div className="relative aspect-square bg-zinc-800 overflow-hidden">
                                            {/* File type icon in corner */}
                                            <div className="absolute top-2 left-2 z-10">
                                                <div className="p-1 bg-zinc-900/80 rounded">
                                                    <Folder size={14} className="text-zinc-400" />
                                                </div>
                                            </div>

                                            {/* Priority badge */}
                                            <div className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityColor(file.priority || 'Média')}`}>
                                                {file.priority}
                                            </div>

                                            {/* Preview Image or Folder Icon */}
                                            {file.isFolder ? (
                                                // Only show folder icon for folder links
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                                    <Folder className="text-primary" size={64} />
                                                </div>
                                            ) : fileId ? (
                                                // Force load thumbnail for file links
                                                <PreviewImage fileId={fileId} fileName={file.fileName} />
                                            ) : (
                                                // Fallback if no ID extracted
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                                    <Folder className="text-primary" size={64} />
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                <a
                                                    href={file.driveLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Eye size={16} />
                                                    Visualizar
                                                </a>
                                                <a
                                                    href={file.driveLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-3 flex flex-col gap-1">
                                            <h3 className="text-white font-medium text-xs line-clamp-1" title={file.demandTitle}>
                                                {file.demandTitle}
                                            </h3>
                                            <span className="text-zinc-500 text-[10px]">
                                                {file.status?.includes('onclu') ? 'Concluído' : file.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* List View */
                        <div className="card-enterprise border border-zinc-800 overflow-hidden rounded-xl">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                        <th className="px-4 py-3 text-left font-medium text-zinc-400 text-xs uppercase tracking-wider">Preview</th>
                                        <th className="px-4 py-3 text-left font-medium text-zinc-400 text-xs uppercase tracking-wider">Demanda</th>
                                        <th className="px-4 py-3 text-left font-medium text-zinc-400 text-xs uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left font-medium text-zinc-400 text-xs uppercase tracking-wider">Prioridade</th>
                                        <th className="px-4 py-3 text-right font-medium text-zinc-400 text-xs uppercase tracking-wider">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filteredFiles.map((file) => {
                                        const fileId = extractDriveId(file.driveLink);
                                        return (
                                            <tr key={file.id} className="hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800">
                                                        {file.isFolder ? (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Folder className="text-primary" size={24} />
                                                            </div>
                                                        ) : fileId ? (
                                                            <PreviewImage fileId={fileId} fileName={file.fileName} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Folder className="text-primary" size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-white text-sm font-medium line-clamp-1">{file.demandTitle}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-zinc-400 text-sm">
                                                        {file.status?.includes('onclu') ? 'Concluído' : file.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityColor(file.priority || 'Média')}`}>
                                                        {file.priority}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <a
                                                        href={file.driveLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-primary hover:text-black text-xs font-medium transition-all"
                                                    >
                                                        <ExternalLink size={14} />
                                                        Abrir
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilesPage;
