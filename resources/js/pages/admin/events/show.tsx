import { getEventStatus, StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category, type Event } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    ExternalLink,
    Lock,
    MapPin,
    MoreHorizontal,
    Pencil,
    Plus,
    Route,
    Settings,
    Trash2,
    Unlock,
} from 'lucide-react';
import React from 'react';

interface CategoryResultStatus {
    id: number;
    name: string;
    slug: string;
    hasSnapshot: boolean;
    isLocked: boolean;
    fetchedAt: string | null;
    lockedAt: string | null;
    totalParticipants: number | null;
}

interface Props {
    event: Event & { categories: (Category & { checkpoints_count: number })[] };
    categoryResultsStatus: CategoryResultStatus[];
}

export default function EventShow({ event, categoryResultsStatus }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/admin/events' },
        { title: event.title, href: `/admin/events/${event.slug}` },
    ];

    const status = getEventStatus(event.start_date, event.end_date);

    const [processing, setProcessing] = React.useState(false);

    const handleDeleteCategory = (category: Category) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(`/admin/categories/${category.slug}`);
        }
    };

    const handleBulkAction = (action: 'finalize' | 'unlock') => {
        const message =
            action === 'finalize'
                ? 'Finalize all categories? Data will be locked and served from database.'
                : 'Unlock all categories? Data will revert to API source.';

        if (!confirm(message)) {
            return;
        }

        const url = `/admin/events/${event.slug}/results/${action}`;

        setProcessing(true);
        router.visit(url, {
            method: 'post',
            data: { category_ids: event.categories.map((c) => c.id) },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.title} />
            <div className="flex h-full flex-1 flex-col p-4 md:p-6">
                {/* Hero Header */}
                <div className="mb-8 flex flex-col gap-6 rounded-xl border bg-card p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-1.5 rounded-full bg-primary" />
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-semibold tracking-tight">
                                        {event.title}
                                    </h1>
                                    <StatusBadge status={status} />
                                </div>
                                {event.location && (
                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        {event.location}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <a href={`/${event.slug}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Results
                                </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/events/${event.slug}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Date
                                </div>
                                <div className="font-medium">
                                    {new Date(
                                        event.start_date,
                                    ).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                    })}
                                    {' - '}
                                    {new Date(
                                        event.end_date,
                                    ).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <Route className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Categories
                                </div>
                                <div className="font-medium">
                                    {event.categories.length} categories
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Race Categories
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Configure distance categories and checkpoints
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {event.categories.length > 0 && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction('finalize')}
                                    disabled={
                                        processing ||
                                        event.categories.length === 0
                                    }
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Finalize All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction('unlock')}
                                    disabled={
                                        processing ||
                                        event.categories.length === 0
                                    }
                                >
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Unlock All
                                </Button>
                            </>
                        )}
                        <Button asChild>
                            <Link
                                href={`/admin/events/${event.slug}/categories/create`}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Link>
                        </Button>
                    </div>
                </div>

                {event.categories.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-12">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <Settings className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium">
                            No categories yet
                        </h3>
                        <p className="mb-6 text-center text-sm text-muted-foreground">
                            Add categories like 55K, 30K, 10K, etc.
                        </p>
                        <Button asChild>
                            <Link
                                href={`/admin/events/${event.slug}/categories/create`}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[...event.categories]
                            .sort((a, b) => a.id - b.id)
                            .map((category) => {
                                const statusInfo = categoryResultsStatus.find(
                                    (s) => s.id === category.id,
                                );
                                return (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        eventSlug={event.slug}
                                        resultStatus={statusInfo}
                                        onDelete={() =>
                                            handleDeleteCategory(category)
                                        }
                                    />
                                );
                            })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function CategoryCard({
    category,
    eventSlug,
    resultStatus,
    onDelete,
}: {
    category: Category & { checkpoints_count?: number };
    eventSlug: string;
    resultStatus?: CategoryResultStatus;
    onDelete: () => void;
}) {
    return (
        <div className="group relative flex flex-col overflow-hidden rounded-xl border transition-all hover:shadow-md">
            <Link
                href={`/admin/categories/${category.slug}/edit`}
                className="flex flex-1 flex-col p-4"
            >
                <div className="mb-3 flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">
                            {category.name}
                        </h3>
                        <p className="font-mono text-xs text-muted-foreground">
                            /{category.slug}
                        </p>
                    </div>
                    {resultStatus?.hasSnapshot &&
                        (resultStatus.isLocked ? (
                            <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Locked
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="gap-1">
                                Draft
                            </Badge>
                        ))}
                </div>

                <div className="mt-auto space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Checkpoints
                        </span>
                        <span className="font-medium">
                            {category.checkpoints_count ?? 0}
                        </span>
                    </div>
                    <div
                        className="truncate text-xs text-muted-foreground"
                        title={category.endpoint_url}
                    >
                        {category.endpoint_url}
                    </div>
                </div>
            </Link>

            {/* Dropdown Menu */}
            <div className="absolute top-4 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 shadow-sm"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <a
                                href={`/${eventSlug}?category=${category.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Results
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/admin/categories/${category.slug}/edit`}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete();
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
