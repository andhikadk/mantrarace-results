import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CertificateFieldEditor, type FieldsConfig } from '@/components/admin/certificate-field-editor';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category, type Checkpoint } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FileUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    category: Category & {
        checkpoints: Checkpoint[];
        certificate?: { template_path: string; enabled: boolean; fields_config?: unknown } | null;
        gpx_path?: string | null;
    };
}

export default function CategoryEdit({ category }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/admin/events' },
        { title: category.event?.title ?? 'Event', href: `/admin/events/${category.event?.slug}` },
        { title: category.name, href: `/admin/categories/${category.slug}/edit` },
    ];

    // Category form
    const categoryForm = useForm({
        name: category.name,
        slug: category.slug,
        endpoint_url: category.endpoint_url,
    });

    const certForm = useForm<{ template: File | null; enabled: boolean; fields_config: FieldsConfig | null | object }>({
        template: null,
        enabled: category.certificate?.enabled ?? false,
        fields_config: category.certificate?.fields_config ?? null,
    });

    const gpxForm = useForm<{ gpx_file: File | null }>({
        gpx_file: null,
    });

    const [showNewCheckpoint, setShowNewCheckpoint] = useState(false);
    const checkpointForm = useForm({
        order_index: (category.checkpoints?.length ?? 0) + 1,
        name: '',
        time_field: '',
        segment_field: '',
        overall_rank_field: '',
        gender_rank_field: '',
    });

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        categoryForm.put(`/admin/categories/${category.slug}`);
    };

    const handleCertSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        certForm.post(`/admin/categories/${category.slug}/certificate`, {
            forceFormData: true,
        });
    };

    const handleDeleteCertificate = () => {
        if (confirm('Remove certificate template?')) {
            router.delete(`/admin/categories/${category.slug}/certificate`);
        }
    };

    const handleGpxSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        gpxForm.post(`/admin/categories/${category.slug}/gpx`, {
            forceFormData: true,
        });
    };

    const handleDeleteGpx = () => {
        if (confirm('Remove GPX file?')) {
            router.delete(`/admin/categories/${category.slug}/gpx`);
        }
    };

    const handleCheckpointSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        checkpointForm.post(`/admin/categories/${category.slug}/checkpoints`, {
            onSuccess: () => {
                setShowNewCheckpoint(false);
                checkpointForm.reset();
                checkpointForm.setData('order_index', (category.checkpoints?.length ?? 0) + 2);
            },
        });
    };

    const handleDeleteCheckpoint = (checkpoint: Checkpoint) => {
        if (confirm(`Delete checkpoint "${checkpoint.name}"?`)) {
            router.delete(`/admin/checkpoints/${checkpoint.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${category.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Edit Category</h1>
                    <p className="text-muted-foreground">
                        Configure {category.name} for {category.event?.title}
                    </p>
                </div>

                {/* Category Details */}
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Category Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCategorySubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={categoryForm.data.name}
                                        onChange={(e) => categoryForm.setData('name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={categoryForm.data.slug}
                                        onChange={(e) => categoryForm.setData('slug', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endpoint_url">API Endpoint URL *</Label>
                                <Input
                                    id="endpoint_url"
                                    type="url"
                                    value={categoryForm.data.endpoint_url}
                                    onChange={(e) => categoryForm.setData('endpoint_url', e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={categoryForm.processing}>
                                {categoryForm.processing ? 'Saving...' : 'Save Category'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Checkpoints */}
                <Card className="max-w-3xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Checkpoints</CardTitle>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowNewCheckpoint(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {category.checkpoints?.length === 0 && !showNewCheckpoint && (
                            <p className="text-center text-muted-foreground py-8">
                                No checkpoints configured. Add checkpoints to map API fields.
                            </p>
                        )}

                        {category.checkpoints?.map((cp) => (
                            <div
                                key={cp.id}
                                className="flex items-start gap-4 rounded-lg border p-4"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                                    {cp.order_index}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="font-medium">{cp.name}</div>
                                    <div className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                                        <div>Time: {cp.time_field}</div>
                                        {cp.segment_field && <div>Segment: {cp.segment_field}</div>}
                                        {cp.overall_rank_field && (
                                            <div>Rank: {cp.overall_rank_field}</div>
                                        )}
                                        {cp.gender_rank_field && (
                                            <div>Gender Rank: {cp.gender_rank_field}</div>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteCheckpoint(cp)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}

                        {showNewCheckpoint && (
                            <>
                                <Separator />
                                <form onSubmit={handleCheckpointSubmit} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Order #</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={checkpointForm.data.order_index}
                                                onChange={(e) =>
                                                    checkpointForm.setData(
                                                        'order_index',
                                                        parseInt(e.target.value) || 1
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Name *</Label>
                                            <Input
                                                value={checkpointForm.data.name}
                                                onChange={(e) =>
                                                    checkpointForm.setData('name', e.target.value)
                                                }
                                                placeholder="e.g. Seruk 1"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Time Field *</Label>
                                            <Input
                                                value={checkpointForm.data.time_field}
                                                onChange={(e) =>
                                                    checkpointForm.setData('time_field', e.target.value)
                                                }
                                                placeholder="e.g. Seruk 1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Segment Field</Label>
                                            <Input
                                                value={checkpointForm.data.segment_field}
                                                onChange={(e) =>
                                                    checkpointForm.setData('segment_field', e.target.value)
                                                }
                                                placeholder="e.g. Segment 1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Overall Rank Field</Label>
                                            <Input
                                                value={checkpointForm.data.overall_rank_field}
                                                onChange={(e) =>
                                                    checkpointForm.setData(
                                                        'overall_rank_field',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g. Rank C1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gender Rank Field</Label>
                                            <Input
                                                value={checkpointForm.data.gender_rank_field}
                                                onChange={(e) =>
                                                    checkpointForm.setData(
                                                        'gender_rank_field',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g. Rank C1 MF"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={checkpointForm.processing}>
                                            Add Checkpoint
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowNewCheckpoint(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* GPX Settings */}
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>GPX / Elevation Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGpxSubmit} className="space-y-4">
                            {category.gpx_path ? (
                                <div className="flex items-center gap-4 rounded-lg border p-4">
                                    <FileUp className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <div className="font-medium">Current GPX File</div>
                                        <div className="text-sm text-muted-foreground truncate">
                                            {category.gpx_path.split('/').pop()}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDeleteGpx}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <Label htmlFor="gpx_file">Upload GPX File</Label>
                                <Input
                                    id="gpx_file"
                                    type="file"
                                    accept=".gpx,.xml"
                                    onChange={(e) =>
                                        gpxForm.setData('gpx_file', e.target.files?.[0] ?? null)
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Upload a GPX file to display elevation profile on the results page.
                                </p>
                            </div>

                            <Button type="submit" disabled={gpxForm.processing || !gpxForm.data.gpx_file}>
                                {gpxForm.processing ? 'Uploading...' : 'Upload GPX'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Certificate Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCertSubmit} className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="enabled"
                                    checked={certForm.data.enabled}
                                    onCheckedChange={(checked) =>
                                        certForm.setData('enabled', checked === true)
                                    }
                                />
                                <Label htmlFor="enabled">Enable certificate generation</Label>
                            </div>

                            {category.certificate?.template_path && (
                                <div className="flex items-center gap-4 rounded-lg border p-4">
                                    <div className="flex-1">
                                        <div className="font-medium">Current Template</div>
                                        <div className="text-sm text-muted-foreground">
                                            {category.certificate.template_path}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDeleteCertificate}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="template">Upload PDF Template</Label>
                                <Input
                                    id="template"
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) =>
                                        certForm.setData('template', e.target.files?.[0] ?? null)
                                    }
                                />
                            </div>

                            {/* Field Configuration */}
                            {category.certificate?.template_path && (
                                <div className="space-y-2">
                                    <Label>Field Configuration</Label>
                                    <CertificateFieldEditor
                                        config={certForm.data.fields_config as never}
                                        templatePath={category.certificate.template_path}
                                        onChange={(config) => certForm.setData('fields_config', config)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Configure field positions and styling for the certificate.
                                    </p>
                                </div>
                            )}

                            <Button type="submit" disabled={certForm.processing}>
                                {certForm.processing ? 'Uploading...' : 'Save Certificate Settings'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Back Button */}
                <div>
                    <Button variant="outline" asChild>
                        <Link href={`/admin/events/${category.event?.slug}`}>← Back to Event</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
