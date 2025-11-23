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
import { type Aspect } from '@/types/assessment';

const formSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must be less than 10 characters'),
    description: z.string().optional(),
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
            name: '',
            code: '',
            description: '',
        },
    });

    // Reset form when opening/closing or changing aspect
    useEffect(() => {
        if (open) {
            if (aspect) {
                form.reset({
                    name: aspect.name,
                    code: aspect.code.toUpperCase(),
                    description: aspect.description,
                });
            } else {
                form.reset({
                    name: '',
                    code: '',
                    description: '',
                });
            }
        }
    }, [open, aspect, form]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        const aspectData = {
            id: aspect?.id || `custom-${values.code.toLowerCase()}`,
            code: values.code.toLowerCase(),
            name: values.name,
            description: values.description || '',
            isCustom: aspect ? aspect.isCustom : true,
            standardCount: aspect ? aspect.standardCount : 0
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
                            name="name"
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
                            name="code"
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
                            name="description"
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
