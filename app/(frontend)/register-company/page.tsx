import { Metadata } from 'next';
import ManufacturerRegistrationClient from './RegistrationClient';

export const metadata: Metadata = {
  title: 'Register Your Company | EVMotorHub',
  description: 'Register your EV manufacturing company on EVMotorHub and list your electric vehicles to reach thousands of buyers across India.',
};

export default function RegisterCompanyPage() {
  return <ManufacturerRegistrationClient />;
}
