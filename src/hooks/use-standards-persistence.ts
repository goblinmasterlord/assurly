import { useState, useEffect } from 'react';
import { MOCK_ASPECTS, MOCK_STANDARDS, type Aspect, type Standard } from '@/lib/mock-standards-data';

const STORAGE_KEY = 'assurly_standards_data';

interface StandardsData {
    aspects: Aspect[];
    standards: Standard[];
}

export function useStandardsPersistence() {
    const [data, setData] = useState<StandardsData>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored standards data', e);
            }
        }
        return {
            aspects: MOCK_ASPECTS,
            standards: MOCK_STANDARDS
        };
    });

    // Save to localStorage whenever data changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    const addStandard = (standard: Standard) => {
        setData(prev => ({
            ...prev,
            standards: [...prev.standards, standard]
        }));
    };

    const updateStandard = (updatedStandard: Standard) => {
        setData(prev => ({
            ...prev,
            standards: prev.standards.map(s => s.id === updatedStandard.id ? updatedStandard : s)
        }));
    };

    const deleteStandard = (id: string) => {
        setData(prev => ({
            ...prev,
            standards: prev.standards.filter(s => s.id !== id)
        }));
    };

    const reorderStandards = (newStandards: Standard[]) => {
        setData(prev => {
            // Create a map of updated standards for O(1) lookup
            const updatedMap = new Map(newStandards.map(s => [s.id, s]));

            // Map over existing standards, replacing those that were reordered
            const mergedStandards = prev.standards.map(s => updatedMap.get(s.id) || s);

            return {
                ...prev,
                standards: mergedStandards
            };
        });
    };

    const addAspect = (aspect: Aspect) => {
        setData(prev => ({
            ...prev,
            aspects: [...prev.aspects, aspect]
        }));
    };

    const updateAspect = (updatedAspect: Aspect) => {
        setData(prev => ({
            ...prev,
            aspects: prev.aspects.map(a => a.id === updatedAspect.id ? updatedAspect : a)
        }));
    };

    const deleteAspect = (id: string) => {
        setData(prev => ({
            ...prev,
            aspects: prev.aspects.filter(a => a.id !== id)
        }));
    };

    const resetToDefaults = () => {
        setData({
            aspects: MOCK_ASPECTS,
            standards: MOCK_STANDARDS
        });
    };

    return {
        aspects: data.aspects,
        standards: data.standards,
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
