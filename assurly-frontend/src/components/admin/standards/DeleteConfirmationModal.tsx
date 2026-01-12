import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Info } from "lucide-react";

interface DeleteConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    itemName?: string;
    isCustom?: boolean;
    itemType?: 'standard' | 'aspect';
}

export function DeleteConfirmationModal({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    itemName,
    isCustom = false,
    itemType = 'standard'
}: DeleteConfirmationModalProps) {
    const itemLabel = itemType === 'standard' ? 'standard' : 'aspect';
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="pt-2 space-y-3">
                        {itemName && (
                            <div className="p-2 bg-muted rounded-md font-medium text-foreground text-sm border">
                                {itemName}
                            </div>
                        )}
                        
                        {isCustom ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="font-medium">This is a custom {itemLabel}</span>
                                </div>
                                <p className="text-sm">
                                    This {itemLabel} will be <strong>permanently archived</strong>. 
                                    You will not be able to reinstate it, but you can create a 
                                    new {itemLabel} with the same code later.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <Info className="h-4 w-4" />
                                    <span className="font-medium">This is a default {itemLabel}</span>
                                </div>
                                <p className="text-sm">
                                    This {itemLabel} will be <strong>deactivated</strong>. 
                                    You can reinstate it later from the inactive {itemLabel}s section.
                                </p>
                            </div>
                        )}
                        
                        <div className="mt-4 p-3 bg-muted/50 rounded-md border">
                            <p className="text-xs text-muted-foreground">
                                <strong>Note:</strong> Any existing assessments using this {itemLabel} 
                                will be preserved, but the {itemLabel} will no longer appear in new assessments.
                            </p>
                        </div>
                        
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        {isCustom ? `Archive ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}` : `Deactivate ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
