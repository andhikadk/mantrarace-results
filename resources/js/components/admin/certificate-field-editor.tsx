import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Settings2, Upload, RefreshCw } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

export interface CertificateField {
    type: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    align: string;
    prefix?: string;
    suffix?: string;
    field?: string;
    uppercase?: boolean;
    customText?: string;
    customFontUrl?: string;
    customFontName?: string;
    maxLength?: number;
}

export interface FieldsConfig {
    fields: CertificateField[];
    pageSize: { width: number; height: number };
}

interface Props {
    config: FieldsConfig | null;
    templatePath: string | null;
    onChange: (config: FieldsConfig) => void;
    categorySlug: string;
}

const FIELD_TYPES = [
    { value: 'participant_name', label: 'Nama Peserta' },
    { value: 'overall_rank', label: 'Rank Overall' },
    { value: 'gender_rank', label: 'Rank Gender' },
    { value: 'category_name', label: 'Category Name' },
    { value: 'finish_time', label: 'Finish Time' },
    { value: 'bib', label: 'BIB' },
    { value: 'event_name', label: 'Nama Event' },
    { value: 'event_date', label: 'Event Date' },
    { value: 'custom', label: 'Custom Text' },
];

const DEFAULT_FIELD: CertificateField = {
    type: 'participant_name', x: 297.5, y: 120, fontSize: 36,
    fontFamily: 'helvetica', fontWeight: 'bold', color: '#000000', align: 'center',
};

const DEFAULT_CONFIG: FieldsConfig = {
    fields: [DEFAULT_FIELD],
    pageSize: { width: 842, height: 595 },
};

