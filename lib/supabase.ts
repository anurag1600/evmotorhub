import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      manufacturers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string;
          hero_image_url: string;
          description: string;
          country: string;
          founded_year: number | null;
          headquarters: string;
          website: string;
          total_models: number;
          is_featured: boolean;
          created_at: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          name: string;
          slug: string;
          manufacturer_id: string;
          type: 'scooter' | 'bike' | 'car';
          segment: 'budget' | 'mid' | 'premium' | 'luxury';
          price_min: number;
          price_max: number;
          range_km: number;
          top_speed_kmh: number;
          charging_time_hrs: number;
          battery_capacity_kwh: number;
          motor_power_kw: number;
          image_url: string;
          gallery_urls: string[];
          is_upcoming: boolean;
          is_featured: boolean;
          is_latest: boolean;
          launch_date: string | null;
          colors: string[];
          specifications: Record<string, string>;
          features: string[];
          pros: string[];
          cons: string[];
          created_at: string;
        };
      };
      news: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string;
          image_url: string;
          published_at: string;
          category: 'news' | 'review' | 'launch' | 'comparison' | 'guide';
          author: string;
          author_image: string;
          tags: string[];
          read_time_mins: number;
          is_featured: boolean;
          created_at: string;
        };
      };
      charging_stations: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          lat: number | null;
          lng: number | null;
          operator: string;
          connector_types: string[];
          total_chargers: number;
          available_chargers: number;
          status: 'active' | 'inactive' | 'coming_soon';
          power_kw: number;
          amenities: string[];
          operating_hours: string;
          created_at: string;
        };
      };
    };
  };
};
