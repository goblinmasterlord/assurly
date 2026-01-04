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
import { type Aspect, type Standard } from '@/types/assessment';
import { cn } from '@/lib/utils';
import { CreateStandardModal } from '@/components/admin/standards/CreateStandardModal';
import { CreateAspectModal } from '@/components/admin/standards/CreateAspectModal';
import { DeleteConfirmationModal } from '@/components/admin/standards/DeleteConfirmationModal';
import { VersionHistoryModal } from '@/components/admin/standards/VersionHistoryModal';
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
        isLoading
    } = useStandardsPersistence();

    const [selectedAspect, setSelectedAspect] = useState<Aspect | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAspectModalOpen, setIsAspectModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isEditAspectDropdownOpen, setIsEditAspectDropdownOpen] = useState(false);
    const [editingStandard, setEditingStandard] = useState<Standard | undefined>(undefined);
    const [editingAspect, setEditingAspect] = useState<Aspect | undefined>(undefined);
    const [historyStandard, setHistoryStandard] = useState<Standard | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'aspect' | 'standard', id: string, name: string } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Update selected aspect if it was removed or if aspects changed initially
    useEffect(() => {
        if (aspects.length > 0 && !selectedAspect) {
            setSelectedAspect(aspects[0]);
        } else if (selectedAspect && !aspects.find(a => a.mat_aspect_id === selectedAspect.mat_aspect_id)) {
            setSelectedAspect(aspects[0]);
        }
    }, [aspects, selectedAspect]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!selectedAspect && aspects.length > 0) return null; // Wait for effect to set selected aspect

    const currentAspect = selectedAspect || aspects[0]; // Fallback

    const filteredStandards = currentAspect
        ? standards
            .filter(s => s.mat_aspect_id === currentAspect.mat_aspect_id)
            .filter(s =>
                s.standard_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.standard_code.toLowerCase().includes(searchQuery.toLowerCase())
            )
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
                await updateStandard(standard);
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
            setItemToDelete({ type: 'aspect', id, name: aspectToDelete.aspect_name });
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
            setItemToDelete({ type: 'standard', id, name: standardToDelete.standard_code });
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
        <div className="container mx-auto py-6 max-w-7xl h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Standards Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage assessment criteria, versions, and custom aspects.
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* TODO: Fix cogwheel dropdown freezing issue - temporarily disabled */}
                    <DropdownMenu open={isEditAspectDropdownOpen} onOpenChange={setIsEditAspectDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" title="Options" disabled>
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
                                Edit {currentAspect.name}
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
                    <Button variant="outline">
                        <History className="mr-2 h-4 w-4" />
                        Audit Log
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Standard
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar - Aspects */}
                <Card className="w-64 flex-shrink-0 flex flex-col h-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Aspects</CardTitle>
                        <CardDescription>Select an area to manage</CardDescription>
                    </CardHeader>
                    <div className="px-4 pb-2">
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
                            {aspects.map((aspect) => {
                                const count = standards.filter(s => s.mat_aspect_id === aspect.mat_aspect_id).length;
                                return (
                                    <button
                                        key={aspect.mat_aspect_id}
                                        onClick={() => setSelectedAspect(aspect)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center group",
                                            currentAspect.mat_aspect_id === aspect.mat_aspect_id
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span>{aspect.aspect_name}</span>
                                            <span className="text-[10px] text-muted-foreground font-normal">
                                                {count} standard{count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {aspect.is_custom ? (
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1">Custom</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">Default</Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Main Content - Standards List */}
                <div className="flex-1 flex flex-col min-w-0">
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
            />
        </div>
    );
}
