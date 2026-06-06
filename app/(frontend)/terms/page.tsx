import StaticPageComponent from '@/components/StaticPageRenderer';

export const revalidate = 300;

export default function TermsPage() {
  return <StaticPageComponent slug="terms" />;
}
