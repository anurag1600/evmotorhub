import StaticPageComponent from '@/components/StaticPageRenderer';

export const revalidate = 300;

export default function AboutPage() {
  return <StaticPageComponent slug="about" />;
}
