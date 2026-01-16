import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

interface CategoryInfo {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    categories: CategoryInfo[];
    activeSlug: string;
    onSelect: (slug: string) => void;
}

export function CategoryTabs({ categories, activeSlug, onSelect }: Props) {
    return (
        <div className="sticky top-0 z-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-6xl">
                <div className="flex w-full">
                    {categories.map((category) => {
                        const isActive = activeSlug === category.slug;
                        return (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => {
                                    router.cancel();
                                    onSelect(category.slug);
                                }}
                                aria-pressed={isActive}
                                className={cn(
                                    'flex-1 py-4 text-center text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer',
                                    isActive
                                        ? 'border-b-2 border-[#f00102] text-[#100d67] dark:text-slate-100'
                                        : 'border-b border-transparent text-slate-500 hover:text-[#100d67] dark:text-slate-400 dark:hover:text-slate-100'
                                )}
                            >
                                {category.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
