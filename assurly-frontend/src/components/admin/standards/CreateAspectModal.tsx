import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Aspect } from '@/types/assessment';

const formSchema = z.object({
    aspect_name: z.string().min(3, 'Name must be at least 3 characters'),
    aspect_code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must be less than 10 characters'),
    aspect_description: z.string().optional(),
    aspect_category: z.enum(['ofsted', 'operational']).optional(),
});

interface CreateAspectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => void;
    aspect?: Aspect;
}

export function CreateAspectModal({ open, onOpenChange, onSave, aspect }: CreateAspectModalProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            aspect_name: '',
            aspect_code: '',
            aspect_description: '',
            aspect_category: 'operational' as const,
        },
    });

    // Reset form when opening/closing or changing aspect
    useEffect(() => {
        if (open) {
            if (aspect) {
                form.reset({
                    aspect_name: aspect.aspect_name,
                    aspect_code: aspect.aspect_code.toUpperCase(),
                    aspect_description: aspect.aspect_description || '',
                    aspect_category: aspect.aspect_category || 'operational',
                });
            } else {
                form.reset({
                    aspect_name: '',
                    aspect_code: '',
                    aspect_description: '',
                    aspect_category: 'operational' as const,
                });
            }
        }
    }, [open, aspect, form]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        const aspectData = {
            mat_aspect_id: aspect?.mat_aspect_id,
            aspect_code: values.aspect_code.toLowerCase(),
            aspect_name: values.aspect_name,
            aspect_description: values.aspect_description || '',
            aspect_category: values.aspect_category || 'operational',
            sort_order: aspect?.sort_order ?? 0,
            is_custom: aspect ? aspect.is_custom : true,
            is_modified: aspect ? aspect.is_modified : false,
            is_active: true,
            standards_count: aspect ? aspect.standards_count : 0
        };

        onSave(aspectData);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{aspect ? 'Edit Aspect' : 'Create Custom Aspect'}</DialogTitle>
                    <DialogDescription>
                        {aspect
                            ? 'Update the details of this assessment area.'
                            : 'Add a new area for assessment. This will be available for all schools in the trust.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="aspect_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Aspect Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Sustainability" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="aspect_code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. SUSTAIN" {...field} disabled={!!aspect} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="aspect_description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief description of this aspect..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="aspect_category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value || 'operational'}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ofsted">Ofsted</SelectItem>
                                            <SelectItem value="operational">Operational</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {aspect ? 'Save Changes' : 'Create Aspect'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
