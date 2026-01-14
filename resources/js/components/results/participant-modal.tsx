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
import { ParticipantIdentityCard } from './participant-identity-card';
import { ParticipantLiveStats } from './participant-live-stats';
import { ParticipantTimeline } from './participant-timeline';

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
                        </div>

                        <div className="flex-1 p-4 lg:p-6 lg:grid lg:grid-cols-12 lg:gap-8 max-w-7xl mx-auto w-full">
                            {/* Left Panel: Profile & Live Stats (4 Columns on Desktop) */}
                            <div className="lg:col-span-4 space-y-6 flex flex-col">
                                <ParticipantIdentityCard participant={participant} />

                                <ParticipantLiveStats
                                    participant={participant}
                                    isFinished={isFinished}
                                    lastReachedCheckpoint={lastReachedCheckpoint}
                                    currentDistance={currentDistance}
                                    totalDistance={totalDistance}
                                    distanceProgress={distanceProgress}
                                    currentElevationGain={currentElevationGain}
                                    totalElevationGain={totalElevationGain}
                                    elevationProgress={elevationProgress}
                                />

                                <ParticipantTimeline
                                    checkpoints={participant.checkpoints}
                                    lastReachedCheckpointIndex={lastReachedCheckpointIndex}
                                />
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
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[250px]">
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
                                                    <ElevationChart
                                                        data={elevationData}
                                                        waypoints={elevationWaypoints || []}
                                                    />
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
