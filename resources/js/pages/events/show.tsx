import { Button } from '@/components/ui/button';
import { CategoryTabs } from '@/components/results/category-tabs';
import { EventHeader } from '@/components/results/event-header';
import { ParticipantCard, type Participant } from '@/components/results/participant-card';
import { ParticipantModal } from '@/components/results/participant-modal';
import { SearchFilters } from '@/components/results/search-filters';
import { StatsBar } from '@/components/results/stats-bar';
import { type Event } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface CategoryInfo {
    id: number;
    name: string;
    slug: string;
    certificateEnabled: boolean;
}

interface Props {
    event: Event;
    categories: CategoryInfo[];
    activeCategory: { slug: string; certificateEnabled: boolean } | null;
    leaderboard: Participant[];
    isLive: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function EventShow({ event, categories, activeCategory, leaderboard, isLive }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

    const filteredLeaderboard = useMemo(() => {
        return leaderboard.filter((p) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchBib = p.bib.toLowerCase().includes(q);
                const matchName = p.name.toLowerCase().includes(q);
                const matchClub = p.club?.toLowerCase().includes(q);
                if (!matchBib && !matchName && !matchClub) return false;
            }

            if (genderFilter !== 'all') {
                const g = p.gender?.toUpperCase()?.charAt(0);
                if (g !== genderFilter) return false;
            }

            if (statusFilter !== 'all') {
                const s = p.status?.toUpperCase();
                if (statusFilter === 'finished') {
                    const isFinished = s === 'FINISHED' || (p.finishTime && !['DNF', 'DNS'].includes(s));
                    if (!isFinished) return false;
                } else if (statusFilter === 'dnf' && s !== 'DNF') {
                    return false;
                } else if (statusFilter === 'dns' && s !== 'DNS') {
                    return false;
                }
            }

            return true;
        });
    }, [leaderboard, searchQuery, genderFilter, statusFilter]);

    const totalPages = Math.ceil(filteredLeaderboard.length / ITEMS_PER_PAGE);

    const paginatedLeaderboard = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLeaderboard.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredLeaderboard, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, genderFilter, statusFilter]);

    const stats = useMemo(() => {
        const finishers = leaderboard.filter((p) => {
            const s = p.status?.toUpperCase();
            return s === 'FINISHED' || (p.finishTime && !['DNF', 'DNS'].includes(s));
        });
        return {
            total: leaderboard.length,
            finishers: finishers.length,
            bestTime: finishers[0]?.finishTime ?? null,
        };
    }, [leaderboard]);

    const handleCategorySelect = useCallback((slug: string) => {
        router.visit(`/${event.slug}/categories/${slug}`, {
            preserveScroll: true,
        });
    }, [event.slug]);

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

            <div className="min-h-screen bg-slate-50">
                <EventHeader event={event} isLive={isLive} />

                {categories.length > 1 && (
                    <CategoryTabs
                        categories={categories}
                        activeSlug={activeCategory?.slug ?? ''}
                        onSelect={handleCategorySelect}
                    />
                )}

                <StatsBar
                    totalParticipants={stats.total}
                    finishers={stats.finishers}
                    bestTime={stats.bestTime}
                />

                <SearchFilters
                    onSearch={setSearchQuery}
                    onGenderFilter={setGenderFilter}
                    onStatusFilter={setStatusFilter}
                    resultCount={filteredLeaderboard.length}
                />

                <div className="mx-auto max-w-5xl px-4 py-4">
                    {paginatedLeaderboard.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            No results found
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {paginatedLeaderboard.map((participant) => (
                                    <ParticipantCard
                                        key={participant.bib}
                                        participant={participant}
                                        onClick={() => setSelectedParticipant(participant)}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-slate-600">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
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
            />
        </>
    );
}

