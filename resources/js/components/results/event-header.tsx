import { type Event } from '@/types';
import { Share2 } from 'lucide-react';

interface Props {
    event: Event;
    isLive?: boolean;
}

export function EventHeader({ event, isLive }: Props) {
    return (
        <div className="bg-white pt-6 pb-2">
            <div className="mx-auto max-w-5xl px-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        {isLive && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
                                </span>
                                <span className="text-[10px] font-bold tracking-widest text-red-600 uppercase">
                                    LIVE RESULTS
                                </span>
                            </div>
                        )}

                        <h1 className="text-xl font-black uppercase italic tracking-tight text-[#1a2744] md:text-3xl">
                            {event.title}
                        </h1>
                    </div>

                    <button
                        type="button"
                        aria-label="Share event"
                        className="rounded-full bg-slate-100 p-2 text-[#1a2744] transition-colors hover:bg-slate-200"
                    >
                        <Share2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
