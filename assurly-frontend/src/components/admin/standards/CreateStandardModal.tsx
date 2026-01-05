import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Standard, type Aspect } from '@/types/assessment';
import { useEffect, useCallback } from 'react';

const formSchema = z.object({
    standard_code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must be less than 10 characters'),
    standard_name: z.string().min(5, 'Title must be at least 5 characters'),
    standard_description: z.string().min(20, 'Description must be at least 20 characters').max(250, 'Description must be less than 250 characters'),
    mat_aspect_id: z.string().min(1, 'Please select an aspect'),
    change_reason: z.string().min(5, 'Please describe the reason for this change').max(200, 'Reason must be less than 200 characters'),
});



interface CreateStandardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => void;
    standard?: Standard; // If provided, we are in edit mode
    defaultAspectId?: string;
    aspects: Aspect[];
    allStandards?: Standard[]; // All standards to help generate next ID
}

export function CreateStandardModal({ open, onOpenChange, onSave, standard, defaultAspectId, aspects, allStandards = [] }: CreateStandardModalProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            standard_code: '',
            standard_name: '',
            standard_description: '',
            mat_aspect_id: defaultAspectId || '',
            change_reason: standard ? 'Updated standard' : 'Initial version',
        },
    });

    // Generate next standard code for an aspect - memoized to prevent recreation
    const generateNextStandardCode = useCallback((matAspectId: string): string => {
        const aspect = aspects.find(a => a.mat_aspect_id === matAspectId);
        if (!aspect) return '';
        
        // Get aspect code prefix (first 2-3 letters uppercase)
        const aspectCode = aspect.aspect_code.toUpperCase().slice(0, 3);
        
        // Find all standards for this aspect
        const aspectStandards = allStandards.filter(s => s.mat_aspect_id === matAspectId);
        
        if (aspectStandards.length === 0) {
            return `${aspectCode}1`;
        }
        
        // Extract numbers from existing standard codes
        const numbers = aspectStandards
            .map(s => {
                // Extract number from codes like "ES1", "EDU2", "education1", etc.
                const match = s.standard_code.match(/\d+$/);
                return match ? parseInt(match[0], 10) : 0;
            })
            .filter(n => n > 0);
        
        // Get the highest number and add 1
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        return `${aspectCode}${maxNumber + 1}`;
    }, [aspects, allStandards]);

    // Helper to get version number with fallbacks
    const getVersionNumber = (std: Standard): number => {
        // Try current_version first (primary field)
        const currentVersion = std.current_version;
        if (currentVersion !== null && currentVersion !== undefined && currentVersion !== 0) {
            if (typeof currentVersion === 'string') {
                const parsed = parseInt(currentVersion, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                }
            } else if (typeof currentVersion === 'number' && currentVersion > 0) {
                return currentVersion;
            }
        }
        
        // Try version_number (legacy/fallback field)
        const versionNumber = std.version_number;
        if (versionNumber !== null && versionNumber !== undefined && versionNumber !== 0) {
            if (typeof versionNumber === 'string') {
                const parsed = parseInt(versionNumber, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                }
            } else if (typeof versionNumber === 'number' && versionNumber > 0) {
                return versionNumber;
            }
        }
        
        // Extract from current_version_id
        const versionId = std.current_version_id;
        if (versionId) {
            const match = versionId.match(/v(\d+)$/);
            if (match) {
                const parsed = parseInt(match[1], 10);
                if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                }
            }
        }
        return 1;
    };

    useEffect(() => {
        if (!open) return; // Don't run if modal is closed
        
        if (standard) {
            const currentVersion = getVersionNumber(standard);
            form.reset({
                standard_code: standard.standard_code,
                standard_name: standard.standard_name,
                standard_description: standard.standard_description || '',
                mat_aspect_id: standard.mat_aspect_id || '',
                change_reason: `Updating standard (currently v${currentVersion})`,
            });
        } else {
            const nextCode = defaultAspectId ? generateNextStandardCode(defaultAspectId) : '';
            form.reset({
                standard_code: nextCode,
                standard_name: '',
                standard_description: '',
                mat_aspect_id: defaultAspectId || '',
                change_reason: 'Initial version',
            });
        }
    }, [standard, defaultAspectId, generateNextStandardCode, open]);

    // Update code when aspect changes (only for new standards)
    const watchedAspectId = form.watch('mat_aspect_id');
    useEffect(() => {
        if (!standard && watchedAspectId && open) {
            const nextCode = generateNextStandardCode(watchedAspectId);
            form.setValue('standard_code', nextCode);
        }
    }, [watchedAspectId, standard, open, generateNextStandardCode]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Create a standard object from the form values (v3.0)
        const selectedAspect = aspects.find(a => a.mat_aspect_id === values.mat_aspect_id);

        const standardData = {
            ...standard, // Keep existing fields if editing
            mat_standard_id: standard?.mat_standard_id,
            mat_aspect_id: values.mat_aspect_id,
            standard_code: values.standard_code,
            standard_name: values.standard_name,
            standard_description: values.standard_description,
            aspect_code: selectedAspect?.aspect_code,
            aspect_name: selectedAspect?.aspect_name,
            sort_order: standard?.sort_order ?? 0,
            is_custom: standard?.is_custom ?? true,
            is_modified: standard?.is_modified ?? false,
            is_active: true,
            change_reason: values.change_reason, // REQUIRED for versioning
        };

        onSave(standardData);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]" key={standard?.mat_standard_id || 'new'}>
                <DialogHeader>
                    <DialogTitle>{standard ? 'Edit Standard' : 'Create New Standard'}</DialogTitle>
                    <DialogDescription>
                        {standard
                            ? 'Editing this standard will create a new version. In-progress assessments may be affected.'
                            : 'Add a new standard to the assessment framework.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="mat_aspect_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aspect</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value} 
                                            disabled={!!standard}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select aspect" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {aspects.map((aspect) => (
                                                    <SelectItem key={aspect.mat_aspect_id} value={aspect.mat_aspect_id}>
                                                        {aspect.aspect_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="standard_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Standard Code</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="e.g. EDU1" 
                                                {...field} 
                                                disabled={!!standard}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {standard ? 'Cannot change code of existing standard' : 'Auto-generated based on aspect'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="standard_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Strategic Leadership" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="standard_description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Textarea
                                                placeholder="Detailed description of the standard..."
                                                className="min-h-[100px] pr-12"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value.length <= 250) {
                                                        field.onChange(e);
                                                    }
                                                }}
                                            />
                                            <div className={`absolute bottom-2 right-2 text-xs ${(field.value?.length || 0) >= 250 ? 'text-destructive font-medium' : 'text-muted-foreground'
                                                }`}>
                                                {field.value?.length || 0}/250
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="change_reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason for Change {standard && `(creating v${getVersionNumber(standard) + 1})`}</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Textarea
                                                placeholder={standard ? "Describe what changed and why..." : "Initial version"}
                                                className="min-h-[80px] pr-12"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value.length <= 200) {
                                                        field.onChange(e);
                                                    }
                                                }}
                                            />
                                            <div className={`absolute bottom-2 right-2 text-xs ${(field.value?.length || 0) >= 200 ? 'text-destructive font-medium' : 'text-muted-foreground'
                                                }`}>
                                                {field.value?.length || 0}/200
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        {standard ? 'Required - changes create a new version' : 'Document why this standard was created'}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {standard ? 'Save New Version' : 'Create Standard'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
