export type VehicleType = 'scooter' | 'bike' | 'car';
export type VehicleSegment = 'budget' | 'mid' | 'premium' | 'luxury';
export type NewsCategory = 'news' | 'review' | 'launch' | 'comparison' | 'guide';
export type StationStatus = 'active' | 'inactive' | 'coming_soon';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cta_button_text?: string;
  cta_button_url?: string;
  image_url: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  content_blocks: ContentBlock[];
  seo_title?: string;
  seo_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Manufacturer {
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
  contact_email?: string;
  support_phone?: string;
  model_year_start?: number;
  featured_until?: string;
  warranty_info?: Record<string, any>;
  status?: 'active' | 'inactive';
  updated_at?: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  name: string;
  slug: string;
  manufacturer_id: string;
  type: VehicleType;
  segment: VehicleSegment;
  price_min: number;
  price_max: number;
  range_km: number;
  top_speed_kmh: number;
  charging_time_hrs: number;
  battery_capacity_kwh: number;
  motor_power_kw: number;
  image_url: string;
  gallery_urls: string[];
  image_gallery: string[];
  description: string;
  is_upcoming: boolean;
  is_featured: boolean;
  is_latest: boolean;
  launch_date: string | null;
  colors: string[];
  specifications: Record<string, string>;
  features: string[];
  pros: string[];
  cons: string[];
  status?: 'draft' | 'published' | 'archived';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  created_at: string;
  updated_at?: string;
  manufacturers?: Manufacturer;
}

export type ContentBlockType =
  | 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'heading5' | 'heading6'
  | 'unordered_list' | 'ordered_list' | 'table' | 'image' | 'youtube'
  | 'blockquote' | 'button' | 'html' | 'divider'
  | 'product_card' | 'vehicle_comparison' | 'image_gallery' | 'cta_banner';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  data: Record<string, any>;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  content_blocks: ContentBlock[];
  excerpt: string;
  image_url: string;
  published_at: string;
  category: NewsCategory;
  author: string;
  author_image: string;
  tags: string[];
  read_time_mins: number;
  is_featured: boolean;
  status?: 'draft' | 'published' | 'archived';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  created_at: string;
  updated_at?: string;
}

export interface ChargingStation {
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
  status: StationStatus;
  power_kw: number;
  amenities: string[];
  operating_hours: string;
  map_embed_url: string;
  booking_available?: boolean;
  price_per_kwh?: number;
  fast_charging?: boolean;
  phone_support?: string;
  created_at: string;
  updated_at?: string;
}

export interface EMIParams {
  principal: number;
  rate: number;
  tenure: number;
  downPayment?: number;
}

export interface EMIResult {
  emi: number;
  totalAmount: number;
  totalInterest: number;
  loanAmount: number;
}

export interface PopularComparison {
  id: string;
  vehicle1_slug: string;
  vehicle2_slug: string;
  title: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleVariant {
  id: string;
  vehicle_id: string;
  name: string;
  slug: string;
  short_name: string | null;
  price: number;
  range_km: number | null;
  battery_capacity_kwh: number | null;
  motor_power_kw: number | null;
  top_speed_kmh: number | null;
  charging_time_hrs: number | null;
  kerb_weight: number | null;
  image_url: string | null;
  color: string | null;
  color_hex: string | null;
  specifications: Record<string, string>;
  is_available: boolean;
  is_featured: boolean;
  status: 'active' | 'discontinued' | 'upcoming';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HomepageCategory {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string;
  vehicle_type: string | null;
  sort_order: number;
  is_active: boolean;
  vehicle_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SiteConfig {
  id: string;
  homepage_stats: Record<string, any>;
  category_descriptions: Record<string, any>;
  tools_descriptions: Record<string, any>;
  benefits: any[];
  indian_cities: any[];
  connector_types: string[];
  bank_rates: any[];
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_url: string;
  section_toggles: Record<string, boolean>;
  contact_info: Record<string, string>;
  social_media: Record<string, string>;
  map_embed_url: string;
  contact_faq: { question: string; answer: string }[];
  contact_hero_title: string;
  contact_hero_subtitle: string;
  news_settings: Record<string, any>;
  vehicle_settings: Record<string, any>;
  ev_petrol_comparison: Record<string, any>;
  created_at: string;
  updated_at: string;
}
