import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Loader2 } from 'lucide-react';
import { type Standard } from '@/types/assessment';
import { getInactiveStandards, reinstateStandard } from '@/services/assessment-service';
import { useToast } from '@/hooks/use-toast';
import { StandardTypeBadge } from '@/components/StandardTypeBadge';

interface InactiveStandardsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReinstated?: () => void;
}

export function InactiveStandardsModal({ open, onOpenChange, onReinstated }: InactiveStandardsModalProps) {
    const [inactiveStandards, setInactiveStandards] = useState<Standard[]>([]);
    const [loading, setLoading] = useState(false);
    const [reinstating, setReinstating] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            loadInactiveStandards();
        }
    }, [open]);

    const loadInactiveStandards = async () => {
        setLoading(true);
        try {
            const standards = await getInactiveStandards();
            setInactiveStandards(standards);
        } catch (error) {
            console.error('Failed to load inactive standards:', error);
            toast({
                variant: 'destructive',
                title: 'Error loading inactive standards',
                description: error instanceof Error ? error.message : 'Failed to load inactive standards',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReinstate = async (matStandardId: string) => {
        setReinstating(matStandardId);
        try {
            await reinstateStandard(matStandardId);
            toast({
                title: 'Standard reinstated',
                description: 'Standard has been successfully reinstated.',
            });
            // Remove from list
            setInactiveStandards(prev => prev.filter(s => s.mat_standard_id !== matStandardId));
            // Notify parent to refresh
            if (onReinstated) {
                onReinstated();
            }
        } catch (error) {
            console.error('Failed to reinstate standard:', error);
            toast({
                variant: 'destructive',
                title: 'Error reinstating standard',
                description: error instanceof Error ? error.message : 'Failed to reinstate standard',
            });
        } finally {
            setReinstating(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Inactive Standards</DialogTitle>
                    <DialogDescription>
                        These default standards have been deactivated. Click "Reinstate" to add them back to your active standards.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : inactiveStandards.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No inactive standards</p>
                            <p className="text-sm mt-2">All deactivated standards will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {inactiveStandards.map((standard) => (
                                <div
                                    key={standard.mat_standard_id}
                                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className="font-mono font-bold">
                                                    {standard.standard_code}
                                                </Badge>
                                                <h3 className="font-semibold truncate">{standard.standard_name}</h3>
                                                {standard.standard_type && (
                                                    <StandardTypeBadge type={standard.standard_type} />
                                                )}
                                            </div>
                                            {standard.standard_description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                    {standard.standard_description}
                                                </p>
                                            )}
                                            <div className="text-xs text-muted-foreground">
                                                Aspect: {standard.aspect_name}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReinstate(standard.mat_standard_id)}
                                            disabled={reinstating === standard.mat_standard_id}
                                            className="flex-shrink-0"
                                        >
                                            {reinstating === standard.mat_standard_id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <RotateCcw className="h-4 w-4 mr-2" />
                                                    Reinstate
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

