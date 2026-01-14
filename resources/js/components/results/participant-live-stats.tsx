import { normalizeGender } from '@/lib/normalizeGender';
import { type Participant, type CheckpointSplit } from './participant-card';

interface Props {
    participant: Participant;
    isFinished: boolean;
    lastReachedCheckpoint: CheckpointSplit | null;
    currentDistance: number;
    totalDistance: number;
    distanceProgress: number;
    currentElevationGain: number;
    totalElevationGain: number;
    elevationProgress: number;
}

export function ParticipantLiveStats({
    participant,
    isFinished,
    lastReachedCheckpoint,
    currentDistance,
    totalDistance,
    distanceProgress,
    currentElevationGain,
    totalElevationGain,
    elevationProgress
}: Props) {
    return (
        <div className="grid grid-cols-2 gap-3 shrink-0">
            {/* 1. Position / Last CP (Only show if NOT finished) */}
            {!isFinished && (
                <div className="col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#100d67] text-white p-5 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[100px]">
                    <div className="relative z-10">
                        <div className="text-[10px] font-bold uppercase text-indigo-200 mb-1 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            Last Position
                        </div>
                        <div className="text-2xl font-bold uppercase tracking-tight leading-tight">
                            {lastReachedCheckpoint ? lastReachedCheckpoint.name : 'Start Line'}
                        </div>
                        {lastReachedCheckpoint?.time && (
                            <div className="mt-1 font-mono text-base text-indigo-300">
                                Checked in at {lastReachedCheckpoint.time}
                            </div>
                        )}
                    </div>
                    {/* Decorative bg circle */}
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-10"></div>
                </div>
            )}

            {/* 2. Distance */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                    <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-2">Distance</div>
                    <div className="flex items-baseline gap-1">
                        <div className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {currentDistance.toFixed(1)}
                        </div>
                        <span className="text-xs text-slate-500 font-bold">km</span>
                    </div>
                    {totalDistance > 0 && (
                        <div className="mt-3">
                            <div className="flex justify-between text-[10px] items-center mb-1.5 text-slate-500">
                                <span className="font-mono">{distanceProgress.toFixed(0)}%</span>
                                <span className="font-mono">{totalDistance.toFixed(1)} km</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(distanceProgress, 100)}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Elevation Gain */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                    <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-2">Elev. Gain</div>
                    <div className="flex items-baseline gap-1">
                        <div className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {Math.round(currentElevationGain)}
                        </div>
                        <span className="text-xs text-slate-500 font-bold">m</span>
                    </div>
                    {totalElevationGain > 0 && (
                        <div className="mt-3">
                            <div className="flex justify-between text-[10px] items-center mb-1.5 text-slate-500">
                                <span className="font-mono">{elevationProgress.toFixed(0)}%</span>
                                <span className="font-mono">{Math.round(totalElevationGain)} m</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(elevationProgress, 100)}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Rank */}
            <div className="col-span-2 flex gap-3">
                <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 text-center shadow-sm">
                    <div className="font-mono text-3xl font-bold italic text-[#f00102] dark:text-red-400">
                        {participant.overallRank > 0 ? participant.overallRank.toString().padStart(2, '0') : '-'}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Overall Rank</div>
                </div>
                <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 text-center shadow-sm">
                    <div className="font-mono text-3xl font-bold italic text-[#100d67] dark:text-indigo-400">
                        {participant.genderRank > 0 ? participant.genderRank.toString().padStart(2, '0') : '-'}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {normalizeGender(participant.gender)?.toUpperCase() || 'Gender'} Rank
                    </div>
                </div>
            </div>
        </div>
    );
}
