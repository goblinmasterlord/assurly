// ============================================================================
// v4.0 Standards Persistence Hook
// ============================================================================

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
            console.log('[useStandardsPersistence] Fetching aspects and standards...');
            
            const [fetchedAspects, fetchedStandards] = await Promise.all([
                assessmentService.getAspects(),
                assessmentService.getStandards()
            ]);
            
            console.log(`[useStandardsPersistence] Loaded ${fetchedAspects.length} aspects, ${fetchedStandards.length} standards`);
            setAspects(fetchedAspects);
            setStandards(fetchedStandards);
            setError(null);
        } catch (err) {
            console.error('[useStandardsPersistence] Failed to load data:', err);
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

    const addStandard = useCallback(async (standard: {
        mat_aspect_id: string;
        standard_code: string;
        standard_name: string;
        standard_description: string;
        standard_type?: 'assurance' | 'risk';
        sort_order: number;
    }) => {
        try {
            console.log('[useStandardsPersistence] Creating standard:', standard);
            
            const newStandard = await assessmentService.createStandard({
                mat_aspect_id: standard.mat_aspect_id,
                standard_code: standard.standard_code,
                standard_name: standard.standard_name,
                standard_description: standard.standard_description || '',
                ...(standard.standard_type && { standard_type: standard.standard_type }),
                sort_order: standard.sort_order ?? 0,
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
            
            return newStandard;
        } catch (err) {
            console.error('[useStandardsPersistence] Failed to create standard:', err);
            toast({
                variant: 'destructive',
                title: 'Error creating standard',
                description: err instanceof Error ? err.message : 'Failed to create standard',
            });
            throw err;
        }
    }, [toast]);

    const updateStandard = useCallback(async (standard: {
        mat_standard_id: string;
        standard_name: string;
        standard_description: string;
        standard_type?: 'assurance' | 'risk';
        change_reason?: string;
    }) => {
        try {
            console.log('[useStandardsPersistence] Updating standard:', {
                mat_standard_id: standard.mat_standard_id,
                standard_name: standard.standard_name,
                has_standard_type: !!standard.standard_type,
                change_reason: standard.change_reason
            });
            
            // Validate mat_standard_id is present
            if (!standard.mat_standard_id) {
                console.error('[useStandardsPersistence] Missing mat_standard_id!', standard);
                throw new Error('Standard ID (mat_standard_id) is required for updating');
            }
            
            const requestBody = {
                standard_name: standard.standard_name,
                standard_description: standard.standard_description,
                ...(standard.standard_type && { standard_type: standard.standard_type }),
                change_reason: standard.change_reason || 'Updated standard',
            };
            
            console.log('[useStandardsPersistence] API call:', {
                url: `/api/standards/${standard.mat_standard_id}`,
                body: requestBody
            });
            
            await assessmentService.updateStandard(
                standard.mat_standard_id,
                requestBody
            );
            
            // Reload standards to get updated version info
            const updatedStandards = await assessmentService.getStandards();
            setStandards(updatedStandards);
            
            toast({
                title: 'Standard updated',
                description: `Successfully updated standard ${standard.mat_standard_id}`,
            });
        } catch (err) {
            console.error('[useStandardsPersistence] Failed to update standard:', err);
            toast({
                variant: 'destructive',
                title: 'Error updating standard',
                description: err instanceof Error ? err.message : 'Failed to update standard',
            });
            throw err;
        }
    }, [toast]);

    const deleteStandard = useCallback(async (matStandardId: string) => {
        try {
            console.log('[useStandardsPersistence] Deleting standard:', matStandardId);
            
            const result = await assessmentService.deleteStandard(matStandardId);
            
            // Update local state
            setStandards(prev => prev.filter(s => s.mat_standard_id !== matStandardId));
            
            // Refresh aspects to update standard counts
            const updatedAspects = await assessmentService.getAspects();
            setAspects(updatedAspects);
            
            if (result.can_reinstate) {
                toast({
                    title: 'Standard deactivated',
                    description: 'Standard has been deactivated. You can reinstate it later from the inactive standards section.',
                });
            } else {
                toast({
                    title: 'Standard archived',
                    description: 'Standard has been permanently archived.',
                });
            }
            
            return result;
        } catch (err) {
            console.error('[useStandardsPersistence] Failed to delete standard:', err);
            toast({
                variant: 'destructive',
                title: 'Error deleting standard',
                description: err instanceof Error ? err.message : 'Failed to delete standard. It may be in use by assessments.',
            });
            throw err;
        }
    }, [toast]);

    const reorderStandards = useCallback(async (items: Array<{
        mat_standard_id: string;
        sort_order: number;
    }>) => {
        try {
            console.log('[useStandardsPersistence] Reordering standards:', items);
            
            // Optimistic update
            setStandards(prev => {
                const newStandards = [...prev];
                items.forEach(item => {
                    const index = newStandards.findIndex(s => s.mat_standard_id === item.mat_standard_id);
                    if (index !== -1) {
                        newStandards[index] = { 
                            ...newStandards[index], 
                            sort_order: item.sort_order
                        };
                    }
                });
                return newStandards.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            });
            
            // Call API to persist reorder
            await assessmentService.reorderStandards(items);
            
            toast({
                title: 'Standards reordered',
                description: `Successfully reordered ${items.length} standard${items.length > 1 ? 's' : ''}`,
            });
        } catch (err) {
            console.error('[useStandardsPersistence] Failed to reorder standards:', err);
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

    const addAspect = useCallback(async (aspect: {
        aspect_code: string;
        aspect_name: string;
        aspect_description: string;
        aspect_category?: 'ofsted' | 'operational';
        sort_order: number;
    }) => {
        try {
            console.log('[useStandardsPersistence] Creating aspect:', aspect);
            
            const newAspect = await assessmentService.createAspect({
                aspect_code: aspect.aspect_code,
                aspect_name: aspect.aspect_name,
                aspect_description: aspect.aspect_description || '',
                ...(aspect.aspect_category && { aspect_category: aspect.aspect_category }),
                sort_order: aspect.sort_order ?? 0,
            });
            
            // Update local state
            setAspects(prev => [...prev, newAspect]);
            
            toast({
                title: 'Aspect created',
                description: `Successfully created aspect ${newAspect.aspect_name}`,
            });
            
            return newAspect;
        } catch (err) {
            console.error('[useStandardsPersistence] Failed to create aspect:', err);
            toast({
                variant: 'destructive',
                title: 'Error creating aspect',
                description: err instanceof Error ? err.message : 'Failed to create aspect',
            });
            throw err;
        }
    }, [toast]);

    const updateAspect = useCallback(async (aspect: {
        mat_aspect_id: string;
        aspect_name: string;
        aspect_description: string;
        aspect_category?: 'ofsted' | 'operational';
        sort_order: number;
    }) => {
        try {
            console.log('[useStandardsPersistence] Updating aspect:', aspect);
            
            await assessmentService.updateAspect(
                aspect.mat_aspect_id,
                {
                    aspect_name: aspect.aspect_name,
                    aspect_description: aspect.aspect_description,
                    ...(aspect.aspect_category && { aspect_category: aspect.aspect_category }),
                    sort_order: aspect.sort_order,
                }
            );
            
            // Reload aspects
            const updatedAspects = await assessmentService.getAspects();
            setAspects(updatedAspects);
            
            toast({
                title: 'Aspect updated',
                description: `Successfully updated aspect ${aspect.aspect_name}`,
            });
        } catch (err) {
            console.error('[useStandardsPersistence] Failed to update aspect:', err);
            toast({
                variant: 'destructive',
                title: 'Error updating aspect',
                description: err instanceof Error ? err.message : 'Failed to update aspect',
            });
            throw err;
        }
    }, [toast]);

    const deleteAspect = useCallback(async (matAspectId: string) => {
        try {
            console.log('[useStandardsPersistence] Deleting aspect:', matAspectId);
            
            const result = await assessmentService.deleteAspect(matAspectId);
            
            // Update local state
            setAspects(prev => prev.filter(a => a.mat_aspect_id !== matAspectId));
            
            // Also remove standards associated with this aspect
            setStandards(prev => prev.filter(s => s.mat_aspect_id !== matAspectId));
            
            if (result.can_reinstate) {
                toast({
                    title: 'Aspect deactivated',
                    description: 'Aspect has been deactivated. You can reinstate it later from the inactive aspects section.',
                });
            } else {
                toast({
                    title: 'Aspect archived',
                    description: 'Aspect has been permanently archived.',
                });
            }
            
            return result;
        } catch (err) {
            console.error('[useStandardsPersistence] Failed to delete aspect:', err);
            toast({
                variant: 'destructive',
                title: 'Error deleting aspect',
                description: err instanceof Error ? err.message : 'Failed to delete aspect. It may have associated standards.',
            });
            throw err;
        }
    }, [toast]);

    const resetToDefaults = useCallback(async () => {
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
