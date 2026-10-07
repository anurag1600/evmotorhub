export const AD_SIZES = [
  { value: 'leaderboard', label: 'Leaderboard (728×90)', width: 728, height: 90 },
  { value: 'large_leaderboard', label: 'Large Leaderboard (970×90)', width: 970, height: 90 },
  { value: 'rectangle', label: 'Rectangle (300×250)', width: 300, height: 250 },
  { value: 'large_rectangle', label: 'Large Rectangle (336×280)', width: 336, height: 280 },
  { value: 'skyscraper', label: 'Skyscraper (120×600)', width: 120, height: 600 },
  { value: 'wide_skyscraper', label: 'Wide Skyscraper (160×600)', width: 160, height: 600 },
  { value: 'square', label: 'Square (250×250)', width: 250, height: 250 },
  { value: 'mobile_banner', label: 'Mobile Banner (320×50)', width: 320, height: 50 },
  { value: 'custom', label: 'Custom Size', width: 0, height: 0 },
];

export const AD_POSITIONS = [
  { value: 'homepage_below_hero', label: 'Homepage - Below Hero' },
  { value: 'homepage_before_faq', label: 'Homepage - Before FAQ' },
  { value: 'homepage_above_footer', label: 'Homepage - Above Footer' },
  { value: 'vehicle_sidebar', label: 'Vehicle Detail - Right Sidebar' },
  { value: 'vehicle_between_sections', label: 'Vehicle Detail - Between Sections' },
  { value: 'news_between_articles', label: 'News - Between Articles' },
  { value: 'news_sidebar', label: 'News Detail - Sidebar' },
  { value: 'listing_after_cards', label: 'Listings - After Every 6 Cards' },
  { value: 'listing_top', label: 'Listings - Top of Page' },
  { value: 'charging_sidebar', label: 'Charging Station Detail - Sidebar' },
  { value: 'charging_between_sections', label: 'Charging Station - Between Sections' },
  { value: 'manufacturer_sidebar', label: 'Manufacturer Detail - Sidebar' },
  { value: 'mobile_sticky_bottom', label: 'Mobile - Sticky Bottom Banner' },
  { value: 'custom', label: 'Custom Position' },
];

export const adSizeDimensions: Record<string, { width: number; height: number }> = {
  leaderboard: { width: 728, height: 90 },
  large_leaderboard: { width: 970, height: 90 },
  rectangle: { width: 300, height: 250 },
  large_rectangle: { width: 336, height: 280 },
  skyscraper: { width: 120, height: 600 },
  wide_skyscraper: { width: 160, height: 600 },
  square: { width: 250, height: 250 },
  mobile_banner: { width: 320, height: 50 },
};

export const POPUP_FREQUENCIES = [
  { value: 'once_per_visit', label: 'Once Per Visit' },
  { value: 'once_per_session', label: 'Once Per Session' },
  { value: 'once_per_day', label: 'Once Per Day' },
  { value: 'once_per_week', label: 'Once Per Week' },
  { value: 'always', label: 'Always Show' },
];
