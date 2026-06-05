export function formatPrice(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatPriceRange(min: number, max: number): string {
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

export function calculateEMI(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getVehicleTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    scooter: 'Electric Scooter',
    bike: 'Electric Bike',
    car: 'Electric Car',
  };
  return labels[type] || type;
}

export function getSegmentLabel(segment: string): string {
  const labels: Record<string, string> = {
    budget: 'Budget',
    mid: 'Mid Range',
    premium: 'Premium',
    luxury: 'Luxury',
  };
  return labels[segment] || segment;
}

export function getSegmentColor(segment: string): string {
  const colors: Record<string, string> = {
    budget: 'bg-blue-100 text-blue-700',
    mid: 'bg-green-100 text-green-700',
    premium: 'bg-amber-100 text-amber-700',
    luxury: 'bg-rose-100 text-rose-700',
  };
  return colors[segment] || 'bg-gray-100 text-gray-700';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    coming_soon: 'bg-amber-100 text-amber-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    news: 'News',
    review: 'Review',
    launch: 'Launch',
    comparison: 'Comparison',
    guide: 'Guide',
  };
  return labels[category] || category;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    news: 'bg-blue-100 text-blue-700',
    review: 'bg-green-100 text-green-700',
    launch: 'bg-amber-100 text-amber-700',
    comparison: 'bg-purple-100 text-purple-700',
    guide: 'bg-teal-100 text-teal-700',
  };
  return colors[category] || 'bg-gray-100 text-gray-700';
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
