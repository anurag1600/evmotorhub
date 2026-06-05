import NewsForm from '@/components/admin/NewsForm';

export const metadata = {
  title: 'Edit Article | Admin',
};

export default function EditNewsPage({ params }: { params: { id: string } }) {
  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="mb-8">
          <h1 className="admin-title">Edit Article</h1>
          <p className="admin-subtitle">Update article content and settings</p>
        </div>
        <NewsForm articleId={params.id} />
      </div>
    </div>
  );
}
