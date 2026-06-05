import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-[100px] md:pt-[108px]">{children}</main>
      <Footer />
    </>
  );
}
