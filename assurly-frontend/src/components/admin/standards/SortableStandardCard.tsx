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
import { StandardTypeBadge } from '@/components/StandardTypeBadge';

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
        // Try current_version first (primary field)
        const currentVersion = standard.current_version;
        if (currentVersion !== null && currentVersion !== undefined && currentVersion !== 0) {
            if (typeof currentVersion === 'string') {
                const parsed = parseInt(currentVersion, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                }
            } else if (typeof currentVersion === 'number' && currentVersion > 0) {
                return currentVersion;
            }
        }
        
        // Try version_number (legacy/fallback field)
        const versionNumber = standard.version_number;
        if (versionNumber !== null && versionNumber !== undefined && versionNumber !== 0) {
            if (typeof versionNumber === 'string') {
                const parsed = parseInt(versionNumber, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                }
            } else if (typeof versionNumber === 'number' && versionNumber > 0) {
                return versionNumber;
            }
        }
        
        // Extract version from current_version_id (e.g., "HLT-LD1-v2" -> 2)
        const versionId = standard.current_version_id;
        if (versionId) {
            const match = versionId.match(/v(\d+)$/);
            if (match) {
                const parsed = parseInt(match[1], 10);
                if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                }
            }
        }
        return 1; // Default to version 1
    };

    const versionNumber = getVersionNumber();

    // Truncate description to 250 characters for display
    const truncateDescription = (text: string, maxLength: number = 250): string => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    const displayDescription = truncateDescription(standard.standard_description || '', 250);

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
                            {standard.standard_type && (
                                <StandardTypeBadge type={standard.standard_type} />
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 break-words">
                            {displayDescription}
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
