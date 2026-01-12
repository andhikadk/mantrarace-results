import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useCallback, useState } from 'react';

interface Props {
    onSearch: (query: string) => void;
    onGenderFilter: (gender: string) => void;
    onStatusFilter: (status: string) => void;
    resultCount: number;
}

export function SearchFilters({ onSearch, onGenderFilter, onStatusFilter, resultCount }: Props) {
    const [query, setQuery] = useState('');
    const [gender, setGender] = useState('all');
    const [status, setStatus] = useState('all');

    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        onSearch(value);
    }, [onSearch]);

    const handleGender = useCallback((value: string) => {
        setGender(value);
        onGenderFilter(value);
    }, [onGenderFilter]);

    const handleStatus = useCallback((value: string) => {
        setStatus(value);
        onStatusFilter(value);
    }, [onStatusFilter]);

    return (
        <div className="sticky top-[52px] z-10 border-b bg-white">
            <div className="mx-auto max-w-5xl px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search BIB or name..."
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={gender}
                            onChange={(e) => handleGender(e.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="all">All Gender</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>

                        <select
                            value={status}
                            onChange={(e) => handleStatus(e.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="finished">Finished</option>
                            <option value="dnf">DNF</option>
                            <option value="dns">DNS</option>
                        </select>
                    </div>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                    Showing {resultCount} results
                </div>
            </div>
        </div>
    );
}
