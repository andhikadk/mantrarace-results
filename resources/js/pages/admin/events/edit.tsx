import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Event } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    event: Event;
}

export default function EventEdit({ event }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/admin/events' },
        { title: event.title, href: `/admin/events/${event.slug}` },
        { title: 'Edit', href: `/admin/events/${event.slug}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        title: event.title,
        slug: event.slug,
        location: event.location,
        start_date: event.start_date.split('T')[0],
        end_date: event.end_date.split('T')[0],
        certificate_availability_date: event.certificate_availability_date
            ? new Date(event.certificate_availability_date).toISOString().slice(0, 16)
            : '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/events/${event.slug}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${event.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Edit Event"
                    description={`Editing: ${event.title}`}
                />

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    {/* Basic Info Section */}
                    <div className="rounded-lg border bg-card p-4 md:p-6">
                        <h2 className="mb-4 font-medium">Basic Information</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Lelono Ultra 2026"
                                />
                                {errors.title && (
                                    <p className="text-sm text-destructive">{errors.title}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="e.g. lelono-ultra-2026"
                                />
                                {errors.slug && (
                                    <p className="text-sm text-destructive">{errors.slug}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location *</Label>
                                <Input
                                    id="location"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    placeholder="e.g. Malang, East Java"
                                />
                                {errors.location && (
                                    <p className="text-sm text-destructive">{errors.location}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Date Section */}
                    <div className="rounded-lg border bg-card p-4 md:p-6">
                        <h2 className="mb-4 font-medium">Schedule</h2>
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Start Date *</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                    />
                                    {errors.start_date && (
                                        <p className="text-sm text-destructive">
                                            {errors.start_date}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End Date *</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                    />
                                    {errors.end_date && (
                                        <p className="text-sm text-destructive">{errors.end_date}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="certificate_availability_date">
                                    Certificate Availability Date
                                    <span className="ml-1 text-xs text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>
                                <Input
                                    id="certificate_availability_date"
                                    type="datetime-local"
                                    value={data.certificate_availability_date}
                                    onChange={(e) =>
                                        setData('certificate_availability_date', e.target.value)
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave blank to use Event End Date.
                                </p>
                                {errors.certificate_availability_date && (
                                    <p className="text-sm text-destructive">
                                        {errors.certificate_availability_date}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/admin/events/${event.slug}`}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
