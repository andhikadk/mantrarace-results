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

function getStatusBadge(status: string) {
    const s = status?.toUpperCase();
    if (s === 'FINISHED') {
        return <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">FINISHED</span>;
    }
    if (s === 'DNF') {
        return <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">DNF</span>;
    }
    if (s === 'DNS') {
        return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">DNS</span>;
    }
    // Default / On Race
    return <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-700">ON RACE</span>;
}

export function ParticipantCard({ participant, onClick }: Props) {
    // Determine explicit status for badge logic
    const status = participant.status?.toUpperCase() || '';
    let displayStatus = status;
    if (!displayStatus) {
        displayStatus = participant.finishTime ? 'FINISHED' : 'ON RACE';
    }

    if (status === 'DNF') displayStatus = 'DNF';
    if (status === 'DNS') displayStatus = 'DNS';

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full rounded-md border border-slate-200 bg-white p-5 text-left shadow-none transition-colors hover:border-slate-300 md:rounded-none md:border-x-0 md:border-t-0 md:px-0 md:py-4"
        >
            {/* Mobile Card */}
            <div className="md:hidden">
                <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-6 w-8 items-center justify-center overflow-hidden rounded-sm border border-slate-200 bg-slate-50 text-lg">
                        {getFlag(participant.nation)}
                    </span>
                    <span className="text-base font-bold uppercase tracking-tight text-slate-900">
                        {participant.name}
                    </span>
                </div>

                <div className="grid grid-cols-[auto_1fr_auto] gap-x-8 gap-y-4">
                    <div className="flex flex-col items-center">
                        <span className="font-mono text-3xl font-bold italic leading-none text-red-600">
                            {participant.overallRank > 0 ? participant.overallRank.toString().padStart(2, '0') : '-'}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-400">RANK</span>
                    </div>

                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">BIB</div>
                            <div className="text-xs font-bold text-slate-700">
                                {participant.bib}
                            </div>
                            <div className="mt-2 text-[10px] font-bold uppercase text-slate-400 mb-0.5">GENDER</div>
                            <div className="text-xs font-bold text-slate-700">
                                {participant.gender?.toUpperCase() || '-'}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                        <div>
                            <div className="mb-1 text-right text-[10px] font-bold uppercase text-slate-400">STATUS</div>
                            {getStatusBadge(displayStatus)}
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">TIME</div>
                            <div className="font-mono text-base font-bold text-slate-900">
                                {participant.finishTime || '--:--:--'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Row */}
            <div className="hidden md:flex md:items-center md:gap-6">
                <div className="w-14 text-center">
                    <div className="font-mono text-xl font-bold italic text-red-600">
                        {participant.overallRank > 0 ? participant.overallRank.toString().padStart(2, '0') : '-'}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">RANK</div>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-6 w-8 items-center justify-center overflow-hidden rounded-sm border border-slate-200 bg-slate-50 text-lg">
                        {getFlag(participant.nation)}
                    </span>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-bold uppercase text-slate-900">
                            {participant.name}
                        </div>
                    </div>
                </div>

                <div className="w-20 text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">BIB</div>
                    <div className="text-sm font-semibold text-slate-700">
                        {participant.bib}
                    </div>
                </div>

                <div className="w-20 text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">GENDER</div>
                    <div className="text-sm font-semibold text-slate-700">
                        {participant.gender?.toUpperCase() || '-'}
                    </div>
                </div>

                <div className="w-28 text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">TIME</div>
                    <div className="font-mono text-sm font-semibold text-slate-900">
                        {participant.finishTime || '--:--:--'}
                    </div>
                </div>

                <div className="w-20 text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">GAP</div>
                    <div className="font-mono text-xs font-medium text-slate-500">
                        {participant.gap || '-'}
                    </div>
                </div>

                <div className="w-24 text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">STATUS</div>
                    {getStatusBadge(displayStatus)}
                </div>
            </div>
        </button>
    );
}
