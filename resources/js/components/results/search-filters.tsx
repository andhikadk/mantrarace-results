import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useCallback } from 'react';

interface Props {
    query: string;
    genderFilter: string;
    onSearch: (query: string) => void;
    onGenderFilter: (gender: string) => void;
}

type GenderTab = 'OVERALL' | 'MALE' | 'FEMALE';

export function SearchFilters({
    query,
    genderFilter,
    onSearch,
    onGenderFilter,
}: Props) {
    const handleGenderChange = useCallback((tab: GenderTab) => {
        if (tab === 'OVERALL') {
            onGenderFilter('all');
        } else if (tab === 'MALE') {
            onGenderFilter('M');
        } else if (tab === 'FEMALE') {
            onGenderFilter('F');
        }
    }, [onGenderFilter]);

    const activeGenderTab: GenderTab = genderFilter === 'M'
        ? 'MALE'
        : genderFilter === 'F'
            ? 'FEMALE'
            : 'OVERALL';

    return (
        <div className="bg-slate-50 sticky top-[53px] z-10">
            <div className="mx-auto max-w-6xl px-4 py-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                {/* Search Bar */}
                <div className="relative md:flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search athlete or bib..."
                        value={query}
                        onChange={(e) => onSearch(e.target.value)}
                        className="h-12 w-full rounded-md border border-slate-200 bg-white pl-11 shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300"
                    />
                </div>

                <div className="flex rounded-md border border-slate-200 bg-white p-1 shadow-none md:min-w-[260px]">
                    {(['OVERALL', 'MALE', 'FEMALE'] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => handleGenderChange(tab)}
                            className={cn(
                                'flex-1 rounded-sm py-2 text-xs font-bold transition-colors',
                                activeGenderTab === tab
                                    ? 'bg-[#1a2744] text-white'
                                    : 'text-slate-500 hover:bg-slate-100'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
}
