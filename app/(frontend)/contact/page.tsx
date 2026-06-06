import { Metadata } from 'next';
import ContactPageClient from '@/components/ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact Us | EVMotorHub',
  description: 'Get in touch with the EVMotorHub team. We are here to help with your EV questions, feedback, and partnership inquiries.',
};

export default function ContactPage() {
  return <ContactPageClient />;
}
