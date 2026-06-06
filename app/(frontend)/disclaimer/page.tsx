import StaticPageComponent from '@/components/StaticPageRenderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer | EVMotorHub',
  description: 'Disclaimer for EVMotorHub platform content and services.',
};

export default function DisclaimerPage() {
  return <StaticPageComponent slug="disclaimer" />;
}
