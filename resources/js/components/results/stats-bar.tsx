import { Clock, Trophy, Users } from 'lucide-react';

interface Props {
    totalParticipants: number;
    finishers: number;
    bestTime?: string | null;
}

export function StatsBar({ totalParticipants, finishers, bestTime }: Props) {
    return (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="mx-auto max-w-5xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Users className="h-4 w-4" />
                        <span>
                            <strong className="text-slate-900 dark:text-slate-100">{totalParticipants}</strong> Participants
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Trophy className="h-4 w-4" />
                        <span>
                            <strong className="text-slate-900 dark:text-slate-100">{finishers}</strong> Finishers
                        </span>
                    </div>
                    {bestTime && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Clock className="h-4 w-4" />
                            <span>
                                Best: <strong className="text-slate-900 dark:text-slate-100">{bestTime}</strong>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
