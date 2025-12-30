import React, { useState, useEffect, useRef } from 'react';
import {
    MessageCircle,
    Send,
    MoreVertical,
    Edit2,
    Trash2,
    Reply,
    AtSign,
    Clock,
    X,
    User
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Comment {
    id: string;
    demand_id: string;
    user_id: string;
    user_name: string;
    content: string;
    mentions: string[];
    parent_comment_id: string | null;
    is_edited: boolean;
    is_deleted: boolean;
    created_at: string;
    replies?: Comment[];
}

interface DemandCommentsProps {
    demandId: string;
    demandTitle?: string;
}

export const DemandComments: React.FC<DemandCommentsProps> = ({
    demandId,
    demandTitle
}) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [editingComment, setEditingComment] = useState<Comment | null>(null);
    const [showMentions, setShowMentions] = useState(false);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [mentionedUsers, setMentionedUsers] = useState<{ id: string; name: string }[]>([]);

    // Fetch comments
    useEffect(() => {
        fetchComments();
        fetchUsers();

        // Realtime subscription
        const supabase = getSupabase();
        if (!supabase) return;

        const subscription = supabase
            .channel(`comments:${demandId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `demand_id=eq.${demandId}`
                },
                () => fetchComments()
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [demandId]);

    const fetchComments = async () => {
        const supabase = getSupabase();
        if (!supabase) return;
        try {
            const { data, error } = await (supabase as any)
                .from('comments')
                .select('*')
                .eq('demand_id', demandId)
                .or('is_deleted.is.null,is_deleted.eq.false')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Organize into threads
            const topLevel = (data as Comment[])?.filter(c => !c.parent_comment_id) || [];
            const withReplies = topLevel.map(comment => ({
                ...comment,
                replies: (data as Comment[])?.filter(c => c.parent_comment_id === comment.id) || []
            }));


            setComments(withReplies);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        const supabase = getSupabase();
        if (!supabase) return;
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('status', 'active');
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setIsSubmitting(true);
        try {
            // Extract mentions - collect IDs from mentionedUsers state
            const mentions: string[] = mentionedUsers.map(u => u.id);

            // Content is already clean with @Name format
            const cleanContent = newComment;

            const commentData = {
                demand_id: demandId,
                user_id: user.id,
                user_name: user.name,
                content: cleanContent,
                mentions,
                parent_comment_id: replyingTo?.id || null
            };

            const supabase = getSupabase();
            if (!supabase) return;

            if (editingComment) {
                await (supabase as any)
                    .from('comments')
                    .update({
                        content: cleanContent,
                        mentions,
                        is_edited: true,
                        edited_at: new Date().toISOString()
                    })
                    .eq('id', editingComment.id);
            } else {
                await (supabase as any)
                    .from('comments')
                    .insert(commentData);
            }

            setNewComment('');
            setMentionedUsers([]);
            setReplyingTo(null);
            setEditingComment(null);
            await fetchComments();
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        const supabase = getSupabase();
        if (!supabase) return;
        try {
            await (supabase as any)
                .from('comments')
                .update({ is_deleted: true, deleted_at: new Date().toISOString() })
                .eq('id', commentId);
            await fetchComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
        setActiveMenu(null);
    };

    const handleEdit = (comment: Comment) => {
        setEditingComment(comment);
        setNewComment(comment.content);
        textareaRef.current?.focus();
        setActiveMenu(null);
    };

    const handleReply = (comment: Comment) => {
        setReplyingTo(comment);
        textareaRef.current?.focus();
    };

    const handleMention = (mentionedUser: { id: string; name: string }) => {
        const beforeMention = newComment.slice(0, newComment.lastIndexOf('@'));
        setNewComment(`${beforeMention}@${mentionedUser.name} `);
        // Track mentioned user for sending to backend
        if (!mentionedUsers.find(u => u.id === mentionedUser.id)) {
            setMentionedUsers([...mentionedUsers, mentionedUser]);
        }
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNewComment(value);

        // Check for @ trigger
        const lastAtIndex = value.lastIndexOf('@');
        if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
            setShowMentions(true);
            setMentionQuery('');
        } else if (lastAtIndex !== -1) {
            const afterAt = value.slice(lastAtIndex + 1);
            const hasSpace = afterAt.includes(' ');
            if (!hasSpace && afterAt.length < 20) {
                setShowMentions(true);
                setMentionQuery(afterAt.toLowerCase());
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(mentionQuery) && u.id !== user?.id
    );

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}min`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString('pt-BR');
    };

    const renderComment = (comment: Comment, isReply = false) => (
        <div
            key={comment.id}
            className={`group ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}
        >
            <div className={`flex gap-3 p-3 rounded-lg ${isReply ? 'bg-white/[0.01]' : 'bg-white/[0.02]'} hover:bg-white/[0.04] transition-colors`}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-zinc-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{comment.user_name}</span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock size={10} />
                            {formatTime(comment.created_at)}
                        </span>
                        {comment.is_edited && (
                            <span className="text-xs text-zinc-600">(editado)</span>
                        )}
                    </div>

                    <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
                        {comment.content.split(/(@\w+)/g).map((part, i) =>
                            part.startsWith('@') ? (
                                <span key={i} className="font-semibold" style={{ color: '#bcd200' }}>{part}</span>
                            ) : part
                        )}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleReply(comment)}
                            className="text-xs text-zinc-500 hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            <Reply size={12} />
                            Responder
                        </button>
                    </div>
                </div>

                {/* Menu */}
                {user?.id === comment.user_id && (
                    <div className="relative">
                        <button
                            onClick={() => setActiveMenu(activeMenu === comment.id ? null : comment.id)}
                            className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <MoreVertical size={14} />
                        </button>

                        {activeMenu === comment.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-white/10 rounded-lg shadow-lg overflow-hidden z-10">
                                <button
                                    onClick={() => handleEdit(comment)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
                                >
                                    <Edit2 size={12} />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 size={12} />
                                    Excluir
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Replies */}
            {comment.replies?.map(reply => renderComment(reply, true))}
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-zinc-400">
                <MessageCircle size={18} />
                <h3 className="text-sm font-medium">
                    Comentários ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
                </h3>
            </div>

            {/* Comments List */}
            <div className="max-h-96 overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="flex gap-3 p-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                                <div className="flex-1">
                                    <div className="h-3 bg-zinc-800 rounded w-24 mb-2" />
                                    <div className="h-3 bg-zinc-800/60 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageCircle size={32} className="mx-auto text-zinc-700 mb-2" />
                        <p className="text-sm text-zinc-500">Nenhum comentário ainda</p>
                        <p className="text-xs text-zinc-600">Seja o primeiro a comentar</p>
                    </div>
                ) : (
                    comments.map(comment => renderComment(comment))
                )}
            </div>

            {/* Reply indicator */}
            {replyingTo && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                    <Reply size={14} className="text-primary" />
                    <span className="text-zinc-400">Respondendo a</span>
                    <span className="text-white font-medium">{replyingTo.user_name}</span>
                    <button
                        onClick={() => setReplyingTo(null)}
                        className="ml-auto p-1 rounded hover:bg-white/10"
                    >
                        <X size={12} className="text-zinc-500" />
                    </button>
                </div>
            )}

            {/* Edit indicator */}
            {editingComment && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                    <Edit2 size={14} className="text-blue-400" />
                    <span className="text-zinc-400">Editando comentário</span>
                    <button
                        onClick={() => {
                            setEditingComment(null);
                            setNewComment('');
                        }}
                        className="ml-auto p-1 rounded hover:bg-white/10"
                    >
                        <X size={12} className="text-zinc-500" />
                    </button>
                </div>
            )}

            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={handleTextChange}
                            placeholder="Escreva um comentário... Use @ para mencionar"
                            className="w-full px-4 py-3 pr-10 bg-white/[0.02] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                            rows={2}
                        />
                        <button
                            type="button"
                            onClick={() => setShowMentions(!showMentions)}
                            className="absolute right-3 top-3 p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-primary transition-colors"
                        >
                            <AtSign size={14} />
                        </button>

                        {/* Mentions Dropdown */}
                        {showMentions && filteredUsers.length > 0 && (
                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-900 border border-white/10 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20">
                                {filteredUsers.slice(0, 5).map(u => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => handleMention(u)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <User size={12} className="text-zinc-500" />
                                        </div>
                                        <span className="text-white">{u.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        className="px-4 py-2 bg-primary text-zinc-900 rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Send size={16} />
                        {isSubmitting ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DemandComments;
