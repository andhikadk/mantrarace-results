import { type CheckpointSplit } from './participant-card';

interface Props {
    checkpoints: CheckpointSplit[];
    lastReachedCheckpointIndex: number;
}

export function ParticipantTimeline({ checkpoints, lastReachedCheckpointIndex }: Props) {
    const hasCheckpoints = checkpoints.length > 0;

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col flex-1 bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            <div className="bg-slate-50/50 dark:bg-slate-800/30 px-5 py-4 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm shrink-0">
                <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-slate-100 tracking-wide flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f00102] dark:bg-red-500"></div>
                    Race Timeline
                </h3>
            </div>
            <div className="p-0 overflow-y-auto min-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {hasCheckpoints ? (
                    <div className="relative pl-8 pr-5 py-6 space-y-0">
                        {/* Vertical Line */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                        {checkpoints.map((cp, idx) => {
                            const isPassed = !!cp.time;
                            const isLastPassed = idx === lastReachedCheckpointIndex;
                            return (
                                <div key={idx} className={`relative pb-8 last:pb-0 ${!isPassed ? 'opacity-60 grayscale' : ''}`}>
                                    {/* Dot Indicator */}
                                    <div className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 z-10 transition-all duration-300 ${isPassed
                                        ? 'bg-[#100d67] border-[#100d67] dark:bg-indigo-500 dark:border-indigo-500'
                                        : 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                                        } ${isLastPassed ? 'ring-4 ring-indigo-100 dark:ring-indigo-900/40 scale-110' : ''}`}></div>

                                    {/* Content */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className={`text-sm font-bold ${isPassed ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-500'}`}>
                                                    {cp.name}
                                                </div>
                                                {isPassed && (
                                                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                                                        Segment: {cp.segment ? `+${cp.segment}` : '-'}
                                                    </div>
                                                )}
                                            </div>
                                            {isPassed ? (
                                                <div className="text-right">
                                                    <div className="font-mono text-sm font-bold text-[#100d67] dark:text-indigo-400">
                                                        {cp.time}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs font-medium text-slate-400 italic">--:--</div>
                                            )}
                                        </div>
                                        {isPassed && (
                                            <div className="flex gap-2 mt-1.5">
                                                <div className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    <span className="text-[9px] uppercase text-slate-400">Overall Rank</span>
                                                    <span className="font-mono font-bold">{cp.overallRank || '-'}</span>
                                                </div>
                                                <div className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                                                    <span className="text-[9px] uppercase text-indigo-400/80">Gender Rank</span>
                                                    <span className="font-mono font-bold">{cp.genderRank || '-'}</span>
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 box-content border-4 border-slate-200 dark:border-slate-700"></div>
                        </div>
                        No checkpoint data available
                    </div>
                )}
            </div>
        </div>
    );
}
