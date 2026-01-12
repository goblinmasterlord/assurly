import { type AspectCategory } from '@/types/assessment';
import { cn } from '@/lib/utils';

interface AspectCategoryBadgeProps {
    category: AspectCategory;
    className?: string;
}

export function AspectCategoryBadge({ category, className }: AspectCategoryBadgeProps) {
    const styles = {
        ofsted: 'bg-blue-100 text-blue-700 border-blue-300',
        operational: 'bg-green-100 text-green-800 border-green-300'
    };
    
    const labels = {
        ofsted: 'Ofsted',
        operational: 'Operational'
    };
    
    return (
        <span className={cn(
            "inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded border whitespace-nowrap",
            styles[category],
            className
        )}>
            {labels[category]}
        </span>
    );
}

