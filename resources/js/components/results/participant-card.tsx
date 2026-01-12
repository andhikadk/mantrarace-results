import { cn } from '@/lib/utils';

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

const FLAG_MAP: Record<string, string> = {
    'INA': '🇮🇩',
    'IDN': '🇮🇩',
    'ID': '🇮🇩',
    'INDONESIA': '🇮🇩',
    'SGP': '🇸🇬',
    'SG': '🇸🇬',
    'SINGAPORE': '🇸🇬',
    'MYS': '🇲🇾',
    'MY': '🇲🇾',
    'MALAYSIA': '🇲🇾',
    'JPN': '🇯🇵',
    'JP': '🇯🇵',
    'JAPAN': '🇯🇵',
    'AUS': '🇦🇺',
    'AU': '🇦🇺',
    'AUSTRALIA': '🇦🇺',
    'USA': '🇺🇸',
    'US': '🇺🇸',
    'GBR': '🇬🇧',
    'UK': '🇬🇧',
    'NLD': '🇳🇱',
    'NL': '🇳🇱',
    'FRA': '🇫🇷',
    'FR': '🇫🇷',
    'DEU': '🇩🇪',
    'DE': '🇩🇪',
    'CHN': '🇨🇳',
    'CN': '🇨🇳',
    'KOR': '🇰🇷',
    'KR': '🇰🇷',
    'THA': '🇹🇭',
    'TH': '🇹🇭',
    'PHL': '🇵🇭',
    'PH': '🇵🇭',
    'VNM': '🇻🇳',
    'VN': '🇻🇳',
};

function getFlag(nation: string): string {
    const key = nation?.toUpperCase()?.trim();
    return FLAG_MAP[key] || '🏳️';
}

function getGenderIcon(gender: string): string {
    const g = gender?.toUpperCase()?.charAt(0);
    if (g === 'M') return '♂';
    if (g === 'F' || g === 'W') return '♀';
    return '';
}

function getStatusBadge(status: string) {
    const s = status?.toUpperCase();
    if (s === 'DNF') {
        return <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">DNF</span>;
    }
    if (s === 'DNS') {
        return <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">DNS</span>;
    }
    return null;
}

export function ParticipantCard({ participant, onClick }: Props) {
    const isFinished = participant.status?.toUpperCase() === 'FINISHED' ||
        (participant.finishTime && !['DNF', 'DNS'].includes(participant.status?.toUpperCase()));

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left rounded-lg border bg-white p-3 sm:p-4 transition-all hover:shadow-md hover:border-slate-300',
                participant.overallRank <= 3 && 'border-l-4',
                participant.overallRank === 1 && 'border-l-amber-400',
                participant.overallRank === 2 && 'border-l-slate-400',
                participant.overallRank === 3 && 'border-l-orange-400',
            )}
        >
            <div className="flex items-start gap-3">
                <div className="flex gap-2">
                    <div className="text-center min-w-[50px]">
                        <div className="text-[10px] uppercase text-slate-400 font-medium">Overall</div>
                        <div className="text-lg font-bold text-slate-900">#{participant.overallRank}</div>
                    </div>
                    <div className="text-center min-w-[50px]">
                        <div className="text-[10px] uppercase text-slate-400 font-medium">
                            {getGenderIcon(participant.gender)} Rank
                        </div>
                        <div className="text-lg font-bold text-slate-900">#{participant.genderRank}</div>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                            {participant.name}
                        </span>
                        <span className="text-base" title={participant.nation}>
                            {getFlag(participant.nation)}
                        </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            BIB {participant.bib}
                        </span>
                        {participant.club && (
                            <span className="truncate max-w-[120px]" title={participant.club}>
                                {participant.club}
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-right shrink-0">
                    {isFinished ? (
                        <>
                            <div className="font-mono text-base sm:text-lg font-bold text-slate-900">
                                {participant.finishTime}
                            </div>
                            {participant.gap && (
                                <div className="text-xs text-slate-500">
                                    +{participant.gap}
                                </div>
                            )}
                        </>
                    ) : (
                        getStatusBadge(participant.status)
                    )}
                </div>
            </div>
        </button>
    );
}
