import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CertificateFieldEditor, type FieldsConfig } from '@/components/admin/certificate-field-editor';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category, type Checkpoint } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Award, FileUp, MapPin, Pencil, Plus, Route, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    category: Category & {
        checkpoints: Checkpoint[];
        certificate?: { template_path: string; enabled: boolean; fields_config?: unknown } | null;
        gpx_path?: string | null;
    };
}

type SectionId = 'details' | 'checkpoints' | 'gpx' | 'certificate';

const sections: { id: SectionId; label: string; icon: typeof Settings2 }[] = [
    { id: 'details', label: 'Details', icon: Settings2 },
    { id: 'checkpoints', label: 'Checkpoints', icon: Route },
    { id: 'gpx', label: 'GPX Profile', icon: MapPin },
    { id: 'certificate', label: 'Certificate', icon: Award },
];

export default function CategoryEdit({ category }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/admin/events' },
        { title: category.event?.title ?? 'Event', href: `/admin/events/${category.event?.slug}` },
        { title: category.name, href: `/admin/categories/${category.slug}/edit` },
    ];

    const [activeSection, setActiveSection] = useState<SectionId>('details');

    // Category form
    const categoryForm = useForm({
        name: category.name,
        slug: category.slug,
        endpoint_url: category.endpoint_url,
        total_distance: category.total_distance ?? ('' as string | number),
        total_elevation_gain: category.total_elevation_gain ?? ('' as string | number),
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
    const [editingCheckpoint, setEditingCheckpoint] = useState<Checkpoint | null>(null);
    const checkpointForm = useForm({
        order_index: (category.checkpoints?.length ?? 0) + 1,
        name: '',
        time_field: '',
        segment_field: '',
        overall_rank_field: '',
        gender_rank_field: '',
        distance: '' as string | number,
        elevation_gain: '' as string | number,
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

    const handleEditCheckpoint = (cp: Checkpoint) => {
        setEditingCheckpoint(cp);
        setShowNewCheckpoint(false);
        checkpointForm.setData({
            order_index: cp.order_index,
            name: cp.name,
            time_field: cp.time_field,
            segment_field: cp.segment_field || '',
            overall_rank_field: cp.overall_rank_field || '',
            gender_rank_field: cp.gender_rank_field || '',
            distance: cp.distance ?? '',
            elevation_gain: cp.elevation_gain ?? '',
        });
    };

    const handleUpdateCheckpoint = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCheckpoint) return;
        checkpointForm.put(`/admin/checkpoints/${editingCheckpoint.id}`, {
            onSuccess: () => {
                setEditingCheckpoint(null);
                checkpointForm.reset();
                checkpointForm.setData('order_index', (category.checkpoints?.length ?? 0) + 1);
            },
        });
    };

    const handleCancelEdit = () => {
        setEditingCheckpoint(null);
        checkpointForm.reset();
        checkpointForm.setData('order_index', (category.checkpoints?.length ?? 0) + 1);
    };

    const handleDeleteCheckpoint = (checkpoint: Checkpoint) => {
        if (confirm(`Delete checkpoint "${checkpoint.name}"?`)) {
            router.delete(`/admin/checkpoints/${checkpoint.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${category.name}`} />
            <div className="flex h-full flex-1 flex-col p-4 md:p-6">
                {/* Header with accent bar */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="h-12 w-1.5 rounded-full bg-primary" />
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{category.name}</h1>
                        <p className="text-sm text-muted-foreground">{category.event?.title}</p>
                    </div>
                    <div className="ml-auto">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/events/${category.event?.slug}`}>← Back to Event</Link>
                        </Button>
                    </div>
                </div>

                {/* Two-column layout */}
                <div className="flex flex-1 gap-6">
                    {/* Sidebar Navigation */}
                    <nav className="hidden w-48 shrink-0 md:block">
                        <div className="sticky top-4 space-y-1">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {section.label}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Mobile Navigation */}
                    <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {section.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 rounded-xl border bg-card p-6">
                        {/* Details Section */}
                        {activeSection === 'details' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold">Category Details</h2>
                                    <p className="text-sm text-muted-foreground">Basic information and API configuration</p>
                                </div>
                                <Separator />
                                <form onSubmit={handleCategorySubmit} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
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
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="total_distance">Total Distance (km)</Label>
                                            <Input
                                                id="total_distance"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={categoryForm.data.total_distance}
                                                onChange={(e) => categoryForm.setData('total_distance', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                placeholder="e.g. 42.195"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="total_elevation_gain">Total Elevation Gain (m)</Label>
                                            <Input
                                                id="total_elevation_gain"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={categoryForm.data.total_elevation_gain}
                                                onChange={(e) => categoryForm.setData('total_elevation_gain', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                placeholder="e.g. 1500"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <Button type="submit" disabled={categoryForm.processing}>
                                            {categoryForm.processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Checkpoints Section */}
                        {activeSection === 'checkpoints' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">Checkpoints</h2>
                                        <p className="text-sm text-muted-foreground">
                                            {category.checkpoints?.length ?? 0} checkpoints configured
                                        </p>
                                    </div>
                                    <Button size="sm" onClick={() => setShowNewCheckpoint(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add
                                    </Button>
                                </div>
                                <Separator />

                                {category.checkpoints?.length === 0 && !showNewCheckpoint && (
                                    <div className="py-12 text-center">
                                        <Route className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                                        <p className="text-muted-foreground">No checkpoints configured</p>
                                        <Button variant="outline" className="mt-4" onClick={() => setShowNewCheckpoint(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add First Checkpoint
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {category.checkpoints?.map((cp) => (
                                        <div key={cp.id}>
                                            {editingCheckpoint?.id === cp.id ? (
                                                <form onSubmit={handleUpdateCheckpoint} className="space-y-4 rounded-lg border-2 border-primary/50 bg-muted/30 p-4">
                                                    <div className="text-sm font-medium text-primary">Editing: {cp.name}</div>
                                                    <div className="grid gap-4 sm:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <Label>Order #</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={checkpointForm.data.order_index}
                                                                onChange={(e) => checkpointForm.setData('order_index', parseInt(e.target.value) || 1)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2 sm:col-span-2">
                                                            <Label>Name *</Label>
                                                            <Input
                                                                value={checkpointForm.data.name}
                                                                onChange={(e) => checkpointForm.setData('name', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label>Time Field *</Label>
                                                            <Input
                                                                value={checkpointForm.data.time_field}
                                                                onChange={(e) => checkpointForm.setData('time_field', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Segment Field</Label>
                                                            <Input
                                                                value={checkpointForm.data.segment_field}
                                                                onChange={(e) => checkpointForm.setData('segment_field', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Distance (km)</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={checkpointForm.data.distance}
                                                                onChange={(e) => checkpointForm.setData('distance', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Elevation Gain (m)</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={checkpointForm.data.elevation_gain}
                                                                onChange={(e) => checkpointForm.setData('elevation_gain', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button type="submit" disabled={checkpointForm.processing}>
                                                            {checkpointForm.processing ? 'Saving...' : 'Save'}
                                                        </Button>
                                                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                                        {cp.order_index}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium">{cp.name}</div>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                            <span>Time: {cp.time_field}</span>
                                                            {cp.distance !== null && <span>{cp.distance} km</span>}
                                                            {cp.elevation_gain !== null && <span>+{cp.elevation_gain}m</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Button size="icon" variant="ghost" onClick={() => handleEditCheckpoint(cp)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteCheckpoint(cp)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {showNewCheckpoint && (
                                        <form onSubmit={handleCheckpointSubmit} className="space-y-4 rounded-lg border-2 border-dashed border-primary/30 bg-muted/20 p-4">
                                            <div className="text-sm font-medium text-primary">New Checkpoint</div>
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <div className="space-y-2">
                                                    <Label>Order #</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={checkpointForm.data.order_index}
                                                        onChange={(e) => checkpointForm.setData('order_index', parseInt(e.target.value) || 1)}
                                                    />
                                                </div>
                                                <div className="space-y-2 sm:col-span-2">
                                                    <Label>Name *</Label>
                                                    <Input
                                                        value={checkpointForm.data.name}
                                                        onChange={(e) => checkpointForm.setData('name', e.target.value)}
                                                        placeholder="e.g. Seruk 1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>Time Field *</Label>
                                                    <Input
                                                        value={checkpointForm.data.time_field}
                                                        onChange={(e) => checkpointForm.setData('time_field', e.target.value)}
                                                        placeholder="e.g. Seruk 1"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Segment Field</Label>
                                                    <Input
                                                        value={checkpointForm.data.segment_field}
                                                        onChange={(e) => checkpointForm.setData('segment_field', e.target.value)}
                                                        placeholder="e.g. Segment 1"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Distance (km)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={checkpointForm.data.distance}
                                                        onChange={(e) => checkpointForm.setData('distance', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                        placeholder="e.g. 5.5"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Elevation Gain (m)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={checkpointForm.data.elevation_gain}
                                                        onChange={(e) => checkpointForm.setData('elevation_gain', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                        placeholder="e.g. 350"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="submit" disabled={checkpointForm.processing}>
                                                    Add Checkpoint
                                                </Button>
                                                <Button type="button" variant="outline" onClick={() => setShowNewCheckpoint(false)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* GPX Section */}
                        {activeSection === 'gpx' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold">GPX / Elevation Profile</h2>
                                    <p className="text-sm text-muted-foreground">Upload GPX file for elevation visualization</p>
                                </div>
                                <Separator />
                                <form onSubmit={handleGpxSubmit} className="space-y-4">
                                    {category.gpx_path ? (
                                        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <FileUp className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">Current GPX File</div>
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {category.gpx_path.split('/').pop()}
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" onClick={handleDeleteGpx}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border-2 border-dashed p-8 text-center">
                                            <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                                            <p className="text-muted-foreground">No GPX file uploaded</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="gpx_file">Upload GPX File</Label>
                                        <Input
                                            id="gpx_file"
                                            type="file"
                                            accept=".gpx,.xml"
                                            onChange={(e) => gpxForm.setData('gpx_file', e.target.files?.[0] ?? null)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Upload a GPX file to display elevation profile on the results page.
                                        </p>
                                    </div>

                                    <Button type="submit" disabled={gpxForm.processing || !gpxForm.data.gpx_file}>
                                        {gpxForm.processing ? 'Uploading...' : 'Upload GPX'}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Certificate Section */}
                        {activeSection === 'certificate' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold">Certificate Settings</h2>
                                    <p className="text-sm text-muted-foreground">Configure finisher certificate generation</p>
                                </div>
                                <Separator />
                                <form onSubmit={handleCertSubmit} className="space-y-4">
                                    <div className="flex items-center gap-3 rounded-lg border p-4">
                                        <Checkbox
                                            id="enabled"
                                            checked={certForm.data.enabled}
                                            onCheckedChange={(checked) => certForm.setData('enabled', checked === true)}
                                        />
                                        <Label htmlFor="enabled" className="cursor-pointer">
                                            Enable certificate generation for this category
                                        </Label>
                                    </div>

                                    {category.certificate?.template_path && (
                                        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <Award className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">Current Template</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {category.certificate.template_path}
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" onClick={handleDeleteCertificate}>
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
                                            onChange={(e) => certForm.setData('template', e.target.files?.[0] ?? null)}
                                        />
                                    </div>

                                    {category.certificate?.template_path && (
                                        <div className="space-y-2">
                                            <Label>Field Configuration</Label>
                                            <CertificateFieldEditor
                                                config={certForm.data.fields_config as never}
                                                templatePath={category.certificate.template_path}
                                                categorySlug={category.slug}
                                                onChange={(config) => certForm.setData('fields_config', config)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Configure field positions and styling for the certificate.
                                            </p>
                                        </div>
                                    )}

                                    <Button type="submit" disabled={certForm.processing}>
                                        {certForm.processing ? 'Saving...' : 'Save Certificate Settings'}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
