import { useState } from 'react';
import {
    LayoutDashboard,
    Plus,
    Search,
    Settings,
    MoreVertical,
    History,
    Edit2,
    Trash2,
    GripVertical,
    AlertTriangle,
    FileText,
    CheckCircle2
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
import { MOCK_ASPECTS, MOCK_STANDARDS, type Aspect, type Standard } from '@/lib/mock-standards-data';
import { cn } from '@/lib/utils';
import { CreateStandardModal } from '@/components/admin/standards/CreateStandardModal';
import { CreateAspectModal } from '@/components/admin/standards/CreateAspectModal';
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

export default function StandardsManagement() {
    const [selectedAspect, setSelectedAspect] = useState<Aspect>(MOCK_ASPECTS[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [standards, setStandards] = useState<Standard[]>(MOCK_STANDARDS);

    const filteredStandards = standards
        .filter(s => s.category === selectedAspect.code)
        .filter(s =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.orderIndex - b.orderIndex);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAspectModalOpen, setIsAspectModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [editingStandard, setEditingStandard] = useState<Standard | undefined>(undefined);
    const [historyStandard, setHistoryStandard] = useState<Standard | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setStandards((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);

                // Update orderIndex for all affected items
                const newItems = arrayMove(items, oldIndex, newIndex);
                return newItems.map((item, index) => ({
                    ...item,
                    orderIndex: index
                }));
            });
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
                            onClick={() => setIsAspectModalOpen(true)}
                        >
                            <Plus className="mr-2 h-3 w-3" />
                            Add Custom Aspect
                        </Button>
                    </div>
                    <Separator />
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {MOCK_ASPECTS.map((aspect) => (
                                <button
                                    key={aspect.id}
                                    onClick={() => setSelectedAspect(aspect)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center group",
                                        selectedAspect.id === aspect.id
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span>{aspect.name}</span>
                                    {aspect.isCustom && (
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1">Custom</Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Main Content - Standards List */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="mb-4 flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search ${selectedAspect.name} standards...`}
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
                                        No standards match your search in {selectedAspect.name}.
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
                standard={editingStandard}
                defaultCategory={selectedAspect.code}
            />

            <CreateAspectModal
                open={isAspectModalOpen}
                onOpenChange={setIsAspectModalOpen}
            />

            <VersionHistoryModal
                open={isHistoryModalOpen}
                onOpenChange={setIsHistoryModalOpen}
                standard={historyStandard}
            />
        </div>
    );
}
