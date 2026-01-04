import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Command } from 'lucide-react';

interface KeyboardHintProps {
  onClick?: () => void;
  className?: string;
}

export function KeyboardHint({ onClick, className }: KeyboardHintProps) {
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'linux' | 'other'>('other');
  
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    if (platform.includes('mac') || userAgent.includes('macintosh')) {
      setPlatform('mac');
    } else if (platform.includes('win') || userAgent.includes('windows')) {
      setPlatform('windows');
    } else if (platform.includes('linux') || userAgent.includes('linux')) {
      setPlatform('linux');
    } else {
      setPlatform('other');
    }
  }, []);
  
  const getModifierKey = () => {
    switch (platform) {
      case 'mac':
        return <Command className="h-3 w-3" />;
      case 'windows':
      case 'linux':
      default:
        return <span className="font-mono text-[10px] font-semibold">Ctrl</span>;
    }
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
        "hover:bg-muted/50 rounded px-2 py-1",
        className
      )}
      title="View keyboard shortcuts"
    >
      <span className="flex items-center gap-0.5">
        {getModifierKey()}
        <span className="mx-0.5">+</span>
        <span className="font-mono text-[10px] font-semibold">/</span>
      </span>
      <span className="ml-1 text-[11px]">for shortcuts</span>
    </button>
  );
}