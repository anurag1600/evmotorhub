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
  show_on_homepage: boolean;
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
  video_url?: string;
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
  related_news_ids?: string[];
  similar_vehicle_ids?: string[];
  status?: 'draft' | 'published' | 'archived';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  default_variant_id?: string | null;
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
  colors?: string[];
  color_hexes?: string[];
  specifications: Record<string, string>;
  features: string[];
  pros: string[];
  cons: string[];
  short_description: string | null;
  gallery_urls: string[];
  brochure_url: string | null;
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

export interface PricingState {
  id: string;
  name: string;
  code: string;
  rto_percentage: number;
  road_tax_percentage: number;
  other_charges: number;
  subsidy_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingCity {
  id: string;
  state_id: string;
  name: string;
  pincode: string | null;
  state_code: string | null;
  ex_showroom_price_modifier: number;
  rto_charge: number;
  insurance_charge: number;
  other_charges: number;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
  state?: PricingState;
}

export type VehiclePricingCategory = 'electric_car' | 'electric_scooter' | 'electric_bike';
export type SubsidyType = 'fixed' | 'percentage';

export interface PricingRule {
  id: string;
  city_id: string;
  vehicle_category: VehiclePricingCategory;
  rto_percentage: number;
  insurance_percentage: number;
  registration_fee: number;
  hsrp_fee: number;
  fastag_fee: number;
  other_charges: number;
  show_rto: boolean;
  show_insurance: boolean;
  show_registration: boolean;
  show_hsrp: boolean;
  show_fastag: boolean;
  show_other: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  city?: PricingCity;
}

export interface PricingSlab {
  id: string;
  rule_id: string;
  min_price: number;
  max_price: number | null;
  tax_percentage: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingSubsidy {
  id: string;
  city_id: string;
  vehicle_category: VehiclePricingCategory;
  subsidy_type: SubsidyType;
  value: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  city?: PricingCity;
}

// New Pricing Engine types
export type PricingProfileStatus = 'draft' | 'published' | 'archived';

export interface PricingProfile {
  id: string;
  name: string;
  description: string | null;
  city_id: string | null;
  vehicle_category: VehiclePricingCategory;
  status: PricingProfileStatus;

  // Percentage charges
  rto_percentage: number;
  insurance_percentage: number;

  // Fixed charges
  registration_fee: number;
  hsrp_fee: number;
  fastag_fee: number;
  handling_charges: number;
  dealer_charges: number;
  delivery_charges: number;
  accessories_charges: number;
  other_charges: number;
  misc_charges: number;

  // Visibility toggles
  show_rto: boolean;
  show_insurance: boolean;
  show_registration: boolean;
  show_hsrp: boolean;
  show_fastag: boolean;
  show_handling: boolean;
  show_dealer: boolean;
  show_delivery: boolean;
  show_accessories: boolean;
  show_other: boolean;
  show_misc: boolean;

  // Calculation order
  calculation_order: string[];

  // Rule conditions
  brand_id: string | null;
  vehicle_id: string | null;
  variant_id: string | null;
  vehicle_type: VehicleType | null;
  battery_min_kwh: number | null;
  battery_max_kwh: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  priority: number;
  effective_date: string | null;

  // Subsidy
  has_subsidy: boolean;
  subsidy_type: SubsidyType;
  subsidy_value: number;
  subsidy_title: string | null;
  subsidy_badge_text: string | null;
  subsidy_description: string | null;
  subsidy_start_date: string | null;
  subsidy_end_date: string | null;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations
  city?: PricingCity;
  slabs?: PricingProfileSlab[];
}

export interface PricingProfileVersion {
  id: string;
  profile_id: string;
  version_number: number;
  snapshot: Record<string, any>;
  changed_by: string | null;
  change_description: string | null;
  created_at: string;
}

export interface PricingProfileSlab {
  id: string;
  profile_id: string;
  min_price: number;
  max_price: number | null;
  tax_percentage: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnRoadPriceBreakdown {
  ex_showroom: number;
  rto: number;
  rto_percentage: number;
  insurance: number;
  insurance_percentage: number;
  registration: number;
  hsrp: number;
  fastag: number;
  other: number;
  subsidy: number;
  subsidy_description: string | null;
  on_road: number;
  breakdown: {
    show_rto: boolean;
    show_insurance: boolean;
    show_registration: boolean;
    show_hsrp: boolean;
    show_fastag: boolean;
    show_other: boolean;
  };
}

export interface OfferEnquiry {
  id: string;
  vehicle_id: string;
  vehicle_name: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state?: string;
  pincode?: string;
  vehicle_price?: number;
  variant_name?: string;
  message?: string;
  ip_address?: string;
  ip_city?: string;
  ip_state?: string;
  ip_country?: string;
  user_agent?: string;
  status: 'pending' | 'contacted' | 'converted' | 'closed';
  notes?: string;
  created_at: string;
  updated_at: string;
}