export function CertificateFieldEditor({ config, templatePath, onChange, categorySlug }: Props) {
    const [localConfig, setLocalConfig] = useState<FieldsConfig>(config ?? DEFAULT_CONFIG);
    const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync localConfig with prop when it changes
    useEffect(() => {
        if (config) {
            setLocalConfig(config);
        }
    }, [config]);

    const updateConfig = useCallback((newConfig: FieldsConfig) => {
        setLocalConfig(newConfig);
        onChange(newConfig);
    }, [onChange]);

    const addField = () => updateConfig({ ...localConfig, fields: [...localConfig.fields, { ...DEFAULT_FIELD, y: 120 + localConfig.fields.length * 40 }] });
    const removeField = (i: number) => { updateConfig({ ...localConfig, fields: localConfig.fields.filter((_, idx) => idx !== i) }); setSelectedFieldIndex(null); };
    const updateField = (i: number, u: Partial<CertificateField>) => { const f = [...localConfig.fields]; f[i] = { ...f[i], ...u }; updateConfig({ ...localConfig, fields: f }); };

    // Fetch preview from server with debouncing
    useEffect(() => {
        if (!isOpen || !templatePath) return;

        const timeoutId = setTimeout(async () => {
            setIsLoadingPreview(true);
            try {
                // Get CSRF token
                const xsrfToken = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('XSRF-TOKEN='))
                    ?.split('=')[1];

                const response = await fetch(`/admin/categories/${categorySlug}/certificate/preview`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken || ''),
                        'Accept': 'application/pdf',
                    },
                    body: JSON.stringify({ fields_config: localConfig }),
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(url);
                }
            } catch (err) {
                console.error('Preview fetch error:', err);
            } finally {
                setIsLoadingPreview(false);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timeoutId);
    }, [localConfig, isOpen, templatePath, categorySlug]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Handle font file upload
    const handleFontUpload = async (fieldIndex: number, file: File) => {
        const formData = new FormData();
        formData.append('font', file);

        const xsrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

        try {
            const response = await fetch('/admin/fonts', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken || '')
                }
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            const data = await response.json();
            if (data.url) {
                updateField(fieldIndex, { customFontUrl: data.url, customFontName: data.name, fontFamily: 'custom' });
            }
        } catch (err) {
            console.error('Font upload error:', err);
            alert('Failed to upload font. Please try again.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!templatePath}>
                    <Settings2 className="mr-2 h-4 w-4" /> Configure Fields
                </Button>
            </DialogTrigger>
            <DialogContent className="w-4xl max-w-[1280px] h-[90vh] flex flex-col p-0 sm:max-w-[1280px]" style={{ maxWidth: '1400px' }}>
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Certificate Field Configuration</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex">
                    {/* PDF Preview - Left Side (Server-side rendered) */}
                    <div ref={containerRef} className="flex-1 overflow-auto p-4 bg-slate-100 border-r flex items-center justify-center">
                        {isLoadingPreview && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                    <span>Generating preview...</span>
                                </div>
                            </div>
                        )}
                        {previewUrl ? (
                            <object
                                data={previewUrl}
                                type="application/pdf"
                                className="w-full h-full"
                                style={{ maxHeight: 'calc(90vh - 120px)' }}
                            >
                                <div className="p-8 text-red-500">Failed to load preview</div>
                            </object>
                        ) : (
                            <div className="text-slate-400">Open dialog to generate preview</div>
                        )}
                    </div>

                    {/* Fields Panel - Right Side */}
                    <div className="w-80 flex flex-col bg-white">
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                            <span className="font-medium text-sm">Fields</span>
                            <Button size="sm" variant="outline" onClick={addField}>
                                <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {localConfig.fields.map((field, i) => (
                                <Card key={i} className={`${selectedFieldIndex === i ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelectedFieldIndex(i)}>
                                    <CardHeader className="p-3 pb-2">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-sm">{FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}</CardTitle>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeField(i); }}>
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-[10px] text-slate-500">Type</Label>
                                                <Select value={field.type} onValueChange={(v) => updateField(i, { type: v })}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-500">Align</Label>
                                                <Select value={field.align} onValueChange={(v) => updateField(i, { align: v })}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="left" className="text-xs">Left</SelectItem>
                                                        <SelectItem value="center" className="text-xs">Center</SelectItem>
                                                        <SelectItem value="right" className="text-xs">Right</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-[10px] text-slate-500">X</Label>
                                                <Input type="number" className="h-8 text-xs" value={field.x} onChange={(e) => updateField(i, { x: +e.target.value || 0 })} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-500">Y</Label>
                                                <Input type="number" className="h-8 text-xs" value={field.y} onChange={(e) => updateField(i, { y: +e.target.value || 0 })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <Label className="text-[10px] text-slate-500">Size</Label>
                                                <Input type="number" className="h-8 text-xs" value={field.fontSize} onChange={(e) => updateField(i, { fontSize: +e.target.value || 12 })} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-500">Weight</Label>
                                                <Select value={field.fontWeight} onValueChange={(v) => updateField(i, { fontWeight: v })}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                                                        <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-500">Color</Label>
                                                <Input type="color" className="h-8 p-1 w-full" value={field.color} onChange={(e) => updateField(i, { color: e.target.value })} />
                                            </div>
                                        </div>
                                        {/* Font Upload */}
                                        <div>
                                            <Label className="text-[10px] text-slate-500">Font</Label>
                                            <div className="flex gap-1">
                                                {field.customFontName ? (
                                                    <div className="flex-1 flex items-center gap-1">
                                                        <span className="text-xs truncate flex-1 border rounded px-2 py-1 bg-slate-50">{field.customFontName}</span>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateField(i, { customFontUrl: undefined, customFontName: undefined, fontFamily: 'helvetica' })}>
                                                            <Trash2 className="h-3 w-3 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label className="flex-1 flex items-center justify-center gap-1 border rounded px-2 py-1 h-8 cursor-pointer hover:bg-slate-50 text-xs">
                                                        <Upload className="h-3 w-3" /> Upload .ttf/.otf
                                                        <input type="file" accept=".ttf,.otf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFontUpload(i, e.target.files[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <input
                                                type="checkbox"
                                                id={`uppercase-${i}`}
                                                checked={field.uppercase ?? false}
                                                onChange={(e) => updateField(i, { uppercase: e.target.checked })}
                                                className="h-3 w-3"
                                            />
                                            <Label htmlFor={`uppercase-${i}`} className="text-[10px] text-slate-500">UPPERCASE</Label>
                                        </div>
                                        <div>
                                            <Label className="text-[10px] text-slate-500">Custom Text (optional)</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                placeholder="Leave empty for auto"
                                                value={field.customText ?? ''}
                                                onChange={(e) => updateField(i, { customText: e.target.value || undefined })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] text-slate-500">Max Length (0 = No Limit)</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs"
                                                placeholder="e.g. 15"
                                                value={field.maxLength ?? ''}
                                                onChange={(e) => updateField(i, { maxLength: +e.target.value || undefined })}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {localConfig.fields.length === 0 && (
                                <div className="text-center text-slate-400 py-8 text-sm">No fields. Click "Add" to start.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-3 border-t flex justify-end">
                    <Button onClick={() => setIsOpen(false)}>Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
