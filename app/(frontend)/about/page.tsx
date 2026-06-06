import StaticPageComponent from '@/components/StaticPageRenderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | EVMotorHub',
  description: 'Learn about EVMotorHub - India\'s leading electric vehicle information platform.',
};

export default function AboutPage() {
  return <StaticPageComponent slug="about" />;
}
