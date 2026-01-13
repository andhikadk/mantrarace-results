import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getDisplayStatus, getFlagCode, getStatusBadge } from '@/lib/participantUtils';
import { normalizeGender } from '@/lib/normalizeGender';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
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
    const [splitsOpen, setSplitsOpen] = useState(false);

    if (!participant) return null;

    const displayStatus = getDisplayStatus(participant.status, participant.finishTime);
    const statusBadge = getStatusBadge(displayStatus);
    const isFinished = displayStatus === 'FINISHED';
    const flagCode = getFlagCode(participant.nation);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-md p-0 gap-0 dark:bg-slate-950 dark:border-slate-800">
                {/* Header Section */}
                <DialogHeader className="p-5 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        {/* Flag */}
                        <span className="flex h-8 w-10 items-center justify-center overflow-hidden rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xl shrink-0">
                            {flagCode ? (
                                <span
                                    className={`fi fi-${flagCode} h-5 w-7`}
                                    title={participant.nation}
                                    aria-label={participant.nation}
                                />
                            ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">--</span>
                            )}
                        </span>

                        <div className="flex-1 min-w-0">
                            {/* Name */}
                            <DialogTitle className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                                {participant.name}
                            </DialogTitle>

                            {/* BIB Badge */}
                            <div className="mt-2 inline-flex items-center">
                                <span className="relative inline-flex h-8 min-w-[56px] items-center justify-center border border-[#100d67] dark:border-slate-600 bg-white dark:bg-slate-950 px-3 font-mono text-sm font-extrabold text-[#100d67] dark:text-slate-100 shadow-[inset_0_0_0_1px_rgba(16,13,103,0.06)] ring-1 ring-slate-200 dark:ring-slate-700">
                                    <span className="absolute left-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute right-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute left-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute right-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    {participant.bib}
                                </span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`inline-flex rounded-full ${statusBadge.bgClass} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadge.textClass} shrink-0`}>
                            {statusBadge.label}
                        </span>
                    </div>
                </DialogHeader>

                <div className="p-5 space-y-5">
                    {/* Rank Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4 text-center">
                            <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">OVERALL RANK</div>
                            <div className="font-mono text-3xl font-bold italic text-[#f00102] dark:text-red-400">
                                {participant.overallRank > 0 ? participant.overallRank.toString().padStart(2, '0') : '-'}
                            </div>
                        </div>
                        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4 text-center">
                            <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">GENDER RANK</div>
                            <div className="font-mono text-3xl font-bold italic text-[#f00102] dark:text-red-400">
                                {participant.genderRank > 0 ? participant.genderRank.toString().padStart(2, '0') : '-'}
                            </div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                {normalizeGender(participant.gender)?.toUpperCase() || participant.gender?.toUpperCase() || '-'}
                            </div>
                        </div>
                    </div>

                    {/* Time Section */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">FINISH TIME</div>
                            <div className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                                {participant.finishTime || '--:--:--'}
                            </div>
                        </div>
                        {participant.netTime && (
                            <div>
                                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">NET TIME</div>
                                <div className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {participant.netTime}
                                </div>
                            </div>
                        )}
                        {participant.gap && (
                            <div>
                                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">GAP</div>
                                <div className="font-mono text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {participant.gap}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Checkpoint Splits */}
                    {participant.checkpoints.length > 0 && (
                        <div>
                            <button
                                type="button"
                                onClick={() => setSplitsOpen((prev) => !prev)}
                                className="flex w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                aria-expanded={splitsOpen}
                            >
                                <span>Checkpoint Splits ({participant.checkpoints.length})</span>
                                {splitsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {splitsOpen && (
                                <div className="mt-3 space-y-2">
                                    {participant.checkpoints.map((cp, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{cp.name}</div>
                                                {cp.segment && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                        Segment: <span className="font-mono">{cp.segment}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {cp.time || '-'}
                                                </div>
                                                <div className="flex gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 justify-end">
                                                    {cp.overallRank && <span>#{cp.overallRank}</span>}
                                                    {cp.genderRank && <span>GR #{cp.genderRank}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Certificate Button */}
                    {isFinished && certificateEnabled && (
                        <div className="pt-2">
                            <Button asChild className="w-full bg-[#100d67] text-white hover:bg-[#100d67]/90 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                                <a
                                    href={`/${eventSlug}/categories/${categorySlug}/certificate/${participant.bib}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Certificate
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog >
    );
}
