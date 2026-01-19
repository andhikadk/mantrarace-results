import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

// Race Results Models

export interface Event {
    id: number;
    title: string;
    slug: string;
    location: string;
    start_date: string;
    end_date: string;
    certificate_availability_date?: string;
    created_at: string;
    updated_at: string;
    categories?: Category[];
    categories_count?: number;
}

export interface Category {
    id: number;
    event_id: number;
    name: string;
    slug: string;
    endpoint_url: string;
    total_distance: number | null;
    total_elevation_gain: number | null;
    start_time: string | null;
    cut_off_time: string | null;
    created_at: string;
    updated_at: string;
    event?: Event;
    checkpoints?: Checkpoint[];
    checkpoints_count?: number;
    certificate?: Certificate;
}

export interface Checkpoint {
    id: number;
    category_id: number;
    order_index: number;
    name: string;
    time_field: string;
    segment_field: string | null;
    overall_rank_field: string | null;
    gender_rank_field: string | null;
    distance: number | null;
    elevation_gain: number | null;
    created_at: string;
    updated_at: string;
}

export interface Certificate {
    id: number;
    category_id: number;
    template_path: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

