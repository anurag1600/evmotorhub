import ChargingStationForm from '@/components/admin/ChargingStationForm';

interface EditChargingStationPageProps {
  params: { id: string };
}

export default function EditChargingStationPage({ params }: EditChargingStationPageProps) {
  return <ChargingStationForm id={params.id} />;
}
