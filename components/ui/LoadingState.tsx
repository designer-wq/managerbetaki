import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
    overlay?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    text = 'Carregando...',
    size = 'md',
    fullScreen = false,
    overlay = false
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative">
                <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
                <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-primary/20 rounded-full`} />
            </div>
            {text && (
                <p className={`${textSizes[size]} text-zinc-400 animate-pulse`}>
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
                {content}
            </div>
        );
    }

    if (overlay) {
        return (
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-40 rounded-lg">
                {content}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-12">
            {content}
        </div>
    );
};

// Skeleton components for loading states
export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
    <div className="card-enterprise p-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
            <div key={i} className="h-3 bg-zinc-800/60 rounded w-full mb-2" />
        ))}
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 4
}) => (
    <div className="animate-pulse">
        {/* Header */}
        <div className="flex gap-4 p-4 border-b border-white/5">
            {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className="h-4 bg-zinc-800 rounded flex-1" />
            ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 p-4 border-b border-white/5">
                {Array.from({ length: cols }).map((_, colIndex) => (
                    <div
                        key={colIndex}
                        className="h-3 bg-zinc-800/60 rounded flex-1"
                        style={{ width: `${60 + Math.random() * 40}%` }}
                    />
                ))}
            </div>
        ))}
    </div>
);

export const SkeletonChart: React.FC = () => (
    <div className="card-enterprise p-6 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/4 mb-6" />
        <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 7 }).map((_, i) => (
                <div
                    key={i}
                    className="flex-1 bg-zinc-800/60 rounded-t"
                    style={{ height: `${30 + Math.random() * 70}%` }}
                />
            ))}
        </div>
    </div>
);

export const SkeletonStats: React.FC<{ count?: number }> = ({ count = 4 }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="card-enterprise p-4 animate-pulse">
                <div className="h-3 bg-zinc-800 rounded w-1/2 mb-3" />
                <div className="h-8 bg-zinc-800/60 rounded w-3/4" />
            </div>
        ))}
    </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`${sizes[size]} rounded-full bg-zinc-800 animate-pulse`} />
    );
};

export default LoadingState;
