import { type Event } from '@/types';

interface Props {
    event: Event;
    isLive?: boolean;
}

export function EventHeader({ event, isLive }: Props) {
    return (
        <div className="bg-[#efefef] pt-6 pb-2">
            <div className="mx-auto max-w-6xl px-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        {!isLive && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f00102]/40 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f00102]"></span>
                                </span>
                                <span className="text-[10px] font-bold tracking-widest text-[#f00102] uppercase">
                                    LIVE RESULTS
                                </span>
                            </div>
                        )}

                        <h1 className="text-xl font-black uppercase italic tracking-tight text-[#100d67] md:text-3xl">
                            {event.title}
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    );
}
