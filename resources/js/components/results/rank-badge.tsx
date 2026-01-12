import { cn } from '@/lib/utils';
import { Medal, Trophy } from 'lucide-react';

interface Props {
    rank: number;
    size?: 'sm' | 'md';
}

export function RankBadge({ rank, size = 'md' }: Props) {
    const sizeClasses = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm';

    if (rank === 1) {
        return (
            <div className={cn(
                'flex items-center justify-center rounded-full bg-amber-400 text-amber-900 font-bold',
                sizeClasses
            )}>
                <Trophy className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            </div>
        );
    }

    if (rank === 2) {
        return (
            <div className={cn(
                'flex items-center justify-center rounded-full bg-slate-300 text-slate-700 font-bold',
                sizeClasses
            )}>
                <Medal className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            </div>
        );
    }

    if (rank === 3) {
        return (
            <div className={cn(
                'flex items-center justify-center rounded-full bg-orange-400 text-orange-900 font-bold',
                sizeClasses
            )}>
                <Medal className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            </div>
        );
    }

    if (rank <= 10) {
        return (
            <div className={cn(
                'flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold',
                sizeClasses
            )}>
                {rank}
            </div>
        );
    }

    return (
        <div className={cn(
            'flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium',
            sizeClasses
        )}>
            {rank}
        </div>
    );
}
