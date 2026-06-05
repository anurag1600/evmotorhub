import ManufacturerForm from '@/components/admin/ManufacturerForm';

export const metadata = {
  title: 'Add Manufacturer | Admin',
};

export default function NewManufacturerPage() {
  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="mb-8">
          <h1 className="admin-title">Add New Manufacturer</h1>
          <p className="admin-subtitle">Create a new EV manufacturer or brand</p>
        </div>
        <ManufacturerForm />
      </div>
    </div>
  );
}
