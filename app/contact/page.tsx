import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { SiteConfig } from '@/lib/types';
import ContactPageClient from '@/components/ContactPageClient';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Us | EVMotorHub',
    description: 'Get in touch with the EVMotorHub team. We are here to help with your EV questions, feedback, and partnership inquiries.',
  };
}

async function getContactData() {
  const { data } = await supabase
    .from('site_config')
    .select('*')
    .limit(1);
  return (data?.[0] || null) as SiteConfig | null;
}

export default async function ContactPage() {
  const siteConfig = await getContactData();
  return <ContactPageClient siteConfig={siteConfig} />;
}
