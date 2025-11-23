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
import { type Standard } from '@/lib/mock-standards-data';
import { useEffect } from 'react';

const formSchema = z.object({
    code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must be less than 10 characters'),
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters').max(250, 'Description must be less than 250 characters'),
    category: z.string().min(1, 'Please select a category'),
});

import { type Aspect } from '@/lib/mock-standards-data';

interface CreateStandardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => void;
    standard?: Standard; // If provided, we are in edit mode
    defaultCategory?: string;
    aspects: Aspect[];
}

export function CreateStandardModal({ open, onOpenChange, onSave, standard, defaultCategory, aspects }: CreateStandardModalProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: '',
            title: '',
            description: '',
            category: defaultCategory || '',
        },
    });

    useEffect(() => {
        if (standard) {
            form.reset({
                code: standard.code,
                title: standard.title,
                description: standard.description,
                category: standard.category,
            });
        } else {
            form.reset({
                code: '',
                title: '',
                description: '',
                category: defaultCategory || '',
            });
        }
    }, [standard, defaultCategory, form]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Create a standard object from the form values
        const standardData = {
            ...standard, // Keep existing ID and other fields if editing
            id: standard?.id || `std-${Date.now()}`,
            code: values.code,
            title: values.title,
            description: values.description,
            category: values.category,
            version: standard ? standard.version + 1 : 1,
            status: standard?.status || 'active',
            lastModified: new Date().toISOString(),
            lastModifiedBy: 'Current User', // In a real app, get from auth context
            versions: standard?.versions || []
        };

        onSave(standardData);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
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
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aspect</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!standard}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select aspect" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {aspects.map((aspect) => (
                                                    <SelectItem key={aspect.id} value={aspect.code}>
                                                        {aspect.name}
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
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Standard Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. LDR1" {...field} />
                                        </FormControl>
                                        <FormDescription>Unique identifier</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="title"
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Textarea
                                                placeholder="Detailed description of the standard..."
                                                className="min-h-[100px] pr-12"
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value.length <= 250) {
                                                        field.onChange(e);
                                                    }
                                                }}
                                            />
                                            <div className={`absolute bottom-2 right-2 text-xs ${field.value.length >= 250 ? 'text-destructive font-medium' : 'text-muted-foreground'
                                                }`}>
                                                {field.value.length}/250
                                            </div>
                                        </div>
                                    </FormControl>
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
