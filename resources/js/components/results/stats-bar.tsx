import { Clock, Trophy, Users } from 'lucide-react';

interface Props {
    totalParticipants: number;
    finishers: number;
    bestTime?: string | null;
}

export function StatsBar({ totalParticipants, finishers, bestTime }: Props) {
    return (
        <div className="border-b bg-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Users className="h-4 w-4" />
                        <span>
                            <strong className="text-slate-900">{totalParticipants}</strong> Participants
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Trophy className="h-4 w-4" />
                        <span>
                            <strong className="text-slate-900">{finishers}</strong> Finishers
                        </span>
                    </div>
                    {bestTime && (
                        <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="h-4 w-4" />
                            <span>
                                Best: <strong className="text-slate-900">{bestTime}</strong>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
