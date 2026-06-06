import StaticPageComponent from '@/components/StaticPageRenderer';

export const revalidate = 300;

export default function PrivacyPage() {
  return <StaticPageComponent slug="privacy" />;
}
