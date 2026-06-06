import StaticPageComponent from '@/components/StaticPageRenderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | EVMotorHub',
  description: 'Terms and conditions for using EVMotorHub platform.',
};

export default function TermsPage() {
  return <StaticPageComponent slug="terms" />;
}
