import { Button } from '@/components/ui/button';
import { getDisplayStatus, getFlagCode, getStatusBadge } from '@/lib/participantUtils';
import { normalizeGender } from '@/lib/normalizeGender';
import { type Participant } from './participant-card';
import { Download, Mars, Venus } from 'lucide-react';

interface Props {
    participant: Participant;
    eventSlug?: string;
    categorySlug?: string;
    certificateEnabled?: boolean;
    certificateAvailabilityDate?: string | null;
}

function StatusBadge({ status }: { status: string }) {
    const badge = getStatusBadge(status);
    return (
        <span className={`inline-flex rounded-full ${badge.bgClass} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.textClass}`}>
            {badge.label}
        </span>
    );
}

export function ParticipantIdentityCard({
    participant,
    eventSlug,
    categorySlug,
    certificateEnabled,
    certificateAvailabilityDate
}: Props) {
    const displayStatus = getDisplayStatus(participant.status);
    const flagCode = getFlagCode(participant.nation);
    const gender = normalizeGender(participant.gender);
    const GenderIcon = gender === 'Male' ? Mars : gender === 'Female' ? Venus : null;

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
                {/* BIB - Smaller like summary modal */}
                <span className="relative inline-flex h-8 min-w-[56px] items-center justify-center border border-[#100d67] dark:border-slate-600 bg-white dark:bg-slate-950 px-3 font-mono font-extrabold text-[#100d67] dark:text-slate-100 shadow-[inset_0_0_0_1px_rgba(16,13,103,0.06)] ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                    <span className="absolute left-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                    <span className="absolute right-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                    <span className="absolute left-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                    <span className="absolute right-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                    {participant.bib}
                </span>

                {/* Name & Club */}
                <div className="min-w-0 flex-1">
                    <div className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                        {participant.name}
                        {flagCode && (
                            <span
                                className={`fi fi-${flagCode} ml-2 align-middle`}
                                title={participant.nation}
                                aria-label={participant.nation}
                            />
                        )}
                    </div>
                    {participant.club && (
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">
                            {participant.club}
                        </div>
                    )}
                </div>
            </div>

            {/* Status & Gender - Same row */}
            <div className="mt-3 flex items-center gap-3">
                <StatusBadge status={displayStatus} />
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                    {GenderIcon && <GenderIcon className="h-3.5 w-3.5" />}
                    {gender?.toUpperCase() || '-'}
                </div>
            </div>

            {/* Certificate Button */}
            {displayStatus === 'FINISHED' && certificateEnabled && certificateAvailabilityDate && new Date() >= new Date(certificateAvailabilityDate) && eventSlug && categorySlug && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button asChild className="w-full h-11 bg-[#100d67] text-white hover:bg-[#100d67]/90 dark:bg-indigo-600 dark:hover:bg-indigo-700">
                        <a
                            href={`/${eventSlug}/categories/${categorySlug}/certificate/${participant.bib}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Download className="mr-2 h-5 w-5" />
                            Download Certificate
                        </a>
                    </Button>
                </div>
            )}
        </div>
    );
}
