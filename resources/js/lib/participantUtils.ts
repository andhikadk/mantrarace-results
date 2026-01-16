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
    const raw = (status || '').toUpperCase();

    // Normalize Corrupted Strings
    let s = raw;
    if (raw.includes('_')) {
        if (raw.startsWith('FIN')) s = 'FINISHED';
        else if (raw.startsWith('YET')) s = 'YET TO START';
        else if (raw.startsWith('DNF')) s = 'DNF';
        else if (raw.startsWith('DNS')) s = 'DNS';
    }

    // Treat 'Withdrawn - DNS/DNF' as DNF
    if (raw.includes('WITHDRAWN')) s = 'DNF';

    if (s === 'FINISHED') {
        return {
            label: 'FINISHED',
            bgClass: 'bg-green-100 dark:bg-green-900/30',
            textClass: 'text-green-700 dark:text-green-300',
        };
    }
    if (s === 'DNF') {
        return {
            label: 'DNF',
            bgClass: 'bg-red-100 dark:bg-red-900/30',
            textClass: 'text-red-700 dark:text-red-300',
        };
    }
    if (s === 'DNS') {
        return {
            label: 'DNS',
            bgClass: 'bg-slate-100 dark:bg-slate-800',
            textClass: 'text-slate-600 dark:text-slate-300',
        };
    }
    if (s === 'YET TO START') {
        return {
            label: 'YET TO START',
            bgClass: 'bg-slate-100 dark:bg-slate-800',
            textClass: 'text-slate-500 dark:text-slate-400',
        };
    }

    // Default / On Race (Started, CP Names, etc)
    // If status is present, show it (e.g., "POS 1", "STARTED"). If empty, fallback to "ON RACE"
    const label = status ? status.toUpperCase() : 'ON RACE';

    return {
        label: label,
        bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
        textClass: 'text-yellow-700 dark:text-yellow-300',
    };
}

export function getDisplayStatus(status: string): string {
    const raw = (status || '').toUpperCase();

    // Normalize Corrupted Strings
    let s = raw;
    if (raw.includes('_')) {
        if (raw.startsWith('FIN')) s = 'FINISHED';
        else if (raw.startsWith('YET')) s = 'YET TO START';
        else if (raw.startsWith('DNF')) s = 'DNF';
        else if (raw.startsWith('DNS')) s = 'DNS';
    }

    // Treat 'Withdrawn - DNS/DNF' as DNF
    if (raw.includes('WITHDRAWN')) s = 'DNF';

    if (s === 'DNF') return 'DNF';
    if (s === 'DNS') return 'DNS';
    if (s === 'FINISHED') return 'FINISHED';
    if (s === 'YET TO START') return 'YET TO START';

    // Any other status (e.g., checkpoint names like "CP1", "STARTED", etc.) means participant is on race
    return 'ON RACE';
}
