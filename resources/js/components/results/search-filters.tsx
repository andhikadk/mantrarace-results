import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Mars, Search, Users, Venus } from 'lucide-react';

interface Props {
    query: string;
    genderFilter: string;
    onSearch: (query: string) => void;
    onGenderFilter: (gender: string) => void;
}

export function SearchFilters({
    query,
    genderFilter,
    onSearch,
    onGenderFilter,
}: Props) {
    const activeValue = genderFilter === 'Male'
        ? 'MALE'
        : genderFilter === 'Female'
            ? 'FEMALE'
            : 'OVERALL';

    const handleValueChange = (value: string) => {
        if (value === 'OVERALL') onGenderFilter('all');
        if (value === 'MALE') onGenderFilter('Male');
        if (value === 'FEMALE') onGenderFilter('Female');
    };

    const getIcon = (value: string) => {
        switch (value) {
            case 'MALE': return <Mars className="h-4 w-4" />;
            case 'FEMALE': return <Venus className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    const getLabel = (value: string) => {
        switch (value) {
            case 'MALE': return 'Male';
            case 'FEMALE': return 'Female';
            default: return 'Overall';
        }
    };

    return (
        <div className="bg-[#efefef] dark:bg-slate-950 transition-all duration-200">
            <div className="mx-auto max-w-6xl px-4 py-4">
                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <Input
                            type="text"
                            placeholder="Search athlete or bib..."
                            value={query}
                            onChange={(e) => onSearch(e.target.value)}
                            className="h-12 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 shadow-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-[#100d67]/30 dark:focus-visible:ring-slate-600"
                        />
                    </div>

                    {/* Gender Filter Dropdown */}
                    <div className="shrink-0">
                        <Select value={activeValue} onValueChange={handleValueChange}>
                            <SelectTrigger className="h-12 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold uppercase focus:ring-[#100d67]/30 dark:focus:ring-slate-600 px-3 md:w-[140px]">
                                <div className="flex items-center gap-2 mr-2 md:mr-0">
                                    {getIcon(activeValue)}
                                    <span className="hidden md:inline truncate">{getLabel(activeValue)}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="OVERALL">
                                    <div className="flex items-center gap-2 font-bold uppercase text-slate-600 dark:text-slate-400">
                                        <Users className="h-4 w-4" />
                                        <span>Overall</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="MALE">
                                    <div className="flex items-center gap-2 font-bold uppercase text-slate-600 dark:text-slate-400">
                                        <Mars className="h-4 w-4" />
                                        <span>Male</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="FEMALE">
                                    <div className="flex items-center gap-2 font-bold uppercase text-slate-600 dark:text-slate-400">
                                        <Venus className="h-4 w-4" />
                                        <span>Female</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div >
    );
}
