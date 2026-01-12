import { type Event } from '@/types';

interface Props {
    event: Event;
    isLive?: boolean;
}

export function EventHeader({ event, isLive }: Props) {
    return (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="flex flex-col gap-3">
                    {isLive && (
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                            </span>
                            <span className="text-sm font-medium text-red-400">LIVE</span>
                        </div>
                    )}

                    <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">
                        {event.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                        <span>{event.location}</span>
                        <span>•</span>
                        <span>
                            {new Date(event.start_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
