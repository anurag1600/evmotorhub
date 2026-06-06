import StaticPageComponent from '@/components/StaticPageRenderer';

export const revalidate = 300;

export default function DisclaimerPage() {
  return <StaticPageComponent slug="disclaimer" />;
}
