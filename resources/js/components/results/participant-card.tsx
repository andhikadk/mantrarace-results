import { getDisplayStatus, getFlagCode, getStatusBadge } from '@/lib/participantUtils';
import { normalizeGender } from '@/lib/normalizeGender';

export interface Participant {
    overallRank: number;
    genderRank: number;
    bib: string;
    name: string;
    gender: string;
    nation: string;
    club: string;
    finishTime: string | null;
    netTime: string | null;
    gap: string | null;
    status: string;
    checkpoints: CheckpointSplit[];
}

export interface CheckpointSplit {
    name: string;
    time: string | null;
    segment: string | null;
    overallRank: number | null;
    genderRank: number | null;
}

interface Props {
    participant: Participant;
    onClick: () => void;
}

function StatusBadge({ status }: { status: string }) {
    const badge = getStatusBadge(status);
    return (
        <span className={`inline-flex rounded-full ${badge.bgClass} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.textClass}`}>
            {badge.label}
        </span>
    );
}

export function ParticipantCard({ participant, onClick }: Props) {
    const displayStatus = getDisplayStatus(participant.status, participant.finishTime);
    const flagCode = getFlagCode(participant.nation);

    return (
        <div className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none md:rounded-none md:border-x-0 md:border-t-0 md:px-4 hover:bg-[#efefef] dark:hover:bg-slate-800">
            <button
                type="button"
                onClick={onClick}
                className="w-full p-5 text-left md:flex-1 md:px-0 md:py-4 cursor-pointer"
            >
                {/* Mobile Card */}
                <div className="md:hidden">
                    <div className="flex gap-4">
                        {/* LEFT: RANK */}
                        <div className="flex shrink-0 flex-col items-center justify-center">
                            <span className="font-mono text-3xl font-bold italic leading-none text-[#f00102] dark:text-red-400">
                                {participant.overallRank > 0
                                    ? participant.overallRank.toString().padStart(2, '0')
                                    : '-'}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                                RANK
                            </span>
                        </div>

                        {/* RIGHT: ITEM LAINNYA (2 rows) */}
                        <div className="min-w-0 flex-1">
                            {/* ROW 1: BIB + Name/Flag + Club */}
                            <div className="flex items-start gap-3">
                                {/* BIB */}
                                <span className="relative inline-flex h-8 min-w-[56px] items-center justify-center border border-[#100d67] dark:border-slate-600 bg-white dark:bg-slate-950 px-3 font-mono font-extrabold text-[#100d67] dark:text-slate-100 shadow-[inset_0_0_0_1px_rgba(16,13,103,0.06)] ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                                    <span className="absolute left-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute right-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute left-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute right-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    {participant.bib}
                                </span>

                                {/* Name + Flag + Club */}
                                <div className="min-w-0 flex-1">
                                    <div className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 leading-tight wrap-break-word">
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
                                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400 wrap-break-word">
                                            {participant.club}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ROW 2: SISANYA - 1 ROW */}
                            <div className="mt-3 flex items-center justify-between gap-4">
                                {/* GENDER */}
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-0.5">
                                        GENDER
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        {normalizeGender(participant.gender)?.toUpperCase() ||
                                            participant.gender?.toUpperCase() ||
                                            '-'}
                                    </div>
                                </div>

                                {/* TIME */}
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-0.5">
                                        TIME
                                    </div>
                                    <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                                        {participant.finishTime || '--:--:--'}
                                    </div>
                                </div>

                                {/* STATUS */}
                                <div className="text-center">
                                    <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-0.5">
                                        STATUS
                                    </div>
                                    <StatusBadge status={displayStatus} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Row */}
                <div className="hidden md:flex md:items-center md:gap-4">
                    <div className="w-14 text-center">
                        <div className="font-mono text-xl font-bold italic text-[#f00102] dark:text-red-400">
                            {participant.overallRank > 0 ? participant.overallRank.toString().padStart(2, '0') : '-'}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">RANK</div>
                    </div>
                    {/* <div className="w-14 text-center">
                        <div className="font-mono text-xl font-bold italic text-[#100d67]">
                            {participant.genderRank > 0 ? participant.genderRank.toString().padStart(2, '0') : '-'}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">GENDER RANK</div>
                    </div> */}

                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="relative inline-flex h-8 min-w-[56px] items-center justify-center border border-[#100d67] dark:border-slate-600 bg-white dark:bg-slate-950 px-3 font-mono font-extrabold text-[#100d67] dark:text-slate-100 shadow-[inset_0_0_0_1px_rgba(16,13,103,0.06)] ring-1 ring-slate-200 dark:ring-slate-700">
                                    <span className="absolute left-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute right-1 top-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute left-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    <span className="absolute right-1 bottom-1 h-0.5 w-0.5 rounded-full bg-[#100d67]/50 dark:bg-slate-400/70" />
                                    {participant.bib}
                                </span>
                                <div>
                                    <span className="truncate text-sm font-bold uppercase text-slate-900 dark:text-slate-100">
                                        {participant.name}
                                        {flagCode && (
                                            <span
                                                className={`fi fi-${flagCode} ml-1 h-3 w-4`}
                                                title={participant.nation}
                                                aria-label={participant.nation}
                                            />
                                        )}
                                    </span>
                                    {participant.club && (
                                        <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                            {participant.club}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-20 text-right">
                        <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">GENDER</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {normalizeGender(participant.gender)?.toUpperCase() || participant.gender?.toUpperCase() || '-'}
                        </div>
                    </div>

                    <div className="w-28 text-right">
                        <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">FINISH TIME</div>
                        <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {participant.finishTime || '--:--:--'}
                        </div>
                    </div>

                    <div className="w-20 text-right">
                        <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">GAP</div>
                        <div className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                            {participant.gap || '-'}
                        </div>
                    </div>

                    <div className="w-24 text-right">
                        <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">STATUS</div>
                        <StatusBadge status={displayStatus} />
                    </div>
                </div>
            </button>
        </div>
    );
}
