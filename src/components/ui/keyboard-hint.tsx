import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Command } from 'lucide-react';

export function KeyboardHint() {
  const [isMac, setIsMac] = useState(false);
  
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);
  
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm">
        {isMac ? <Command className="h-3 w-3" /> : <span>Ctrl</span>}
        <span>+</span>
        <span>/</span>
        <span className="ml-2">for shortcuts</span>
      </div>
    </div>
  );
}