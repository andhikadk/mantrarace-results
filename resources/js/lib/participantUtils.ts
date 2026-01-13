/**
 * Shared utilities for participant display components
 */

const ALPHA3_TO_ALPHA2: Record<string, string> = {
    INA: 'id',
    IDN: 'id',
    SGP: 'sg',
    MYS: 'my',
    JPN: 'jp',
    AUS: 'au',
    USA: 'us',
    GBR: 'gb',
    NLD: 'nl',
    FRA: 'fr',
    DEU: 'de',
    CHN: 'cn',
    KOR: 'kr',
    THA: 'th',
    PHL: 'ph',
    VNM: 'vn',
};

const NAME_TO_ALPHA2: Record<string, string> = {
    INDONESIA: 'id',
    SINGAPORE: 'sg',
    MALAYSIA: 'my',
    JAPAN: 'jp',
    AUSTRALIA: 'au',
    'UNITED STATES': 'us',
    'UNITED STATES OF AMERICA': 'us',
    'UNITED KINGDOM': 'gb',
    ENGLAND: 'gb',
    NETHERLANDS: 'nl',
    FRANCE: 'fr',
    GERMANY: 'de',
    CHINA: 'cn',
    'SOUTH KOREA': 'kr',
    KOREA: 'kr',
    THAILAND: 'th',
    PHILIPPINES: 'ph',
    VIETNAM: 'vn',
};

export function getFlagCode(nation: string): string | null {
    const raw = (nation ?? '').trim();
    if (!raw) return null;

    const upper = raw.toUpperCase();

    if (upper.length === 2) {
        if (upper === 'UK') return 'gb';
        return upper.toLowerCase();
    }

    if (upper.length === 3 && ALPHA3_TO_ALPHA2[upper]) {
        return ALPHA3_TO_ALPHA2[upper];
    }

    if (NAME_TO_ALPHA2[upper]) {
        return NAME_TO_ALPHA2[upper];
    }

    return null;
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
