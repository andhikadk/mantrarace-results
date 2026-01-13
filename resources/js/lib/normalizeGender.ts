/**
 * Normalize gender string dengan exact matching dan fallback by character count.
 * Priority:
 * 1. Exact match "Male" / "Female" (case insensitive)
 * 2. Fallback: 4 chars = "Male", 6 chars = "Female"
 * 3. Return null jika tidak bisa ditentukan
 */
export function normalizeGender(raw: string | null | undefined): 'Male' | 'Female' | null {
    if (!raw) return null;

    const trimmed = raw.trim();
    const upper = trimmed.toUpperCase();

    // Exact matching
    if (upper === 'MALE') return 'Male';
    if (upper === 'FEMALE') return 'Female';

    // Fallback by character count
    if (trimmed.length === 4) return 'Male';
    if (trimmed.length === 6) return 'Female';

    return null;
}
