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
        } else if (selectedAspect && !aspects.find(a => a.id === selectedAspect.id)) {
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
            .filter(s => (s as any).aspectId === currentAspect.id || s.category === currentAspect.code) // Handle both API and legacy mock structure if needed
            .filter(s =>
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.code.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
        : [];



    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = standards.findIndex((item) => item.id === active.id);
            const newIndex = standards.findIndex((item) => item.id === over?.id);

            // We need to reorder the full list, but only the items in the current view are relevant for the visual drag
            // However, for persistence, we just need to update the orderIndex of the moved item and potentially others
            // A simpler approach for this mock implementation is to just move them in the array if they are siblings
            // But since we filter by category, we should be careful.

            // Let's just reorder the filtered list and update the main list based on that
            const newFiltered = arrayMove(filteredStandards,
                filteredStandards.findIndex(s => s.id === active.id),
                filteredStandards.findIndex(s => s.id === over?.id)
            );

            // Update orderIndex for these items
            const updatedStandards = newFiltered.map((item, index) => ({
                ...item,
                orderIndex: index
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

    const handleSaveStandard = (standard: Standard) => {
        if (editingStandard) {
            updateStandard(standard);
        } else {
            const standardWithAspect = {
                ...standard,
                aspectId: (standard as any).aspectId || currentAspect.id,
                category: standard.category || currentAspect.code,
                orderIndex: standards.filter(s => 
                    (s as any).aspectId === currentAspect.id || s.category === currentAspect.code
                ).length
            };
            addStandard(standardWithAspect);
        }
        setIsCreateModalOpen(false);
    };

    const handleSaveAspect = (aspect: Aspect) => {
        if (editingAspect) {
            updateAspect(aspect);
        } else {
            addAspect(aspect);
        }
        setIsAspectModalOpen(false);
    };

    const handleEditAspect = (aspect: Aspect) => {
        setEditingAspect(aspect);
        setIsAspectModalOpen(true);
    };

    const handleDeleteAspect = (id: string) => {
        const aspectToDelete = aspects.find(a => a.id === id);
        if (aspectToDelete) {
            setItemToDelete({ type: 'aspect', id, name: aspectToDelete.name });
            setDeleteModalOpen(true);
        }
    };

    const handleCreateAspect = () => {
        setEditingAspect(undefined);
        setIsAspectModalOpen(true);
    };

    const handleDeleteStandard = (id: string) => {
        const standardToDelete = standards.find(s => s.id === id);
        if (standardToDelete) {
            setItemToDelete({ type: 'standard', id, name: standardToDelete.code });
            setDeleteModalOpen(true);
        }
    };

    const handleConfirmDelete = () => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'aspect') {
            deleteAspect(itemToDelete.id);
            if (currentAspect.id === itemToDelete.id) {
                setSelectedAspect(aspects[0]);
            }
        } else {
            deleteStandard(itemToDelete.id);
        }
        setDeleteModalOpen(false);
        setItemToDelete(null);
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
                    open={isAspectModalOpen}
                    onOpenChange={setIsAspectModalOpen}
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
                    <DropdownMenu>
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
                                }}
                            >
                                <Edit2 className="mr-2 h-3 w-3" />
                                Edit {currentAspect.name}
                            </DropdownMenuItem>
                            {currentAspect.isCustom && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAspect(currentAspect.id);
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
                                const count = standards.filter(s => (s as any).aspectId === aspect.id).length;
                                return (
                                    <button
                                        key={aspect.id}
                                        onClick={() => setSelectedAspect(aspect)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center group",
                                            currentAspect.id === aspect.id
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span>{aspect.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-normal">
                                                {count} standard{count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {aspect.isCustom ? (
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
                                placeholder={`Search ${currentAspect.name} standards...`}
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
                                        No standards match your search in {currentAspect.name}.
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
                                        items={filteredStandards.map(s => s.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {filteredStandards.map((standard) => (
                                            <SortableStandardCard
                                                key={standard.id}
                                                standard={standard}
                                                onEdit={handleEdit}
                                                onHistory={handleHistory}
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
                defaultAspectId={currentAspect.id}
                aspects={aspects}
            />

            <CreateAspectModal
                open={isAspectModalOpen}
                onOpenChange={setIsAspectModalOpen}
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
