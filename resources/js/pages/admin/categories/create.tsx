import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Event } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    event: Event;
}

export default function CategoryCreate({ event }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/admin/events' },
        { title: event.title, href: `/admin/events/${event.slug}` },
        { title: 'Add Category', href: `/admin/events/${event.slug}/categories/create` },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        endpoint_url: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/events/${event.slug}/categories`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Add Category - ${event.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Add Category</h1>
                    <p className="text-muted-foreground">Add a new category to {event.title}</p>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Category Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. 55K, 30K, 10K"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (auto-generated if empty)</Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="e.g. 55k"
                                />
                                {errors.slug && (
                                    <p className="text-sm text-destructive">{errors.slug}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endpoint_url">API Endpoint URL *</Label>
                                <Input
                                    id="endpoint_url"
                                    type="url"
                                    value={data.endpoint_url}
                                    onChange={(e) => setData('endpoint_url', e.target.value)}
                                    placeholder="https://api.raceresult.com/..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    The RaceResult API endpoint for this category
                                </p>
                                {errors.endpoint_url && (
                                    <p className="text-sm text-destructive">{errors.endpoint_url}</p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Category'}
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={`/admin/events/${event.slug}`}>Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
