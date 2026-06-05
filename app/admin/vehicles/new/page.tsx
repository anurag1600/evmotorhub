import VehicleForm from '@/components/admin/VehicleForm';

export const metadata = {
  title: 'Add Vehicle | Admin',
};

export default function NewVehiclePage() {
  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="mb-8">
          <h1 className="admin-title">Add New Vehicle</h1>
          <p className="admin-subtitle">Create a new vehicle listing</p>
        </div>
        <VehicleForm />
      </div>
    </div>
  );
}
