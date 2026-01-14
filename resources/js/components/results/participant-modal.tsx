import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getDisplayStatus, getFlagCode, getStatusBadge } from '@/lib/participantUtils';
import { normalizeGender } from '@/lib/normalizeGender';
import { ChevronLeft, Download, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { SegmentPaceChart } from './segment-pace-chart';
import { ElevationChart } from './elevation-chart';
import { type Participant } from './participant-card';

interface ElevationPoint {
    distance: number;
    elevation: number;
}

interface ElevationWaypoint {
    name: string;
    distance: number;
    elevation: number;
}

interface Props {
    participant: Participant | null;
    open: boolean;
    onClose: () => void;
    eventSlug: string;
    categorySlug: string;
    certificateEnabled?: boolean;
    elevationData?: ElevationPoint[];
    elevationWaypoints?: ElevationWaypoint[];
}

function StatusBadge({ status }: { status: string }) {
    const badge = getStatusBadge(status);
    return (
        <span className={`inline-flex rounded-full ${badge.bgClass} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.textClass}`}>
            {badge.label}
        </span>
    );
}

export function ParticipantModal({ participant, open, onClose, eventSlug, categorySlug, certificateEnabled, elevationData, elevationWaypoints }: Props) {
    const [showFullscreen, setShowFullscreen] = useState(false);

    if (!participant) return null;

    const displayStatus = getDisplayStatus(participant.status, participant.finishTime);
    const statusBadge = getStatusBadge(displayStatus);
    const isFinished = displayStatus === 'FINISHED' || !!participant.finishTime;
    const flagCode = getFlagCode(participant.nation);
    const hasCheckpoints = participant.checkpoints.length > 0;


    // --- LIVE STATS CALCULATION (Index Matching) ---
    // 1. Find the last checkpoint index with a time
    let lastReachedCheckpointIndex = -1;
    participant.checkpoints.forEach((cp, idx) => {
        if (cp.time) lastReachedCheckpointIndex = idx;
    });

    const lastReachedCheckpoint = lastReachedCheckpointIndex >= 0
        ? participant.checkpoints[lastReachedCheckpointIndex]
        : null;

    // 2. Get Distance from corresponding GPX Waypoint (Index Match)
    let currentDistance = 0;
    if (elevationWaypoints && elevationWaypoints.length > 0) {
        if (lastReachedCheckpointIndex >= 0 && lastReachedCheckpointIndex < elevationWaypoints.length) {
            currentDistance = elevationWaypoints[lastReachedCheckpointIndex].distance;
        } else if (isFinished && elevationWaypoints.length > 0) {
            // If finished but index out of bounds, assume full distance from last waypoint
            currentDistance = elevationWaypoints[elevationWaypoints.length - 1].distance;
        }
    }

    // 3. Calculate Elevation Gain up to currentDistance AND Total Stats
    let currentElevationGain = 0;
    let totalElevationGain = 0;
    let totalDistance = 0;

    if (elevationData && elevationData.length > 0) {
        // Total Distance
        totalDistance = elevationData[elevationData.length - 1].distance;

        // Calculate Gains
        for (let i = 1; i < elevationData.length; i++) {
            const point = elevationData[i];
            const prevPoint = elevationData[i - 1];
            const diff = point.elevation - prevPoint.elevation;

            if (diff > 0) {
                totalElevationGain += diff;
                if (point.distance <= currentDistance) {
                    currentElevationGain += diff;
                }
            }
        }
    }

    // Force 100% if finished
    if (isFinished) {
        currentDistance = totalDistance;
        currentElevationGain = totalElevationGain;
    }

    const distanceProgress = totalDistance > 0 ? (currentDistance / totalDistance) * 100 : 0;
    const elevationProgress = totalElevationGain > 0 ? (currentElevationGain / totalElevationGain) * 100 : 0;

    return (
        <>
            {/* Summary Modal */}
            <Dialog open={open && !showFullscreen} onOpenChange={(o) => !o && onClose()}>
                <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-lg p-0 gap-0 dark:bg-slate-950 dark:border-slate-800 [&>button]:hidden">
                    {/* Header Section */}
                    <DialogHeader className="p-5 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-3">
                            {/* BIB + Name + Flag */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="relative inline-flex h-8 min-w-[56px] items-center justify-center border border-[#100d67] dark:border-slate-600 bg-white dark:bg-slate-950 px-3 font-mono font-extrabold text-[#100d67] dark:text-slate-100 shadow-[inset_0_0_0_1px_rgba(16,13,103,0.06)] ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                                    <span className="absolute left-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute right-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute left-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute right-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    {participant.bib}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="text-left text-base font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                                        {participant.name}
                                        {flagCode && (
                                            <span
                                                className={`fi fi-${flagCode} ml-2 align-middle`}
                                                title={participant.nation}
                                                aria-label={participant.nation}
                                            />
                                        )}
                                    </DialogTitle>
                                    {participant.club && (
                                        <div className="mt-1 text-left text-sm text-slate-500 dark:text-slate-400 truncate">
                                            {participant.club}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Badge */}
                            <span className={`inline-flex rounded-full ${statusBadge.bgClass} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadge.textClass} shrink-0`}>
                                {statusBadge.label}
                            </span>
                        </div>
                    </DialogHeader>

                    <div className="p-5 space-y-5">
                        {/* Stats Section - 3 Columns */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 text-center">
                                <div className="font-mono text-3xl font-bold italic text-[#f00102] dark:text-red-400">
                                    {participant.overallRank > 0 ? participant.overallRank.toString().padStart(2, '0') : '-'}
                                </div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    Overall Rank
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 text-center">
                                <div className="font-mono text-3xl font-bold italic text-[#100d67] dark:text-indigo-400">
                                    {participant.genderRank > 0 ? participant.genderRank.toString().padStart(2, '0') : '-'}
                                </div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    {normalizeGender(participant.gender)?.toUpperCase() || 'Gender'} Rank
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 text-center">
                                <div className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {participant.finishTime || '--:--:--'}
                                </div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    Finish Time
                                </div>
                            </div>
                        </div>

                        {/* Secondary Time Info */}
                        {(participant.netTime || participant.gap) && (
                            <div className="flex items-center justify-center gap-6 text-sm">
                                {participant.netTime && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 dark:text-slate-400">Net Time:</span>
                                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                                            {participant.netTime}
                                        </span>
                                    </div>
                                )}
                                {participant.gap && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 dark:text-slate-400">Gap:</span>
                                        <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                                            {participant.gap}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {/* Detail Profile Button - Always visible */}
                            <Button
                                variant="outline"
                                className={`w-full h-12 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 ${(!isFinished || !certificateEnabled) ? 'col-span-2' : ''}`}
                                onClick={() => setShowFullscreen(true)}
                            >
                                <Maximize2 className="mr-2 h-4 w-4" />
                                Detail Profile
                            </Button>

                            {/* Certificate Button */}
                            {isFinished && certificateEnabled && (
                                <Button asChild className="w-full h-12 bg-[#100d67] text-white hover:bg-[#100d67]/90 dark:bg-indigo-600 dark:hover:bg-indigo-700">
                                    <a
                                        href={`/${eventSlug}/categories/${categorySlug}/certificate/${participant.bib}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download className="mr-2 h-5 w-5" />
                                        Certificate
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Fullscreen Detail Modal */}
            <Dialog open={showFullscreen} onOpenChange={(o) => !o && setShowFullscreen(false)}>
                <DialogContent className="fixed inset-0 w-screen h-screen max-w-none sm:max-w-none max-h-none translate-x-0 translate-y-0 top-0 left-0 rounded-none overflow-y-auto p-0 gap-0 dark:bg-slate-950 dark:border-none bg-slate-50">
                    <div className="flex flex-col min-h-screen">
                        {/* Header Toolbar (Sticky) */}
                        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 shadow-sm">
                            <Button variant="ghost" size="sm" onClick={() => setShowFullscreen(false)} className="-ml-2 gap-2 text-slate-600 dark:text-slate-300">
                                <ChevronLeft className="h-5 w-5" />
                                Back to Results
                            </Button>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span className="font-mono text-[#100d67] dark:text-indigo-400">#{participant.bib}</span>
                                <span className="uppercase">{participant.name}</span>
                            </div>
                        </div>

                        <div className="flex-1 p-4 lg:p-6 lg:grid lg:grid-cols-12 lg:gap-8 max-w-7xl mx-auto w-full">
                            {/* Left Panel: Profile & Live Stats (4 Columns on Desktop) */}
                            <div className="lg:col-span-4 space-y-6 flex flex-col">

                                {/* Identity Card */}
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shrink-0">
                                    <div className="flex items-start gap-4">
                                        {/* BIB - Left Side (Consistent with ParticipantCard) */}
                                        <div className="relative inline-flex h-14 w-16 items-center justify-center border border-[#100d67] dark:border-slate-600 bg-white dark:bg-slate-950 px-3 font-mono text-2xl font-extrabold text-[#100d67] dark:text-slate-100 shadow-[inset_0_0_0_1px_rgba(16,13,103,0.06)] ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                                            <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                            <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                            <span className="absolute left-1 bottom-1 h-1 w-1 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                            <span className="absolute right-1 bottom-1 h-1 w-1 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                            {participant.bib}
                                        </div>

                                        {/* Name & Club */}
                                        <div className="min-w-0 flex-1 pt-0.5">
                                            <div className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                                                {participant.name}
                                                {flagCode && (
                                                    <span
                                                        className={`fi fi-${flagCode} ml-2 align-middle text-lg`}
                                                        title={participant.nation}
                                                        aria-label={participant.nation}
                                                    />
                                                )}
                                            </div>
                                            {participant.club && (
                                                <div className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                    {participant.club}
                                                </div>
                                            )}
                                            <div className="mt-3 flex items-center gap-3">
                                                <StatusBadge status={displayStatus} />
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                                                    {normalizeGender(participant.gender)?.toUpperCase() || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* LIVE STATS RECAP (Grid) */}
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

                                {/* Splits Timeline (Fills remaining height) */}
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

                                                {participant.checkpoints.map((cp, idx) => {
                                                    const isPassed = !!cp.time;
                                                    const isLastPassed = idx === lastReachedCheckpointIndex;
                                                    return (
                                                        <div key={idx} className={`relative pb-8 last:pb-0 ${!isPassed ? 'opacity-60 grayscale' : ''}`}>
                                                            {/* Dot Indicator */}
                                                            <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 z-10 transition-all duration-300 ${isPassed
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
                                                                            <span className="text-[9px] uppercase text-slate-400">Rank</span>
                                                                            <span className="font-mono font-bold">{cp.overallRank || '-'}</span>
                                                                        </div>
                                                                        <div className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                                                                            <span className="text-[9px] uppercase text-indigo-400/80">Gen</span>
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
                            </div>

                            {/* Right Panel: Charts (8 Columns on Desktop) */}
                            <div className="lg:col-span-8 mt-6 lg:mt-0 space-y-6">
                                <div className="sticky top-20 space-y-6">

                                    {/* Segment Pace Chart */}
                                    <SegmentPaceChart
                                        checkpoints={participant.checkpoints}
                                        waypoints={elevationWaypoints || []}
                                    />

                                    {/* Elevation Chart Card */}
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[400px]">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                            <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                Elevation Profile
                                            </h3>
                                            <div className="text-[10px] uppercase font-bold text-slate-400">
                                                {Math.round(totalElevationGain)}m Gain
                                            </div>
                                        </div>
                                        <div className="flex-1 min-h-0 relative">
                                            {elevationData && elevationData.length > 0 ? (
                                                <div className="absolute inset-0">
                                                    <ElevationChart data={elevationData} waypoints={elevationWaypoints || []} />
                                                </div>
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                                                    No elevation data available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
