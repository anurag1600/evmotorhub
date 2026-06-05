'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NewsArticle } from '@/lib/types';
import { FileText, Plus, Edit2, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';
import { getCategoryColor, getCategoryLabel, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import Pagination from '@/components/admin/Pagination';
import ImportExport from '@/components/admin/ImportExport';

const statusColors: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-700',
};

const EXPORT_COLS = ['id', 'title', 'slug', 'category', 'status', 'is_featured', 'author', 'published_at', 'excerpt'];
const IMPORT_COLS = ['title', 'slug', 'category', 'status', 'author', 'excerpt', 'content', 'is_featured'];

export default function NewsManagementPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      let countQuery = supabase.from('news').select('id', { count: 'exact', head: true });
      let dataQuery = supabase.from('news').select('*').order('created_at', { ascending: false });

      if (status) { countQuery = countQuery.eq('status', status); dataQuery = dataQuery.eq('status', status); }
      if (search) { countQuery = countQuery.ilike('title', `%${search}%`); dataQuery = dataQuery.ilike('title', `%${search}%`); }

      const from = (page - 1) * pageSize;
      dataQuery = dataQuery.range(from, from + pageSize - 1);

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (!error && data) { setArticles(data as NewsArticle[]); setTotal(count ?? 0); }
    } catch (err) { console.error('Failed to fetch articles:', err); }
    finally { setLoading(false); }
  }, [search, status, page, pageSize]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => { setPage(1); }, [search, status]);

  const fetchAllForExport = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    return (data || []) as NewsArticle[];
  };

  const handleExportData = useCallback(async () => {
    const all = await fetchAllForExport();
    setAllArticles(all);
    return all;
  }, []);

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    setDeleting(id);
    try {
      await supabase.from('news').delete().eq('id', id);
      setArticles(articles.filter(a => a.id !== id));
      setTotal(t => t - 1);
    } catch (err) { console.error('Delete failed:', err); }
    finally { setDeleting(null); }
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const errors: string[] = [];
    let success = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.title) { errors.push(`Row ${i + 1}: title is required`); continue; }
      const slug = row.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      try {
        const { error } = await supabase.from('news').insert([{
          title: row.title,
          slug,
          category: row.category || 'news',
          status: row.status || 'draft',
          author: row.author || '',
          excerpt: row.excerpt || '',
          content: row.content || '',
          is_featured: row.is_featured === 'true',
        }]);
        if (error) throw error;
        success++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }
    if (success > 0) fetchArticles();
    return { success, errors };
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <FileText size={28} className="text-[#145a2c]" />
              News Management
            </h1>
            <p className="admin-subtitle">Create, edit, and publish articles</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportExport
              tableName="news"
              exportColumns={EXPORT_COLS}
              importColumns={IMPORT_COLS}
              data={articles}
              onImport={handleImport}
            />
            <Link href="/admin/news/new" className="admin-btn-primary">
              <Plus size={16} />
              Add Article
            </Link>
          </div>
        </div>

        <div className="admin-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="admin-input pl-9"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-select">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
              Loading articles...
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No articles found</p>
              <Link href="/admin/news/new" className="admin-btn-primary">
                <Plus size={14} /> Create First Article
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Featured</th>
                      <th>Published</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-table-body">
                    {articles.map((article) => (
                      <tr key={article.id}>
                        <td className="font-medium text-gray-900">{article.title}</td>
                        <td>
                          <span className={cn('admin-badge', getCategoryColor(article.category))}>
                            {getCategoryLabel(article.category)}
                          </span>
                        </td>
                        <td>
                          <span className={cn('admin-badge', statusColors[article.status || 'published'])}>
                            {article.status || 'published'}
                          </span>
                        </td>
                        <td>{article.is_featured ? '✓' : '—'}</td>
                        <td className="text-xs text-gray-500">{timeAgo(article.published_at)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/news/${article.id}/edit`} className="text-[#145a2c] hover:text-[#0f4020]">
                              <Edit2 size={14} />
                            </Link>
                            <button
                              onClick={() => deleteArticle(article.id)}
                              disabled={deleting === article.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {deleting === article.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
