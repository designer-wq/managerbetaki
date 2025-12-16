import React, { useEffect, useState } from 'react';
import { Bell, Plus, Menu } from 'lucide-react';
import { fetchAllLogs, fetchRecentComments, fetchRecentMentions, fetchDemandsByIds, fetchTable } from '../lib/api';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddClick?: () => void;
  addButtonText?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onAddClick, addButtonText }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'comments' | 'mentions'>('status');
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [commentNotifs, setCommentNotifs] = useState<any[]>([]);
  const [mentionNotifs, setMentionNotifs] = useState<any[]>([]);
  const [demandsMap, setDemandsMap] = useState<Record<string, any>>({});
  const [statusesMap, setStatusesMap] = useState<Record<string, any>>({});
  const { user: authUser, profile } = useAuth();
  const userId = profile?.id || authUser?.id;

  const lsKey = (tab: 'status' | 'comments' | 'mentions') => `notif_cleared_${userId}_${tab}`;
  const readCleared = (tab: 'status' | 'comments' | 'mentions') => {
    try {
      const raw = localStorage.getItem(lsKey(tab));
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr);
    } catch {
      return new Set<string>();
    }
  };
  const writeCleared = (tab: 'status' | 'comments' | 'mentions', ids: string[]) => {
    try {
      const current = Array.from(readCleared(tab));
      const merged = Array.from(new Set([...current, ...ids]));
      localStorage.setItem(lsKey(tab), JSON.stringify(merged));
    } catch {}
  };

  const loadNotifications = async () => {
    const logs = await fetchAllLogs(7);
    const statusOnly = (logs || []).filter((l: any) => l.action === 'UPDATE' && l.details && l.details.status_id);
    const clearedStatus = readCleared('status');
    const statusFiltered = (statusOnly || []).filter((l: any) => !clearedStatus.has(l.id));
    statusFiltered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setStatusLogs(statusFiltered);
    const comments = await fetchRecentComments(7);
    const clearedComments = readCleared('comments');
    const commentsFiltered = (comments || []).filter((c: any) => !clearedComments.has(c.id));
    commentsFiltered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setCommentNotifs(commentsFiltered);
    const mentions = await fetchRecentMentions(7);
    const clearedMentions = readCleared('mentions');
    const mentionsFiltered = (mentions || []).filter((m: any) => !clearedMentions.has(m.id));
    mentionsFiltered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setMentionNotifs(mentionsFiltered);
    const ids = Array.from(new Set(statusOnly.map((l: any) => l.record_id).filter(Boolean)));
    const [demands, statuses] = await Promise.all([fetchDemandsByIds(ids), fetchTable('statuses')]);
    const dMap: Record<string, any> = {};
    (demands || []).forEach((d: any) => { dMap[d.id] = d; });
    setDemandsMap(dMap);
    const sMap: Record<string, any> = {};
    (statuses || []).forEach((s: any) => { sMap[s.id] = s; });
    setStatusesMap(sMap);
  };

  useEffect(() => {
    if (!userId) return;
    loadNotifications();
  }, [userId]);

  useRealtimeSubscription(['logs', 'comments'], () => {
    loadNotifications();
  });

  return (
    <header className="relative flex items-center justify-between border-b border-border-dark bg-surface-dark px-8 py-5 shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-white p-2">
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-white text-2xl font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-zinc-400 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPanel(v => !v)}
            className="flex items-center justify-center size-10 rounded-full bg-highlight text-white hover:bg-zinc-700 transition-colors relative"
          >
            <Bell size={20} />
            {(statusLogs.length > 0 || commentNotifs.length > 0) && (
              <span className="absolute top-2 right-2 size-2 bg-primary rounded-full"></span>
            )}
          </button>
          {showPanel && (
            <>
              <div
                className="fixed inset-0 z-[9999] bg-black/30"
                onClick={() => setShowPanel(false)}
              />
              <div className="fixed right-8 top-16 z-[10000] w-[420px] rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
              <div className="flex items-center border-b border-zinc-800 px-1">
                <button
                  onClick={() => setActiveTab('status')}
                  className={`flex-1 px-3 py-2 text-sm font-medium ${activeTab === 'status' ? 'text-zinc-900 bg-[#bcd200]' : 'text-zinc-400 hover:text-white'}`}
                >
                  Status
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 px-3 py-2 text-sm font-medium ${activeTab === 'comments' ? 'text-zinc-900 bg-[#bcd200]' : 'text-zinc-400 hover:text-white'}`}
                >
                  Comentários
                </button>
                <button
                  onClick={() => setActiveTab('mentions')}
                  className={`flex-1 px-3 py-2 text-sm font-medium ${activeTab === 'mentions' ? 'text-zinc-900 bg-[#bcd200]' : 'text-zinc-400 hover:text-white'}`}
                >
                  Menções
                </button>
                <button
                  onClick={() => {
                    if (activeTab === 'status') {
                      const ids = statusLogs.map((i: any) => i.id);
                      writeCleared('status', ids);
                      setStatusLogs([]);
                    } else if (activeTab === 'comments') {
                      const ids = commentNotifs.map((i: any) => i.id);
                      writeCleared('comments', ids);
                      setCommentNotifs([]);
                    } else {
                      const ids = mentionNotifs.map((i: any) => i.id);
                      writeCleared('mentions', ids);
                      setMentionNotifs([]);
                    }
                  }}
                  className="ml-auto px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800"
                  title="Limpar notificações"
                >
                  Limpar
                </button>
              </div>
              <div className="max-h-[360px] overflow-y-auto p-3 space-y-3">
                {activeTab === 'status' ? (
                  statusLogs.length === 0 ? (
                    <div className="text-zinc-500 text-sm">Sem alterações de status recentes.</div>
                  ) : (
                    statusLogs.map((item: any) => {
                      const demand = demandsMap[item.record_id] || {};
                      const stId = item.details?.status_id;
                      const st = statusesMap[stId];
                      return (
                        <div key={item.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500">#{(item.record_id || '').slice(0,8)}</span>
                            <span className="text-xs text-zinc-600">{new Date(item.created_at).toLocaleString()}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <div className="text-sm text-white line-clamp-1">{demand.title || 'Demanda'}</div>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ring-1 ring-inset ${st?.color ? 'text-white' : 'text-zinc-400'} ${st?.color || 'bg-zinc-800 ring-zinc-700'}`}>
                              {st?.name || 'Status alterado'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : activeTab === 'comments' ? (
                  commentNotifs.length === 0 ? (
                    <div className="text-zinc-500 text-sm">Sem comentários recentes.</div>
                  ) : (
                    commentNotifs.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">#{(c.demand_id || '').slice(0,8)}</span>
                          <span className="text-xs text-zinc-600">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-sm text-white line-clamp-3">{c.content}</div>
                        <div className="mt-1 text-xs text-zinc-500">{c.profiles?.name || 'Usuário'}</div>
                      </div>
                    ))
                  )
                ) : (
                  mentionNotifs.length === 0 ? (
                    <div className="text-zinc-500 text-sm">Sem menções recentes.</div>
                  ) : (
                    mentionNotifs.map((m: any) => (
                      <div key={m.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">#{(m.demand_id || '').slice(0,8)}</span>
                          <span className="text-xs text-zinc-600">{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-sm text-white line-clamp-3">{m.content}</div>
                        <div className="mt-1 text-xs text-zinc-500">{m.profiles?.name || 'Usuário'}</div>
                      </div>
                    ))
                  )
                )}
              </div>
              </div>
            </>
          )}

          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-zinc-900 font-bold text-sm hover:brightness-110 transition-all"
            >
              <Plus size={20} />
              <span>{addButtonText || 'Novo'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
