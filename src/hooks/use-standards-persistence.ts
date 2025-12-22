import { useState, useEffect, useCallback } from 'react';
import { assessmentService } from '@/services/enhanced-assessment-service';
import type { MatAspect, MatStandard } from '@/types/assessment';
import { useToast } from '@/hooks/use-toast';

export function useStandardsPersistence() {
    const [aspects, setAspects] = useState<MatAspect[]>([]);
    const [standards, setStandards] = useState<MatStandard[]>([]);
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
            // Call API to create standard (v3.0)
            const newStandard = await assessmentService.createStandard({
                mat_aspect_id: standard.mat_aspect_id,
                standard_code: standard.standard_code,
                standard_name: standard.standard_name,
                standard_description: standard.standard_description || '',
                sort_order: standard.sort_order ?? 0,
                source_standard_id: standard.source_standard_id,
                is_custom: standard.is_custom ?? true,
                is_modified: standard.is_modified ?? false,
                aspect_code: standard.aspect_code,
                aspect_name: standard.aspect_name,
                is_active: true,
                change_reason: standard.change_reason || 'Initial version',
            });
            
            // Update local state
            setStandards(prev => [...prev, newStandard]);
            
            // Refresh aspects to update standard counts
            const updatedAspects = await assessmentService.getAspects();
            setAspects(updatedAspects);
            
            toast({
                title: 'Standard created',
                description: `Successfully created standard ${newStandard.standard_code}`,
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

    const updateStandard = useCallback(async (standard: MatStandard & { change_reason: string }) => {
        try {
            // Call API to update standard (v3.0 - creates new version)
            const updatedStandard = await assessmentService.updateStandardDefinition(standard);
            
            // Update local state
            setStandards(prev => prev.map(s => 
                s.mat_standard_id === standard.mat_standard_id ? updatedStandard : s
            ));
            
            toast({
                title: 'Standard updated',
                description: `Successfully updated standard ${updatedStandard.standard_code} (v${updatedStandard.version_number})`,
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
            setStandards(prev => prev.filter(s => s.mat_standard_id !== id));
            
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
            // Prepare reorder data with full standard info (v3.0)
            const reorderData = items.map(item => ({
                id: item.mat_standard_id || item.id,
                orderIndex: item.sort_order ?? item.orderIndex,
                title: item.standard_name || item.title,
                description: item.standard_description || item.description
            }));
            
            // Optimistic update
            setStandards(prev => {
                const newStandards = [...prev];
                items.forEach(item => {
                    const itemId = item.mat_standard_id || item.id;
                    const index = newStandards.findIndex(s => s.mat_standard_id === itemId);
                    if (index !== -1) {
                        newStandards[index] = { 
                            ...newStandards[index], 
                            sort_order: item.sort_order ?? item.orderIndex 
                        };
                    }
                });
                return newStandards.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            });
            
            // Call API to persist reorder
            await assessmentService.reorderStandards(reorderData);
            
            toast({
                title: 'Standards reordered',
                description: `Successfully reordered ${items.length} standard${items.length > 1 ? 's' : ''}`,
            });
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
            // Call API to create aspect (v3.0)
            const newAspect = await assessmentService.createAspect({
                aspect_code: aspect.aspect_code,
                aspect_name: aspect.aspect_name,
                aspect_description: aspect.aspect_description || '',
                sort_order: aspect.sort_order ?? 0,
                source_aspect_id: aspect.source_aspect_id,
                is_custom: aspect.is_custom ?? true,
                is_modified: aspect.is_modified ?? false,
                is_active: true,
            });
            
            // Update local state
            setAspects(prev => [...prev, newAspect]);
            
            toast({
                title: 'Aspect created',
                description: `Successfully created aspect ${newAspect.aspect_name}`,
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

    const updateAspect = useCallback(async (aspect: MatAspect) => {
        try {
            // Call API to update aspect
            const updatedAspect = await assessmentService.updateAspect(aspect);
            
            // Update local state
            setAspects(prev => prev.map(a => 
                a.mat_aspect_id === aspect.mat_aspect_id ? updatedAspect : a
            ));
            
            toast({
                title: 'Aspect updated',
                description: `Successfully updated aspect ${updatedAspect.aspect_name}`,
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
            setAspects(prev => prev.filter(a => a.mat_aspect_id !== id));
            
            // Also remove standards associated with this aspect
            setStandards(prev => prev.filter(s => s.mat_aspect_id !== id));
            
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
