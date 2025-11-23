import { useState, useEffect, useCallback } from 'react';
import { assessmentService } from '@/services/enhanced-assessment-service';
import type { Aspect, Standard } from '@/types/assessment';

export function useStandardsPersistence() {
    const [aspects, setAspects] = useState<Aspect[]>([]);
    const [standards, setStandards] = useState<Standard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [fetchedAspects, fetchedStandards] = await Promise.all([
                assessmentService.getAspects(),
                assessmentService.getStandards()
            ]);
            setAspects(fetchedAspects);
            setStandards(fetchedStandards);
            setError(null);
        } catch (err) {
            console.error('Failed to load standards data:', err);
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addStandard = async (standard: any) => {
        try {
            await assessmentService.createStandard(standard);
            loadData(); // Reload to get updated list and IDs
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateStandard = async (standard: Standard) => {
        try {
            await assessmentService.updateStandardDefinition(standard);
            loadData();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteStandard = async (id: string) => {
        try {
            await assessmentService.deleteStandard(id);
            loadData();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const reorderStandards = async (items: any[]) => {
        // Optimistic update
        setStandards(prev => {
            const newStandards = [...prev];
            items.forEach(item => {
                const index = newStandards.findIndex(s => s.id === item.id);
                if (index !== -1) {
                    newStandards[index] = { ...newStandards[index], ...item }; // Update orderIndex
                }
            });
            return newStandards.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        });

        try {
            await assessmentService.reorderStandards(items);
        } catch (err) {
            console.error(err);
            loadData(); // Revert on error
        }
    };

    const addAspect = async (aspect: any) => {
        try {
            await assessmentService.createAspect(aspect);
            loadData();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateAspect = async (aspect: Aspect) => {
        try {
            await assessmentService.updateAspect(aspect);
            loadData();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteAspect = async (id: string) => {
        try {
            await assessmentService.deleteAspect(id);
            loadData();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const resetToDefaults = () => {
        console.warn('Reset to defaults not supported in API mode');
    };

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
