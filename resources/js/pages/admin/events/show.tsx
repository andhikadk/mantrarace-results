import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category, type Event } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Edit, ExternalLink, MapPin, Plus, Settings, Trash2 } from 'lucide-react';

interface Props {
    event: Event & { categories: (Category & { checkpoints_count: number })[] };
}

export default function EventShow({ event }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/admin/events' },
        { title: event.title, href: `/admin/events/${event.slug}` },
    ];

    const handleDeleteCategory = (category: Category) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(`/admin/categories/${category.slug}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.title} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Event Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{event.title}</h1>
                        <div className="mt-1 flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.start_date).toLocaleDateString()} -{' '}
                                {new Date(event.end_date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/${event.slug}`} target="_blank">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Results
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/admin/events/${event.slug}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Categories</h2>
                    <Button asChild>
                        <Link href={`/admin/events/${event.slug}/categories/create`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                        </Link>
                    </Button>
                </div>

                {event.categories.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Settings className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-medium">No categories yet</h3>
                            <p className="mb-4 text-muted-foreground">
                                Add categories like 55K, 30K, 10K, etc.
                            </p>
                            <Button asChild>
                                <Link href={`/admin/events/${event.slug}/categories/create`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Category
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {event.categories.map((category) => (
                            <Card key={category.id} className="group relative">
                                <Link href={`/admin/categories/${category.slug}/edit`}>
                                    <CardHeader>
                                        <CardTitle>{category.name}</CardTitle>
                                        <CardDescription>/{category.slug}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div className="truncate">
                                                API: {category.endpoint_url}
                                            </div>
                                            <div>
                                                {category.checkpoints_count ?? 0} checkpoints
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
                                        handleDeleteCategory(category);
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
