import VehicleForm from '@/components/admin/VehicleForm';

export const metadata = {
  title: 'Edit Vehicle | Admin',
};

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="mb-8">
          <h1 className="admin-title">Edit Vehicle</h1>
          <p className="admin-subtitle">Update vehicle details</p>
        </div>
        <VehicleForm vehicleId={params.id} />
      </div>
    </div>
  );
}
