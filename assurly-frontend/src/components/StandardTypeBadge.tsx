import { type StandardType } from '@/types/assessment';
import { cn } from '@/lib/utils';

interface StandardTypeBadgeProps {
    type: StandardType;
    className?: string;
}

export function StandardTypeBadge({ type, className }: StandardTypeBadgeProps) {
    const styles = {
        assurance: 'bg-green-100 text-green-800 border-green-200',
        risk: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const labels = {
        assurance: 'Assurance',
        risk: 'Risk'
    };
    
    return (
        <span className={cn(
            "px-2 py-1 text-xs font-medium rounded border",
            styles[type],
            className
        )}>
            {labels[type]}
        </span>
    );
}

