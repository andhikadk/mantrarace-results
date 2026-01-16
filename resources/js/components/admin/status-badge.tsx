import { cn } from '@/lib/utils';

type StatusType = 'draft' | 'published' | 'live' | 'finished' | 'upcoming';

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
    draft: {
        label: 'Draft',
        className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    },
    published: {
        label: 'Published',
        className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    },
    live: {
        label: 'Live',
        className: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    },
    finished: {
        label: 'Finished',
        className: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500',
    },
    upcoming: {
        label: 'Upcoming',
        className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                config.className,
                status === 'live' && 'animate-pulse',
                className
            )}
        >
            {config.label}
        </span>
    );
}

export function getEventStatus(startDate: string, endDate: string): StatusType {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'live';
    return 'finished';
}
