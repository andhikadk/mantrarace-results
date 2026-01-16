import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { getDisplayStatus } from '@/lib/participantUtils';
import { ChevronLeft } from 'lucide-react';
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
    certificateAvailabilityDate?: string | null;
    elevationData?: ElevationPoint[];
    elevationWaypoints?: ElevationWaypoint[];
    categoryTotalDistance?: number | null;
    categoryTotalElevationGain?: number | null;
}

export function ParticipantModal({ participant, open, onClose, eventSlug, categorySlug, certificateEnabled, certificateAvailabilityDate, elevationData, elevationWaypoints, categoryTotalDistance, categoryTotalElevationGain }: Props) {
    if (!participant) return null;

    const displayStatus = getDisplayStatus(participant.status);
    const isFinished = displayStatus === 'FINISHED';

    // --- LIVE STATS CALCULATION (Checkpoint Data First, GPX Fallback) ---
    // 1. Find the last checkpoint with a time (means participant reached it)
    let lastReachedCheckpointIndex = -1;
    participant.checkpoints.forEach((cp, idx) => {
        if (cp.time) lastReachedCheckpointIndex = idx;
    });

    const lastReachedCheckpoint = lastReachedCheckpointIndex >= 0
        ? participant.checkpoints[lastReachedCheckpointIndex]
        : null;

    // 2. Get Distance - prioritize checkpoint data, fallback to GPX waypoints
    let currentDistance = 0;
    let currentElevationGain = 0;

    if (lastReachedCheckpoint) {
        // Use checkpoint data if available
        if (lastReachedCheckpoint.distance !== null) {
            currentDistance = lastReachedCheckpoint.distance;
        } else if (elevationWaypoints && elevationWaypoints.length > 0) {
            // Fallback: try GPX matching (name first, then index)
            const matchedWaypoint = elevationWaypoints.find(
                wp => wp.name.toLowerCase() === lastReachedCheckpoint.name.toLowerCase()
            );
            if (matchedWaypoint) {
                currentDistance = matchedWaypoint.distance;
            } else if (lastReachedCheckpointIndex < elevationWaypoints.length) {
                currentDistance = elevationWaypoints[lastReachedCheckpointIndex].distance;
            }
        }

        // Use checkpoint elevation data if available
        if (lastReachedCheckpoint.elevationGain !== null) {
            currentElevationGain = lastReachedCheckpoint.elevationGain;
        }
    }

    // 3. Calculate Total Stats - Priority: Category settings > last checkpoint > GPX
    let totalElevationGain = 0;
    let totalDistance = 0;

    // Priority 1: Use category totals if available
    if (categoryTotalDistance !== null && categoryTotalDistance !== undefined && categoryTotalDistance > 0) {
        totalDistance = categoryTotalDistance;
    } else {
        // Priority 2: Get from last checkpoint if it has data
        const lastCheckpoint = participant.checkpoints[participant.checkpoints.length - 1];
        if (lastCheckpoint?.distance !== null && lastCheckpoint?.distance !== undefined) {
            totalDistance = lastCheckpoint.distance;
        } else if (elevationData && elevationData.length > 0) {
            // Priority 3: Fallback to GPX
            totalDistance = elevationData[elevationData.length - 1].distance;
        }
    }

    if (categoryTotalElevationGain !== null && categoryTotalElevationGain !== undefined && categoryTotalElevationGain > 0) {
        totalElevationGain = categoryTotalElevationGain;
    } else {
        const lastCheckpoint = participant.checkpoints[participant.checkpoints.length - 1];
        if (lastCheckpoint?.elevationGain !== null && lastCheckpoint?.elevationGain !== undefined) {
            totalElevationGain = lastCheckpoint.elevationGain;
        } else if (elevationData && elevationData.length > 0) {
            // Calculate total elevation gain from GPX
            for (let i = 1; i < elevationData.length; i++) {
                const diff = elevationData[i].elevation - elevationData[i - 1].elevation;
                if (diff > 0) totalElevationGain += diff;
            }
        }
    }

    // Calculate current elevation gain from GPX if not set by checkpoint
    if (currentElevationGain === 0 && currentDistance > 0 && elevationData && elevationData.length > 0) {
        for (let i = 1; i < elevationData.length; i++) {
            const point = elevationData[i];
            const prevPoint = elevationData[i - 1];
            const diff = point.elevation - prevPoint.elevation;
            if (diff > 0 && point.distance <= currentDistance) {
                currentElevationGain += diff;
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
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="fixed inset-0 w-screen h-screen max-w-none sm:max-w-none max-h-none translate-x-0 translate-y-0 top-0 left-0 rounded-none overflow-y-auto p-0 gap-0 dark:bg-slate-950 dark:border-none bg-slate-50">
                <div className="flex flex-col min-h-screen">
                    {/* Header Toolbar (Sticky) */}
                    <div className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                        <div className="max-w-7xl mx-auto px-4 py-3">
                            <Button variant="ghost" size="sm" onClick={onClose} className="-ml-2 gap-2 text-slate-600 dark:text-slate-300">
                                <ChevronLeft className="h-5 w-5" />
                                Back to Results
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 p-4 lg:p-6 lg:grid lg:grid-cols-12 lg:gap-8 max-w-7xl mx-auto w-full">
                        {/* Left Panel: Profile & Live Stats (4 Columns on Desktop) */}
                        <div className="lg:col-span-4 space-y-6 flex flex-col">
                            <ParticipantIdentityCard
                                participant={participant}
                                eventSlug={eventSlug}
                                categorySlug={categorySlug}
                                certificateEnabled={certificateEnabled}
                                certificateAvailabilityDate={certificateAvailabilityDate}
                            />

                            <ParticipantLiveStats
                                participant={participant}
                                isFinished={isFinished}
                                displayStatus={displayStatus}
                                lastReachedCheckpoint={lastReachedCheckpoint}
                                currentDistance={currentDistance}
                                totalDistance={totalDistance}
                                distanceProgress={distanceProgress}
                                currentElevationGain={currentElevationGain}
                                totalElevationGain={totalElevationGain}
                                elevationProgress={elevationProgress}
                                finishTime={participant.finishTime}
                                netTime={participant.netTime}
                                gap={participant.gap}
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
    );
}
