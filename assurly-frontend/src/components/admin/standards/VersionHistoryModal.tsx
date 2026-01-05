import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Standard } from '@/types/assessment';
import { RotateCcw } from 'lucide-react';

interface VersionHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    standard: Standard | null;
}

export function VersionHistoryModal({ open, onOpenChange, standard }: VersionHistoryModalProps) {
    if (!standard) return null;

    // Helper to get version number with fallbacks
    const getVersionNumber = (std: Standard): number => {
        // Handle current_version - convert string to number if needed
        const currentVersion = std.current_version;
        if (currentVersion !== null && currentVersion !== undefined) {
            if (typeof currentVersion === 'string') {
                const parsed = parseInt(currentVersion, 10);
                if (!isNaN(parsed)) {
                    return parsed;
                }
            } else if (typeof currentVersion === 'number') {
                return currentVersion;
            }
        }
        
        // Try version_number
        const versionNumber = std.version_number;
        if (versionNumber !== null && versionNumber !== undefined) {
            if (typeof versionNumber === 'string') {
                const parsed = parseInt(versionNumber, 10);
                if (!isNaN(parsed)) {
                    return parsed;
                }
            } else if (typeof versionNumber === 'number') {
                return versionNumber;
            }
        }
        
        // Extract from current_version_id
        if (std.current_version_id) {
            const match = std.current_version_id.match(/v(\d+)$/);
            if (match) {
                return parseInt(match[1], 10);
            }
        }
        return 1;
    };

    // Use v3.0 fields
    const currentVersion = {
        id: 'current',
        version: getVersionNumber(standard),
        createdAt: standard.updated_at || standard.created_at || new Date().toISOString(),
        createdBy: 'System', // TODO: Add created_by_user to Standard type when available
        changeType: 'current'
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Version History: {standard.standard_code}</DialogTitle>
                    <DialogDescription>
                        {standard.standard_name}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Version</TableHead>
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead className="w-[150px]">Edited By</TableHead>
                                <TableHead>Change</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow key={currentVersion.id}>
                                <TableCell>
                                    <Badge variant="outline">v{currentVersion.version}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(currentVersion.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{currentVersion.createdBy}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={currentVersion.changeType === 'created' ? 'secondary' : 'default'}
                                        className="capitalize"
                                    >
                                        {currentVersion.changeType}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {currentVersion.changeType !== 'current' && (
                                        <Button variant="ghost" size="sm">
                                            <RotateCcw className="mr-2 h-3 w-3" />
                                            Restore
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                            {/* TODO: Fetch and display version history from API using getStandardVersions() */}
                            {/* This will require adding a useEffect to fetch versions when modal opens */}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
