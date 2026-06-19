import { Metadata } from 'next';
import ManufacturersClientPage from './ManufacturersClientPage';

export const metadata: Metadata = {
  title: 'EV Manufacturers in India | EVMotorHub',
  description: 'Explore all electric vehicle manufacturers in India — Ola Electric, Ather Energy, Tata Motors, TVS, Bajaj, MG, BYD and more.',
};

export default function ManufacturersPage() {
  return <ManufacturersClientPage />;
}
