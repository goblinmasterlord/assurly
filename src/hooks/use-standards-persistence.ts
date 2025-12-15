import { useState, useEffect, useCallback } from 'react';
import { assessmentService } from '@/services/enhanced-assessment-service';
import type { Aspect, Standard } from '@/types/assessment';
import { useToast } from '@/hooks/use-toast';

export function useStandardsPersistence() {
    const [aspects, setAspects] = useState<Aspect[]>([]);
    const [standards, setStandards] = useState<Standard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            console.log('Fetching aspects and standards from API...');
            
            const [fetchedAspects, fetchedStandards] = await Promise.all([
                assessmentService.getAspects(),
                assessmentService.getStandards()
            ]);
            
            console.log(`Loaded ${fetchedAspects.length} aspects and ${fetchedStandards.length} standards from API`);
            setAspects(fetchedAspects);
            setStandards(fetchedStandards);
            setError(null);
        } catch (err) {
            console.error('Failed to load standards data:', err);
            setError('Failed to load data from API');
            toast({
                variant: 'destructive',
                title: 'Error loading data',
                description: 'Failed to load aspects and standards. Please refresh the page.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addStandard = useCallback(async (standard: any) => {
        try {
            // Call API to create standard
            const newStandard = await assessmentService.createStandard({
                code: standard.code,
                title: standard.title,
                description: standard.description || '',
                aspectId: standard.aspectId,
                orderIndex: standard.orderIndex,
                rating: null,
            });
            
            // Update local state
            setStandards(prev => [...prev, newStandard]);
            
            // Refresh aspects to update standard counts
            const updatedAspects = await assessmentService.getAspects();
            setAspects(updatedAspects);
            
            toast({
                title: 'Standard created',
                description: `Successfully created standard ${newStandard.code}`,
            });
        } catch (err) {
            console.error('Failed to create standard:', err);
            toast({
                variant: 'destructive',
                title: 'Error creating standard',
                description: err instanceof Error ? err.message : 'Failed to create standard',
            });
            throw err;
        }
    }, [toast]);

    const updateStandard = useCallback(async (standard: Standard) => {
        try {
            // Call API to update standard
            const updatedStandard = await assessmentService.updateStandardDefinition(standard);
            
            // Update local state
            setStandards(prev => prev.map(s => 
                s.id === standard.id ? updatedStandard : s
            ));
            
            toast({
                title: 'Standard updated',
                description: `Successfully updated standard ${updatedStandard.code}`,
            });
        } catch (err) {
            console.error('Failed to update standard:', err);
            toast({
                variant: 'destructive',
                title: 'Error updating standard',
                description: err instanceof Error ? err.message : 'Failed to update standard',
            });
            throw err;
        }
    }, [toast]);

    const deleteStandard = useCallback(async (id: string) => {
        try {
            // Call API to delete standard
            await assessmentService.deleteStandard(id);
            
            // Update local state
            setStandards(prev => prev.filter(s => s.id !== id));
            
            // Refresh aspects to update standard counts
            const updatedAspects = await assessmentService.getAspects();
            setAspects(updatedAspects);
            
            toast({
                title: 'Standard deleted',
                description: 'Successfully deleted standard',
            });
        } catch (err) {
            console.error('Failed to delete standard:', err);
            toast({
                variant: 'destructive',
                title: 'Error deleting standard',
                description: err instanceof Error ? err.message : 'Failed to delete standard. It may be in use by assessments.',
            });
            throw err;
        }
    }, [toast]);

    const reorderStandards = useCallback(async (items: any[]) => {
        try {
            // Prepare reorder data
            const reorderData = items.map(item => ({
                id: item.id,
                orderIndex: item.orderIndex
            }));
            
            // Optimistic update
            setStandards(prev => {
                const newStandards = [...prev];
                items.forEach(item => {
                    const index = newStandards.findIndex(s => s.id === item.id);
                    if (index !== -1) {
                        newStandards[index] = { ...newStandards[index], ...item };
                    }
                });
                return newStandards.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            });
            
            // Call API to persist reorder
            await assessmentService.reorderStandards(reorderData);
        } catch (err) {
            console.error('Failed to reorder standards:', err);
            // Reload data on failure to revert optimistic update
            await loadData();
            toast({
                variant: 'destructive',
                title: 'Error reordering standards',
                description: err instanceof Error ? err.message : 'Failed to reorder standards',
            });
            throw err;
        }
    }, [loadData, toast]);

    const addAspect = useCallback(async (aspect: any) => {
        try {
            // Call API to create aspect
            const newAspect = await assessmentService.createAspect({
                code: aspect.code,
                name: aspect.name,
                description: aspect.description || '',
                isCustom: aspect.isCustom !== false, // Default to true for new aspects
            });
            
            // Update local state
            setAspects(prev => [...prev, newAspect]);
            
            toast({
                title: 'Aspect created',
                description: `Successfully created aspect ${newAspect.name}`,
            });
        } catch (err) {
            console.error('Failed to create aspect:', err);
            toast({
                variant: 'destructive',
                title: 'Error creating aspect',
                description: err instanceof Error ? err.message : 'Failed to create aspect',
            });
            throw err;
        }
    }, [toast]);

    const updateAspect = useCallback(async (aspect: Aspect) => {
        try {
            // Call API to update aspect
            const updatedAspect = await assessmentService.updateAspect(aspect);
            
            // Update local state
            setAspects(prev => prev.map(a => 
                a.id === aspect.id ? updatedAspect : a
            ));
            
            toast({
                title: 'Aspect updated',
                description: `Successfully updated aspect ${updatedAspect.name}`,
            });
        } catch (err) {
            console.error('Failed to update aspect:', err);
            toast({
                variant: 'destructive',
                title: 'Error updating aspect',
                description: err instanceof Error ? err.message : 'Failed to update aspect',
            });
            throw err;
        }
    }, [toast]);

    const deleteAspect = useCallback(async (id: string) => {
        try {
            // Call API to delete aspect
            await assessmentService.deleteAspect(id);
            
            // Update local state
            setAspects(prev => prev.filter(a => a.id !== id));
            
            // Also remove standards associated with this aspect
            setStandards(prev => prev.filter(s => s.aspectId !== id));
            
            toast({
                title: 'Aspect deleted',
                description: 'Successfully deleted aspect',
            });
        } catch (err) {
            console.error('Failed to delete aspect:', err);
            toast({
                variant: 'destructive',
                title: 'Error deleting aspect',
                description: err instanceof Error ? err.message : 'Failed to delete aspect. It may have associated standards.',
            });
            throw err;
        }
    }, [toast]);

    const resetToDefaults = useCallback(async () => {
        // Reload data from API
        await loadData();
        toast({
            title: 'Data refreshed',
            description: 'Successfully reloaded aspects and standards',
        });
    }, [loadData, toast]);

    return {
        aspects,
        standards,
        isLoading,
        error,
        addStandard,
        updateStandard,
        deleteStandard,
        reorderStandards,
        addAspect,
        updateAspect,
        deleteAspect,
        resetToDefaults
    };
}
