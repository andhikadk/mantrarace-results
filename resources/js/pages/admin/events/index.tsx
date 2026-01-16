import { PageHeader } from '@/components/admin/page-header';
import { getEventStatus, StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Event } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, ExternalLink, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

interface Props {
    events: Event[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Events', href: '/admin/events' },
];

export default function EventsIndex({ events }: Props) {
    const handleDelete = (event: Event) => {
        if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
            router.delete(`/admin/events/${event.slug}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Events" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader title="Events" description="Manage your race events">
                    <Button asChild>
                        <Link href="/admin/events/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Event
                        </Link>
                    </Button>
                </PageHeader>

                {events.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-12">
                        <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mb-2 text-lg font-medium">No events yet</h3>
                        <p className="mb-6 text-sm text-muted-foreground">
                            Create your first event to get started
                        </p>
                        <Button asChild>
                            <Link href="/admin/events/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Event
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onDelete={() => handleDelete(event)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function EventCard({ event, onDelete }: { event: Event; onDelete: () => void }) {
    const status = getEventStatus(event.start_date, event.end_date);

    return (
        <div className="group relative flex flex-col rounded-lg border bg-card transition-colors hover:bg-accent/50">
            <Link
                href={`/admin/events/${event.slug}`}
                className="flex flex-1 flex-col p-4"
            >
                <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight line-clamp-2">
                        {event.title}
                    </h3>
                    <StatusBadge status={status} className="shrink-0" />
                </div>

                <p className="mb-4 text-sm text-muted-foreground line-clamp-1">
                    {event.location}
                </p>

                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(event.start_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                    <span>{event.categories_count ?? 0} categories</span>
                </div>
            </Link>

            <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/${event.slug}`} target="_blank">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Results
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/events/${event.slug}/edit`}>
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
