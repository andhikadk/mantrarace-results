import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Event } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, MapPin, Plus, Trash2 } from 'lucide-react';

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
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Events</h1>
                        <p className="text-muted-foreground">Manage your race events</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/events/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Event
                        </Link>
                    </Button>
                </div>

                {events.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-medium">No events yet</h3>
                            <p className="mb-4 text-muted-foreground">
                                Create your first event to get started
                            </p>
                            <Button asChild>
                                <Link href="/admin/events/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Event
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {events.map((event) => (
                            <Card key={event.id} className="group relative">
                                <Link href={`/admin/events/${event.slug}`}>
                                    <CardHeader>
                                        <CardTitle className="line-clamp-1">
                                            {event.title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {event.location}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(event.start_date).toLocaleDateString()}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {event.categories_count ?? 0} categories
                                            </div>
                                        </div>
                                    </CardContent>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDelete(event);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
