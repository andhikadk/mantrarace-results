import { getDisplayStatus, getFlagCode, getStatusBadge } from '@/lib/participantUtils';
import { normalizeGender } from '@/lib/normalizeGender';
import { type Participant } from './participant-card';
import { Mars, Venus } from 'lucide-react';

interface Props {
    participant: Participant;
}

function StatusBadge({ status }: { status: string }) {
    const badge = getStatusBadge(status);
    return (
        <span className={`inline-flex rounded-full ${badge.bgClass} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.textClass}`}>
            {badge.label}
        </span>
    );
}

export function ParticipantIdentityCard({ participant }: Props) {
    const displayStatus = getDisplayStatus(participant.status);
    const flagCode = getFlagCode(participant.nation);
    const gender = normalizeGender(participant.gender);
    const GenderIcon = gender === 'Male' ? Mars : gender === 'Female' ? Venus : null;

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shrink-0">
            <div className="flex items-start gap-4">
                {/* BIB - Left Side */}
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
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                            {GenderIcon && <GenderIcon className="h-3.5 w-3.5" />}
                            {gender?.toUpperCase() || '-'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
