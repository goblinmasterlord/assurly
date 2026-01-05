import { useSortable } from '@dnd-kit/sortable';
import { format } from 'date-fns';
import { CSS } from '@dnd-kit/utilities';
import {
    MoreVertical,
    History,
    Edit2,
    Trash2,
    GripVertical,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { type Standard } from '@/types/assessment';

interface SortableStandardCardProps {
    standard: Standard;
    onEdit: (standard: Standard) => void;
    onHistory: (standard: Standard) => void;
    onDelete: (id: string) => void;
}

export function SortableStandardCard({ standard, onEdit, onHistory, onDelete }: SortableStandardCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: standard.mat_standard_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    // Get version number - try current_version first, then version_number, then extract from current_version_id
    const getVersionNumber = (): number => {
        // Handle current_version - convert string to number if needed
        let version = standard.current_version;
        if (version !== null && version !== undefined) {
            if (typeof version === 'string') {
                const parsed = parseInt(version, 10);
                if (!isNaN(parsed)) {
                    return parsed;
                }
            } else if (typeof version === 'number') {
                return version;
            }
        }
        
        // Try version_number
        version = standard.version_number;
        if (version !== null && version !== undefined) {
            if (typeof version === 'string') {
                const parsed = parseInt(version, 10);
                if (!isNaN(parsed)) {
                    return parsed;
                }
            } else if (typeof version === 'number') {
                return version;
            }
        }
        
        // Extract version from current_version_id (e.g., "HLT-LD1-v2" -> 2)
        if (standard.current_version_id) {
            const match = standard.current_version_id.match(/v(\d+)$/);
            if (match) {
                return parseInt(match[1], 10);
            }
        }
        return 1; // Default to version 1
    };

    const versionNumber = getVersionNumber();

    return (
        <div ref={setNodeRef} style={style} className="mb-4">
            <Card className="group hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex gap-4">
                    <div
                        className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground outline-none"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <Badge variant="outline" className="font-mono font-bold">
                                {standard.standard_code}
                            </Badge>
                            <h3 className="font-semibold truncate">{standard.standard_name}</h3>
                            <Badge variant="secondary" className="text-xs">
                                v{versionNumber}
                            </Badge>
                            {standard.is_custom && (
                                <Badge variant="outline" className="text-teal-600 border-teal-200 bg-teal-50 text-xs">
                                    Custom
                                </Badge>
                            )}
                            {standard.is_modified && (
                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                                    Modified
                                </Badge>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {standard.standard_description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                                <History className="mr-1 h-3 w-3" />
                                Updated {format(new Date(standard.updated_at || new Date()), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(standard)}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onHistory(standard)}>
                                    <History className="mr-2 h-4 w-4" />
                                    View History
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Duplicate
                                </DropdownMenuItem>
                                <Separator className="my-1" />
                                <DropdownMenuItem 
                                    onClick={() => onDelete(standard.mat_standard_id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
