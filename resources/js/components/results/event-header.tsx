import { Button } from '@/components/ui/button';
import { type Event } from '@/types';
import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface Props {
    event: Event;
    isLive?: boolean;
    activeCategorySlug: string;
}

export function EventHeader({ event, isLive, activeCategorySlug }: Props) {
    return (
        <div className="bg-white dark:bg-slate-950 pt-6 pb-2">
            <div className="mx-auto max-w-6xl px-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        {isLive && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f00102]/40 dark:bg-red-400/40 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f00102] dark:bg-red-400"></span>
                                </span>
                                <span className="text-[10px] font-bold tracking-widest text-[#f00102] dark:text-red-400 uppercase">
                                    LIVE RESULTS
                                </span>
                            </div>
                        )}

                        <h1 className="text-xl font-black uppercase italic tracking-tight text-[#100d67] dark:text-slate-100 md:text-3xl">
                            {event.title}
                        </h1>
                    </div>
                    <div className="flex items-start gap-2">
                        <RefreshButton eventSlug={event.slug} activeCategorySlug={activeCategorySlug} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function RefreshButton({ eventSlug, activeCategorySlug }: { eventSlug: string; activeCategorySlug: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleRefresh = () => {
        setIsLoading(true);
        router.cancel();
        router.visit(`/${eventSlug}`, {
            headers: {
                'X-Force-Refresh': 'true',
            },
            data: { category: activeCategorySlug },
            only: ['leaderboard', 'activeCategory', 'elevationData', 'elevationWaypoints', 'isLive'],
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 gap-2 text-xs"
        >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
    );
}
