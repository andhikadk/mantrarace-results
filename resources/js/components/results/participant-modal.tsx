import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getDisplayStatus, getFlagCode, getStatusBadge } from '@/lib/participantUtils';
import { normalizeGender } from '@/lib/normalizeGender';
import { Download, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { type Participant } from './participant-card';

interface Props {
    participant: Participant | null;
    open: boolean;
    onClose: () => void;
    eventSlug: string;
    categorySlug: string;
    certificateEnabled?: boolean;
}

export function ParticipantModal({ participant, open, onClose, eventSlug, categorySlug, certificateEnabled }: Props) {
    const [showFullscreen, setShowFullscreen] = useState(false);

    if (!participant) return null;

    const displayStatus = getDisplayStatus(participant.status, participant.finishTime);
    const statusBadge = getStatusBadge(displayStatus);
    const isFinished = displayStatus === 'FINISHED';
    const flagCode = getFlagCode(participant.nation);
    const hasCheckpoints = participant.checkpoints.length > 0;

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
                        <div className="grid grid-cols-3 gap-3">
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
                            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 text-center">
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
                        <div className="flex flex-col gap-2 pt-2">
                            {/* Detail Profile Button */}
                            {hasCheckpoints && (
                                <Button
                                    variant="outline"
                                    className="w-full h-10"
                                    onClick={() => setShowFullscreen(true)}
                                >
                                    <Maximize2 className="mr-2 h-4 w-4" />
                                    Detail Profile
                                </Button>
                            )}

                            {/* Certificate Button */}
                            {isFinished && certificateEnabled && (
                                <Button asChild className="w-full h-12 bg-[#100d67] text-white hover:bg-[#100d67]/90 dark:bg-indigo-600 dark:hover:bg-indigo-700">
                                    <a
                                        href={`/${eventSlug}/categories/${categorySlug}/certificate/${participant.bib}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download className="mr-2 h-5 w-5" />
                                        Download Certificate
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Fullscreen Detail Modal */}
            <Dialog open={showFullscreen} onOpenChange={(o) => !o && setShowFullscreen(false)}>
                <DialogContent className="fixed inset-0 w-screen h-screen max-w-none sm:max-w-none max-h-none translate-x-0 translate-y-0 top-0 left-0 rounded-none overflow-y-auto p-0 gap-0 dark:bg-slate-950 dark:border-none">
                    {/* TODO: Isi fullscreen modal di sini */}
                </DialogContent>
            </Dialog>
        </>
    );
}
