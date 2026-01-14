import { Button } from '@/components/ui/button';
import { CategoryTabs } from '@/components/results/category-tabs';
import { ElevationChart } from '@/components/results/elevation-chart';
import { EventHeader } from '@/components/results/event-header';
import { ParticipantCard, type Participant } from '@/components/results/participant-card';
import { ParticipantModal } from '@/components/results/participant-modal';
import { SearchFilters } from '@/components/results/search-filters';
import { normalizeGender } from '@/lib/normalizeGender';
import { type Event } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface CategoryInfo {
    id: number;
    name: string;
    slug: string;
    certificateEnabled: boolean;
    hasGpx: boolean;
}

interface ElevationPoint {
    distance: number;
    elevation: number;
}

interface ElevationWaypoint {
    name: string;
    distance: number;
    elevation: number;
}

interface Props {
    event: Event;
    categories: CategoryInfo[];
    activeCategory: { slug: string; certificateEnabled: boolean } | null;
    leaderboard: Participant[];
    elevationData: ElevationPoint[];
    elevationWaypoints: ElevationWaypoint[];
    isLive: boolean;
}

const ITEMS_PER_PAGE = 10;
const DEFAULT_GENDER_FILTER = 'all';
const FILTER_LOADING_DELAY = 200;

export default function EventShow({ event, categories, activeCategory, leaderboard, elevationData, elevationWaypoints, isLive }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState(DEFAULT_GENDER_FILTER);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [isLoadingCategory, setIsLoadingCategory] = useState(false);
    const filterTimeoutRef = useRef<number | null>(null);

    const filteredLeaderboard = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return leaderboard.filter((p) => {
            if (query) {
                const matchBib = p.bib.toLowerCase().includes(query);
                const matchName = p.name.toLowerCase().includes(query);
                const matchClub = p.club?.toLowerCase().includes(query);
                if (!matchBib && !matchName && !matchClub) return false;
            }

            if (genderFilter !== 'all') {
                const normalizedGender = normalizeGender(p.gender);
                if (normalizedGender !== genderFilter) return false;
            }

            return true;
        });
    }, [leaderboard, searchQuery, genderFilter]);

    const orderedCategories = useMemo(() => {
        return [...categories].sort((a, b) => a.id - b.id);
    }, [categories]);

    const totalPages = Math.ceil(filteredLeaderboard.length / ITEMS_PER_PAGE);

    const paginatedLeaderboard = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLeaderboard.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredLeaderboard, currentPage]);

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setGenderFilter(DEFAULT_GENDER_FILTER);
        setCurrentPage(1);
        setSelectedParticipant(null);
        setIsFiltering(false);
        setIsLoadingCategory(false);
        if (filterTimeoutRef.current) {
            window.clearTimeout(filterTimeoutRef.current);
            filterTimeoutRef.current = null;
        }
    }, []);

    // Derived stats removed as StatsBar is removed

    const handleCategorySelect = useCallback((slug: string) => {
        if (slug === activeCategory?.slug) return;
        resetFilters();
        router.visit(`/${event.slug}`, {
            preserveScroll: true,
            preserveState: true,
            data: { category: slug },
            only: ['leaderboard', 'activeCategory', 'elevationData', 'elevationWaypoints'],
            onStart: () => setIsLoadingCategory(true),
            onFinish: () => setIsLoadingCategory(false),
        });
    }, [event.slug, activeCategory?.slug, resetFilters]);

    const triggerFilterLoading = useCallback(() => {
        setIsFiltering(true);
        if (filterTimeoutRef.current) {
            window.clearTimeout(filterTimeoutRef.current);
        }
        filterTimeoutRef.current = window.setTimeout(() => {
            setIsFiltering(false);
            filterTimeoutRef.current = null;
        }, FILTER_LOADING_DELAY);
    }, []);

    const handleSearch = useCallback((value: string) => {
        triggerFilterLoading();
        setCurrentPage(1);
        setSearchQuery(value);
    }, [triggerFilterLoading]);

    const handleGenderFilter = useCallback((value: string) => {
        triggerFilterLoading();
        setCurrentPage(1);
        setGenderFilter(value);
    }, [triggerFilterLoading]);

    useEffect(() => {
        return () => {
            if (filterTimeoutRef.current) {
                window.clearTimeout(filterTimeoutRef.current);
                filterTimeoutRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            router.reload({ only: ['leaderboard'] });
        }, 30000);

        return () => clearInterval(interval);
    }, [isLive]);

    return (
        <>
            <Head title={`${event.title} - Results`} />

            <div className="min-h-screen bg-[#efefef] dark:bg-slate-950 pb-12">
                <EventHeader event={event} isLive={isLive} />

                {elevationData.length > 0 && (
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                        <ElevationChart data={elevationData} waypoints={elevationWaypoints} />
                    </div>
                )}

                {categories.length > 1 && (
                    <CategoryTabs
                        categories={orderedCategories}
                        activeSlug={activeCategory?.slug ?? ''}
                        onSelect={handleCategorySelect}
                    />
                )}

                <SearchFilters
                    query={searchQuery}
                    genderFilter={genderFilter}
                    onSearch={handleSearch}
                    onGenderFilter={handleGenderFilter}
                />

                <div className="mx-auto max-w-6xl px-4 py-4 relative">
                    {(isFiltering || isLoadingCategory) && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#efefef]/80 dark:bg-slate-950/80">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading results...
                            </div>
                        </div>
                    )}
                    {paginatedLeaderboard.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                            No results found
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {paginatedLeaderboard.map((participant, index) => (
                                    <ParticipantCard
                                        key={`${participant.bib}-${index}`}
                                        participant={participant}
                                        onClick={() => setSelectedParticipant(participant)}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-8 flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium text-slate-600 px-2">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ParticipantModal
                participant={selectedParticipant}
                open={!!selectedParticipant}
                onClose={() => setSelectedParticipant(null)}
                eventSlug={event.slug}
                categorySlug={activeCategory?.slug ?? ''}
                certificateEnabled={activeCategory?.certificateEnabled}
                elevationData={elevationData}
                elevationWaypoints={elevationWaypoints}
            />
        </>
    );
}
