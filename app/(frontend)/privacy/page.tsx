import StaticPageComponent from '@/components/StaticPageRenderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | EVMotorHub',
  description: 'Read our privacy policy to understand how EVMotorHub handles your data.',
};

export default function PrivacyPage() {
  return <StaticPageComponent slug="privacy" />;
}
