import ManufacturerForm from '@/components/admin/ManufacturerForm';

export const metadata = {
  title: 'Edit Manufacturer | Admin',
};

export default function EditManufacturerPage({ params }: { params: { id: string } }) {
  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="mb-8">
          <h1 className="admin-title">Edit Manufacturer</h1>
          <p className="admin-subtitle">Update manufacturer details</p>
        </div>
        <ManufacturerForm manufacturerId={params.id} />
      </div>
    </div>
  );
}
