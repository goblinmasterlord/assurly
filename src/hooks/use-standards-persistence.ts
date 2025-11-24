import { useState, useEffect, useCallback } from 'react';
import { assessmentService } from '@/services/enhanced-assessment-service';
import type { Aspect, Standard } from '@/types/assessment';

// Session storage keys
const ASPECTS_KEY = 'assurly_session_aspects';
const STANDARDS_KEY = 'assurly_session_standards';

// Get initial mock data
const getInitialAspects = (): Aspect[] => [
    { id: '1', code: 'EDU', name: 'Education', description: 'Educational standards', isCustom: false, standardCount: 0 },
    { id: '2', code: 'FIN', name: 'Finance & Procurement', description: 'Financial management', isCustom: false, standardCount: 0 },
    { id: '3', code: 'HR', name: 'Human Resources', description: 'HR management', isCustom: false, standardCount: 0 },
    { id: '4', code: 'GOV', name: 'Governance', description: 'Governance standards', isCustom: false, standardCount: 0 },
];

const getInitialStandards = (): any[] => [
    { id: '1', code: 'EDU-001', title: 'Curriculum Planning', description: 'Standard for curriculum design', category: 'EDU', aspectId: '1', orderIndex: 0, lastUpdated: new Date().toISOString(), versions: [] },
    { id: '2', code: 'EDU-002', title: 'Teaching Quality', description: 'Teaching quality standards', category: 'EDU', aspectId: '1', orderIndex: 1, lastUpdated: new Date().toISOString(), versions: [] },
    { id: '3', code: 'FIN-001', title: 'Budget Management', description: 'Financial budget standards', category: 'FIN', aspectId: '2', orderIndex: 0, lastUpdated: new Date().toISOString(), versions: [] },
];

export function useStandardsPersistence() {
    const [aspects, setAspects] = useState<Aspect[]>([]);
    const [standards, setStandards] = useState<Standard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [useMemoryFallback, setUseMemoryFallback] = useState(false);

    // Load from sessionStorage or initialize
    const loadFromSession = useCallback(() => {
        try {
            const storedAspects = sessionStorage.getItem(ASPECTS_KEY);
            const storedStandards = sessionStorage.getItem(STANDARDS_KEY);
            
            if (storedAspects && storedStandards) {
                setAspects(JSON.parse(storedAspects));
                setStandards(JSON.parse(storedStandards));
                setUseMemoryFallback(true); // Enable memory fallback when loading from session
                return true;
            }
        } catch (err) {
            console.warn('Failed to load from session storage:', err);
        }
        return false;
    }, []);

    // Save to sessionStorage
    const saveToSession = useCallback((newAspects: Aspect[], newStandards: Standard[]) => {
        try {
            sessionStorage.setItem(ASPECTS_KEY, JSON.stringify(newAspects));
            sessionStorage.setItem(STANDARDS_KEY, JSON.stringify(newStandards));
        } catch (err) {
            console.warn('Failed to save to session storage:', err);
        }
    }, []);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // Try loading from session first
            if (loadFromSession()) {
                setIsLoading(false);
                return;
            }

            // Try API call
            try {
                const [fetchedAspects, fetchedStandards] = await Promise.all([
                    assessmentService.getAspects(),
                    assessmentService.getStandards()
                ]);
                setAspects(fetchedAspects);
                setStandards(fetchedStandards);
                saveToSession(fetchedAspects, fetchedStandards);
                setError(null);
            } catch (apiError) {
                console.warn('API unavailable, using memory fallback');
                setUseMemoryFallback(true);
                // Initialize with mock data
                const initialAspects = getInitialAspects();
                const initialStandards = getInitialStandards();
                setAspects(initialAspects);
                setStandards(initialStandards);
                saveToSession(initialAspects, initialStandards);
            }
        } catch (err) {
            console.error('Failed to load standards data:', err);
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [loadFromSession, saveToSession]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addStandard = useCallback(async (standard: any) => {
        try {
            if (useMemoryFallback) {
                // In-memory/session storage mode
                const newStandard: Standard = {
                    ...standard,
                    id: `std-${Date.now()}`,
                    lastUpdated: new Date().toISOString(),
                    versions: []
                };
                const newStandards = [...standards, newStandard];
                setStandards(newStandards);
                saveToSession(aspects, newStandards);
            } else {
                await assessmentService.createStandard(standard);
                await loadData();
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, [useMemoryFallback, standards, aspects, saveToSession, loadData]);

    const updateStandard = useCallback(async (standard: Standard) => {
        try {
            if (useMemoryFallback) {
                const newStandards = standards.map(s => 
                    s.id === standard.id ? { ...standard, lastUpdated: new Date().toISOString() } : s
                );
                setStandards(newStandards);
                saveToSession(aspects, newStandards);
            } else {
                await assessmentService.updateStandardDefinition(standard);
                await loadData();
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, [useMemoryFallback, standards, aspects, saveToSession, loadData]);

    const deleteStandard = useCallback(async (id: string) => {
        try {
            if (useMemoryFallback) {
                const newStandards = standards.filter(s => s.id !== id);
                setStandards(newStandards);
                saveToSession(aspects, newStandards);
            } else {
                await assessmentService.deleteStandard(id);
                await loadData();
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, [useMemoryFallback, standards, aspects, saveToSession, loadData]);

    const reorderStandards = useCallback(async (items: any[]) => {
        // Optimistic update
        const newStandards = [...standards];
        items.forEach(item => {
            const index = newStandards.findIndex(s => s.id === item.id);
            if (index !== -1) {
                newStandards[index] = { ...newStandards[index], ...item };
            }
        });
        const sorted = newStandards.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setStandards(sorted);

        try {
            if (useMemoryFallback) {
                saveToSession(aspects, sorted);
            } else {
                await assessmentService.reorderStandards(items);
            }
        } catch (err) {
            console.error(err);
            await loadData(); // Revert on error
        }
    }, [useMemoryFallback, standards, aspects, saveToSession, loadData]);

    const addAspect = useCallback(async (aspect: any) => {
        try {
            if (useMemoryFallback) {
                const newAspect: Aspect = {
                    ...aspect,
                    id: `asp-${Date.now()}`,
                    standardCount: 0
                };
                const newAspects = [...aspects, newAspect];
                setAspects(newAspects);
                saveToSession(newAspects, standards);
            } else {
                await assessmentService.createAspect(aspect);
                await loadData();
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, [useMemoryFallback, aspects, standards, saveToSession, loadData]);

    const updateAspect = useCallback(async (aspect: Aspect) => {
        try {
            if (useMemoryFallback) {
                const newAspects = aspects.map(a => a.id === aspect.id ? aspect : a);
                setAspects(newAspects);
                saveToSession(newAspects, standards);
            } else {
                await assessmentService.updateAspect(aspect);
                await loadData();
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, [useMemoryFallback, aspects, standards, saveToSession, loadData]);

    const deleteAspect = useCallback(async (id: string) => {
        try {
            if (useMemoryFallback) {
                const newAspects = aspects.filter(a => a.id !== id);
                setAspects(newAspects);
                saveToSession(newAspects, standards);
            } else {
                await assessmentService.deleteAspect(id);
                await loadData();
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, [useMemoryFallback, aspects, standards, saveToSession, loadData]);

    const resetToDefaults = useCallback(() => {
        const initialAspects = getInitialAspects();
        const initialStandards = getInitialStandards();
        setAspects(initialAspects);
        setStandards(initialStandards);
        saveToSession(initialAspects, initialStandards);
    }, [saveToSession]);

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
