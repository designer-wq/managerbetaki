
import React from 'react';

interface SkeletonProps extends React.ComponentProps<'div'> {
    className?: string;
}

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-md bg-zinc-700/50 ${className}`}
            {...props}
        />
    );
}

export { Skeleton };
