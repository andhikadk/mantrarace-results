import { cn } from '@/lib/utils';
import { type Category } from '@/types';

interface Props {
    categories: Category[];
    activeSlug: string;
    onSelect: (slug: string) => void;
}

export function CategoryTabs({ categories, activeSlug, onSelect }: Props) {
    return (
        <div className="border-b bg-white sticky top-0 z-10">
            <div className="mx-auto max-w-5xl px-4">
                <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => onSelect(category.slug)}
                            className={cn(
                                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                activeSlug === category.slug
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            )}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
