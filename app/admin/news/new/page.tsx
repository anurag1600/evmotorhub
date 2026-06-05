import NewsForm from '@/components/admin/NewsForm';

export const metadata = {
  title: 'Create News Article | Admin',
};

export default function NewNewsPage() {
  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="mb-8">
          <h1 className="admin-title">Create New Article</h1>
          <p className="admin-subtitle">Add a new news article to your site</p>
        </div>
        <NewsForm />
      </div>
    </div>
  );
}
