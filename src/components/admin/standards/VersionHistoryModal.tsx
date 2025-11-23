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
import { type Standard } from '@/lib/mock-standards-data';
import { RotateCcw } from 'lucide-react';

interface VersionHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    standard: Standard | null;
}

export function VersionHistoryModal({ open, onOpenChange, standard }: VersionHistoryModalProps) {
    if (!standard) return null;

    // Combine current version with history for display
    const allVersions = [
        {
            id: 'current',
            version: standard.version,
            text: standard.description,
            createdAt: standard.lastModified,
            createdBy: standard.lastModifiedBy,
            changeType: 'current' as const
        },
        ...standard.versions
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Version History: {standard.code}</DialogTitle>
                    <DialogDescription>
                        {standard.title}
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
                            {allVersions.map((version) => (
                                <TableRow key={version.id}>
                                    <TableCell>
                                        <Badge variant="outline">v{version.version}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(version.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{version.createdBy}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={version.changeType === 'created' ? 'secondary' : 'default'}
                                            className="capitalize"
                                        >
                                            {version.changeType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {version.changeType !== 'current' && (
                                            <Button variant="ghost" size="sm">
                                                <RotateCcw className="mr-2 h-3 w-3" />
                                                Restore
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
