import { type AspectCategory } from '@/types/assessment';
import { cn } from '@/lib/utils';

interface AspectCategoryBadgeProps {
    category: AspectCategory;
    className?: string;
}

export function AspectCategoryBadge({ category, className }: AspectCategoryBadgeProps) {
    const styles = {
        ofsted: 'bg-purple-100 text-purple-800 border-purple-200',
        operational: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    const labels = {
        ofsted: 'Ofsted',
        operational: 'Operational'
    };
    
    return (
        <span className={cn(
            "px-2 py-1 text-xs font-medium rounded border",
            styles[category],
            className
        )}>
            {labels[category]}
        </span>
    );
}

