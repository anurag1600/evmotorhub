import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';

const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => (
    <div className="bg-[#0a2e14] h-32" aria-hidden="true" />
  ),
  ssr: false,
});

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <Breadcrumbs />
        {children}
      </main>
      <Footer />
    </>
  );
}
