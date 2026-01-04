import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command } from "lucide-react";
import { useState, useEffect } from "react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'other'>('other');
  
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    if (platform.includes('mac') || userAgent.includes('macintosh')) {
      setPlatform('mac');
    } else if (platform.includes('win') || userAgent.includes('windows')) {
      setPlatform('windows');
    } else {
      setPlatform('other');
    }
  }, []);
  
  const modifierKey = platform === 'mac' ? '⌘' : 'Ctrl';
  
  const shortcuts: Shortcut[] = [
    {
      category: "Navigation",
      keys: [modifierKey, "K"],
      description: "Focus search"
    },
    {
      category: "Navigation",
      keys: [modifierKey, "H"],
      description: "Go to home"
    },
    {
      category: "Navigation",
      keys: [modifierKey, "A"],
      description: "Go to assessments"
    },
    {
      category: "Actions",
      keys: [modifierKey, "R"],
      description: "Switch role"
    },
    {
      category: "Actions",
      keys: ["Esc"],
      description: "Clear filters / Close dialogs"
    },
    {
      category: "Help",
      keys: [modifierKey, "/"],
      description: "Show keyboard shortcuts"
    }
  ];
  
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          {keyIndex > 0 && <span className="text-muted-foreground mx-1">+</span>}
                          <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 text-xs font-medium bg-background border rounded shadow-sm">
                            {key === '⌘' ? <Command className="h-3 w-3" /> : key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-medium bg-background border rounded shadow-sm">Esc</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}