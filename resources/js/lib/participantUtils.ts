/**
 * Shared utilities for participant display components
 */

export const FLAG_MAP: Record<string, string> = {
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

export function getFlag(nation: string): string {
    const key = nation?.toUpperCase()?.trim();
    return FLAG_MAP[key] || '🏳️';
}

export function getStatusBadge(status: string) {
    const s = status?.toUpperCase();
    if (s === 'FINISHED') {
        return { label: 'FINISHED', bgClass: 'bg-green-100', textClass: 'text-green-700' };
    }
    if (s === 'DNF') {
        return { label: 'DNF', bgClass: 'bg-red-100', textClass: 'text-red-700' };
    }
    if (s === 'DNS') {
        return { label: 'DNS', bgClass: 'bg-slate-100', textClass: 'text-slate-600' };
    }
    // Default / On Race
    return { label: 'ON RACE', bgClass: 'bg-yellow-100', textClass: 'text-yellow-700' };
}

export function getDisplayStatus(status: string, finishTime: string | null): string {
    const s = status?.toUpperCase() || '';
    if (s === 'DNF') return 'DNF';
    if (s === 'DNS') return 'DNS';
    if (s === 'FINISHED') return 'FINISHED';
    if (s) return s;
    return finishTime ? 'FINISHED' : 'ON RACE';
}
