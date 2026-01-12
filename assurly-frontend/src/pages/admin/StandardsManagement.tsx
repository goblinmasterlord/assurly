import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreVertical,
    MoreHorizontal,
    Settings,
    History,
    Edit2,
    Trash2,
    GripVertical,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { type Aspect, type Standard } from '@/types/assessment';
import { cn } from '@/lib/utils';
import { CreateStandardModal } from '@/components/admin/standards/CreateStandardModal';
import { CreateAspectModal } from '@/components/admin/standards/CreateAspectModal';
import { DeleteConfirmationModal } from '@/components/admin/standards/DeleteConfirmationModal';
import { VersionHistoryModal } from '@/components/admin/standards/VersionHistoryModal';
import { InactiveStandardsModal } from '@/components/admin/standards/InactiveStandardsModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableStandardCard } from '@/components/admin/standards/SortableStandardCard';
import { AspectCategoryBadge } from '@/components/AspectCategoryBadge';
import { useStandardsPersistence } from '@/hooks/use-standards-persistence';

export default function StandardsManagement() {
    const {
        aspects,
        standards,
        addStandard,
        updateStandard,
        deleteStandard,
        reorderStandards,
        addAspect,
        updateAspect,
        deleteAspect,
        isLoading,
        resetToDefaults
    } = useStandardsPersistence();

    const [selectedAspect, setSelectedAspect] = useState<Aspect | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [aspectCategoryFilter, setAspectCategoryFilter] = useState<'all' | 'ofsted' | 'operational'>('all');
    const [standardTypeFilter, setStandardTypeFilter] = useState<'all' | 'assurance' | 'risk'>('all');
    const [aspectSortBy, setAspectSortBy] = useState<'name' | 'category'>('category');
    const [aspectSortOrder, setAspectSortOrder] = useState<'asc' | 'desc'>('asc');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAspectModalOpen, setIsAspectModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isInactiveStandardsModalOpen, setIsInactiveStandardsModalOpen] = useState(false);
    const [isEditAspectDropdownOpen, setIsEditAspectDropdownOpen] = useState(false);
    const [editingStandard, setEditingStandard] = useState<Standard | undefined>(undefined);
    const [editingAspect, setEditingAspect] = useState<Aspect | undefined>(undefined);
    const [historyStandard, setHistoryStandard] = useState<Standard | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'aspect' | 'standard', id: string, name: string, isCustom?: boolean } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Update selected aspect if it was removed or if aspects changed initially
    // Also update selected aspect with fresh data when aspects are reloaded
    useEffect(() => {
        if (aspects.length > 0 && !selectedAspect) {
            setSelectedAspect(aspects[0]);
        } else if (selectedAspect) {
            const updatedAspect = aspects.find(a => a.mat_aspect_id === selectedAspect.mat_aspect_id);
            if (updatedAspect) {
                // Update selected aspect with fresh data to reflect any changes
                // Only update if key fields changed to avoid unnecessary re-renders
                const hasChanged = 
                    updatedAspect.aspect_name !== selectedAspect.aspect_name ||
                    updatedAspect.aspect_description !== selectedAspect.aspect_description ||
                    updatedAspect.aspect_category !== selectedAspect.aspect_category;
                
                if (hasChanged) {
                    setSelectedAspect(updatedAspect);
                }
            } else {
                // Aspect was deleted, select first available
                setSelectedAspect(aspects[0]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aspects]); // Only depend on aspects to avoid loops, selectedAspect is checked inside

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!selectedAspect && aspects.length > 0) return null; // Wait for effect to set selected aspect

    const currentAspect = selectedAspect || aspects[0]; // Fallback

    // Filter and sort aspects
    const filteredAspects = aspects
        .filter(aspect => {
            if (aspectCategoryFilter === 'all') return true;
            return aspect.aspect_category === aspectCategoryFilter;
        })
        .sort((a, b) => {
            let comparison = 0;
            
            if (aspectSortBy === 'name') {
                comparison = a.aspect_name.localeCompare(b.aspect_name);
            } else if (aspectSortBy === 'category') {
                const categoryA = a.aspect_category || '';
                const categoryB = b.aspect_category || '';
                comparison = categoryA.localeCompare(categoryB);
            }
            
            return aspectSortOrder === 'asc' ? comparison : -comparison;
        });

    // Filter standards by aspect, search, and type
    const filteredStandards = currentAspect
        ? standards
            .filter(s => s.mat_aspect_id === currentAspect.mat_aspect_id)
            .filter(s =>
                s.standard_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.standard_code.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .filter(s => {
                if (standardTypeFilter === 'all') return true;
                return s.standard_type === standardTypeFilter;
            })
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        : [];



    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = standards.findIndex((item) => item.mat_standard_id === active.id);
            const newIndex = standards.findIndex((item) => item.mat_standard_id === over?.id);

            // Reorder within the filtered view
            const newFiltered = arrayMove(filteredStandards,
                filteredStandards.findIndex(s => s.mat_standard_id === active.id),
                filteredStandards.findIndex(s => s.mat_standard_id === over?.id)
            );

            // Update sort_order for these items
            const updatedStandards = newFiltered.map((item, index) => ({
                ...item,
                sort_order: index
            }));

            reorderStandards(updatedStandards);
        }
    };

    const handleEdit = (standard: Standard) => {
        console.log('[StandardsManagement] Editing standard:', {
            mat_standard_id: standard.mat_standard_id,
            standard_code: standard.standard_code,
            standard_name: standard.standard_name,
            is_custom: standard.is_custom
        });
        setEditingStandard(standard);
        setIsCreateModalOpen(true);
    };

    const handleCreate = () => {
        setEditingStandard(undefined);
        setIsCreateModalOpen(true);
    };

    const handleHistory = (standard: Standard) => {
        setHistoryStandard(standard);
        setIsHistoryModalOpen(true);
    };

    const handleSaveStandard = async (standard: Standard) => {
        try {
            if (editingStandard) {
                // CRITICAL: Use editingStandard.mat_standard_id as the source of truth
                const matStandardId = editingStandard.mat_standard_id || standard.mat_standard_id;
                
                console.log('[StandardsManagement] Saving standard update:', {
                    editingStandard_id: editingStandard.mat_standard_id,
                    standard_id: standard.mat_standard_id,
                    using_id: matStandardId,
                    standard_name: standard.standard_name
                });
                
                if (!matStandardId) {
                    console.error('[StandardsManagement] No mat_standard_id found!', {
                        editingStandard,
                        standard
                    });
                    throw new Error('Standard ID is required for editing. Please refresh the page and try again.');
                }
                
                await updateStandard({
                    mat_standard_id: matStandardId,
                    standard_name: standard.standard_name,
                    standard_description: standard.standard_description,
                    standard_type: standard.standard_type,
                    change_reason: (standard as any).change_reason || 'Updated standard',
                });
            } else {
                // Get all standards for this aspect to calculate next sort_order
                const aspectStandards = standards.filter(s => 
                    s.mat_aspect_id === currentAspect.mat_aspect_id
                );
                
                // Find the highest sort_order and add 1 to put new standard at bottom
                const maxSortOrder = aspectStandards.length > 0 
                    ? Math.max(...aspectStandards.map(s => s.sort_order || 0))
                    : -1;
                
                const standardWithAspect = {
                    ...standard,
                    mat_aspect_id: standard.mat_aspect_id || currentAspect.mat_aspect_id,
                    sort_order: maxSortOrder + 1
                };
                await addStandard(standardWithAspect);
            }
            setIsCreateModalOpen(false);
            setEditingStandard(undefined);
        } catch (error) {
            // Error is already handled by the hook with toast
            console.error('Error saving standard:', error);
        }
    };

    const handleSaveAspect = async (aspect: Aspect) => {
        try {
            if (editingAspect) {
                await updateAspect(aspect);
                // Update selected aspect if it was the one being edited
                if (currentAspect.mat_aspect_id === aspect.mat_aspect_id) {
                    // The hook will reload aspects, but we need to update the selected aspect
                    // Wait a bit for the hook to finish reloading, then update selection
                    setTimeout(() => {
                        const updatedAspect = aspects.find(a => a.mat_aspect_id === aspect.mat_aspect_id);
                        if (updatedAspect) {
                            setSelectedAspect(updatedAspect);
                        }
                    }, 100);
                }
            } else {
                await addAspect(aspect);
            }
            setEditingAspect(undefined);
            setIsAspectModalOpen(false);
        } catch (error) {
            // Error is already handled by the hook with toast
            console.error('Error saving aspect:', error);
        }
    };

    const handleEditAspect = (aspect: Aspect) => {
        setEditingAspect(aspect);
        setIsAspectModalOpen(true);
    };
    
    const handleAspectModalClose = (open: boolean) => {
        setIsAspectModalOpen(open);
        if (!open) {
            setEditingAspect(undefined);
        }
    };

    const handleDeleteAspect = (id: string) => {
        const aspectToDelete = aspects.find(a => a.mat_aspect_id === id);
        if (aspectToDelete) {
            setItemToDelete({ 
                type: 'aspect', 
                id, 
                name: aspectToDelete.aspect_name,
                isCustom: aspectToDelete.is_custom
            });
            setDeleteModalOpen(true);
        }
    };

    const handleCreateAspect = () => {
        setEditingAspect(undefined);
        setIsAspectModalOpen(true);
    };

    const handleDeleteStandard = (id: string) => {
        const standardToDelete = standards.find(s => s.mat_standard_id === id);
        if (standardToDelete) {
            setItemToDelete({ 
                type: 'standard', 
                id, 
                name: standardToDelete.standard_code,
                isCustom: standardToDelete.is_custom
            });
            setDeleteModalOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'aspect') {
                await deleteAspect(itemToDelete.id);
                if (currentAspect.mat_aspect_id === itemToDelete.id) {
                    setSelectedAspect(aspects[0]);
                }
            } else {
                await deleteStandard(itemToDelete.id);
            }
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            // Error is already handled by the hook with toast
            console.error('Error deleting item:', error);
            // Keep modal open so user can see the error and try again
        }
    };

    if (!currentAspect) {
        return (
            <div className="container mx-auto py-6 max-w-7xl h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
                <div className="text-center">
                    <h3 className="text-lg font-medium">No aspects found</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                        Get started by creating your first aspect.
                    </p>
                    <Button onClick={() => setIsAspectModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Aspect
                    </Button>
                </div>
                <CreateAspectModal
                    key={editingAspect?.id || 'new'}
                    open={isAspectModalOpen}
                    onOpenChange={handleAspectModalClose}
                    onSave={handleSaveAspect}
                    aspect={editingAspect}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Standards Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage assessment criteria, versions, and custom aspects.
                    </p>
                </div>
                <div className="flex gap-3">
                    <DropdownMenu open={isEditAspectDropdownOpen} onOpenChange={setIsEditAspectDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" title="Options">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAspect(currentAspect);
                                    setIsEditAspectDropdownOpen(false);
                                }}
                            >
                                <Edit2 className="mr-2 h-3 w-3" />
                                Edit {currentAspect.aspect_name}
                            </DropdownMenuItem>
                            {currentAspect.is_custom && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAspect(currentAspect.mat_aspect_id);
                                        setIsEditAspectDropdownOpen(false);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Delete Aspect
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                        variant="outline" 
                        size="icon"
                        title="View Inactive Standards"
                        onClick={() => setIsInactiveStandardsModalOpen(true)}
                    >
                        <History className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Standard
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar - Aspects */}
                <Card className="w-80 flex-shrink-0 flex flex-col h-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Aspects</CardTitle>
                        <CardDescription>Select an area to manage</CardDescription>
                    </CardHeader>
                    <div className="px-4 pb-2 space-y-2">
                        <Select value={aspectCategoryFilter} onValueChange={(value) => setAspectCategoryFilter(value as 'all' | 'ofsted' | 'operational')}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="ofsted">Ofsted Only</SelectItem>
                                <SelectItem value="operational">Operational Only</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={`${aspectSortBy}-${aspectSortOrder}`} onValueChange={(value) => {
                            const [sortBy, sortOrder] = value.split('-') as ['name' | 'category', 'asc' | 'desc'];
                            setAspectSortBy(sortBy);
                            setAspectSortOrder(sortOrder);
                        }}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                                <SelectItem value="category-desc">Category (Z-A)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-xs h-8"
                            onClick={handleCreateAspect}
                        >
                            <Plus className="mr-2 h-3 w-3" />
                            Add Custom Aspect
                        </Button>
                    </div>
                    <Separator />
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {filteredAspects.map((aspect) => {
                                const count = standards.filter(s => s.mat_aspect_id === aspect.mat_aspect_id).length;
                                return (
                                    <button
                                        key={aspect.mat_aspect_id}
                                        onClick={() => setSelectedAspect(aspect)}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex flex-col gap-1.5 group min-w-0",
                                            currentAspect.mat_aspect_id === aspect.mat_aspect_id
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 w-full min-w-0">
                                            <span className="truncate flex-1 min-w-0">{aspect.aspect_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 w-full flex-wrap min-w-0">
                                            <span className="text-[10px] text-muted-foreground font-normal whitespace-nowrap">
                                                {count} standard{count !== 1 ? 's' : ''}
                                            </span>
                                            {aspect.aspect_category && (
                                                <AspectCategoryBadge category={aspect.aspect_category} className="text-[10px] h-5 px-1.5 py-0.5 flex-shrink-0" />
                                            )}
                                            {aspect.is_custom ? (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 py-0.5 flex-shrink-0">Custom</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0.5 text-muted-foreground flex-shrink-0">Default</Badge>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Main Content - Standards List */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Aspect Overview Section */}
                    {currentAspect && (
                        <Card className="mb-4">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-xl font-semibold">{currentAspect.aspect_name}</h2>
                                            {currentAspect.aspect_category && (
                                                <AspectCategoryBadge category={currentAspect.aspect_category} />
                                            )}
                                        </div>
                                        {currentAspect.aspect_description && (
                                            <p className="text-sm text-muted-foreground">
                                                {currentAspect.aspect_description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    <div className="mb-4 flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search ${currentAspect.aspect_name} standards...`}
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={standardTypeFilter} onValueChange={(value) => setStandardTypeFilter(value as 'all' | 'assurance' | 'risk')}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="assurance">Assurance Only</SelectItem>
                                <SelectItem value="risk">Risk Only</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{filteredStandards.length}</span> standards
                        </div>
                    </div>

                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4 pb-10">
                            {filteredStandards.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                    <div className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3">
                                        <FileText className="h-full w-full" />
                                    </div>
                                    <h3 className="text-lg font-medium">No standards found</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                                        No standards match your search in {currentAspect.aspect_name}.
                                    </p>
                                    <Button variant="outline" className="mt-4" onClick={handleCreate}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Standard
                                    </Button>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={filteredStandards.map(s => s.mat_standard_id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {filteredStandards.map((standard) => (
                                            <SortableStandardCard
                                                key={standard.mat_standard_id}
                                                standard={standard}
                                                onEdit={handleEdit}
                                                onHistory={handleHistory}
                                                onDelete={handleDeleteStandard}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <CreateStandardModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSave={handleSaveStandard}
                standard={editingStandard}
                defaultAspectId={currentAspect.mat_aspect_id}
                aspects={aspects}
                allStandards={standards}
            />

            <CreateAspectModal
                key={editingAspect?.mat_aspect_id || 'new'}
                open={isAspectModalOpen}
                onOpenChange={handleAspectModalClose}
                onSave={handleSaveAspect}
                aspect={editingAspect}
            />

            <VersionHistoryModal
                open={isHistoryModalOpen}
                onOpenChange={setIsHistoryModalOpen}
                standard={historyStandard}
            />

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                onConfirm={handleConfirmDelete}
                title={itemToDelete?.type === 'aspect' ? 'Delete Aspect' : 'Delete Standard'}
                description={itemToDelete?.type === 'aspect'
                    ? 'Are you sure you want to delete this aspect? All associated standards will be hidden.'
                    : 'Are you sure you want to delete this standard? This action cannot be undone.'}
                itemName={itemToDelete?.name}
                isCustom={itemToDelete?.isCustom}
                itemType={itemToDelete?.type}
            />

            <InactiveStandardsModal
                open={isInactiveStandardsModalOpen}
                onOpenChange={setIsInactiveStandardsModalOpen}
                onReinstated={async () => {
                    // Refresh standards and aspects list
                    await resetToDefaults();
                }}
            />
        </div>
    );
}
