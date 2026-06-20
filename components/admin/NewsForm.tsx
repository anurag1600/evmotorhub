'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { NewsArticle, ContentBlock } from '@/lib/types';
import { Image as ImageIcon, Save, Loader as Loader2, X, CircleAlert as AlertCircle } from 'lucide-react';
import { slugify } from '@/lib/format';
import ImageUpload from '@/components/ImageUpload';
import ContentBlockEditor from '@/components/admin/ContentBlockEditor';

interface NewsFormProps {
  articleId?: string;
}

const categories = ['news', 'review', 'launch', 'comparison', 'guide'];

export default function NewsForm({ articleId }: NewsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    image_url: '',
    category: 'news',
    author: 'EVMotorHub Team',
    author_image: '',
    tags: [] as string[],
    read_time_mins: 5,
    is_featured: false,
    status: 'draft' as 'draft' | 'published',
    seo_title: '',
    seo_description: '',
    seo_keywords: '' as any,
  });
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', articleId)
        .maybeSingle();

      if (error || !data) throw new Error('Article not found');
      setFormData({
        ...data,
        seo_keywords: data.seo_keywords?.join(', ') || '',
      });
      if (data.content_blocks && data.content_blocks.length > 0) {
        setContentBlocks(data.content_blocks);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { title, slug, excerpt, image_url, category, author, tags, read_time_mins, is_featured, status, seo_title, seo_description, seo_keywords } = formData;

      if (!title || !slug) {
        throw new Error('Title and slug are required');
      }

      if (contentBlocks.length === 0) {
        throw new Error('Please add content blocks to the article');
      }

      if (articleId) {
        const { error } = await supabase
          .from('news')
          .update({
            title,
            slug,
            content: '',
            content_blocks: contentBlocks,
            excerpt,
            image_url,
            category,
            author,
            tags,
            read_time_mins,
            is_featured,
            status,
            seo_title,
            seo_description,
            seo_keywords: typeof seo_keywords === 'string' ? seo_keywords.split(',').map(k => k.trim()) : seo_keywords,
            published_at: status === 'published' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', articleId);

        if (error) throw error;
        setSuccess('Article updated successfully!');
      } else {
        const { error } = await supabase.from('news').insert([{
          title,
          slug,
          content: '',
          content_blocks: contentBlocks,
          excerpt,
          image_url,
          category,
          author,
          tags,
          read_time_mins,
          is_featured,
          status,
          seo_title,
          seo_description,
          seo_keywords: typeof seo_keywords === 'string' ? seo_keywords.split(',').map(k => k.trim()) : seo_keywords,
          published_at: status === 'published' ? new Date().toISOString() : null,
        }]);

        if (error) throw error;
        setSuccess('Article created successfully!');
      }

      setTimeout(() => router.push('/admin/news'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const slug = slugify(formData.title);
    setFormData({ ...formData, slug });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  if (loading) {
    return <div className="text-center py-12"><Loader2 className="inline-block animate-spin text-gray-400" size={32} /></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Errors */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-700">Error</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-green-700">{success}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Article Content</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onBlur={generateSlug}
                placeholder="Article title"
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="article-slug"
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short summary (shown in listings)"
                rows={3}
                className="admin-textarea"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
              <ContentBlockEditor blocks={contentBlocks} onChange={setContentBlocks} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Publish</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="admin-select"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#145a2c]"
                />
                <span className="text-sm font-medium text-gray-700">Featured Article</span>
              </label>
            </div>
          </div>

          {/* Article Settings */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="admin-select"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Read Time (min)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.read_time_mins}
                  onChange={(e) => setFormData({ ...formData, read_time_mins: Number(e.target.value) })}
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Featured Image</h2>
            <ImageUpload
              bucket="news"
              onImageUrl={(url) => setFormData({ ...formData, image_url: url })}
              currentImageUrl={formData.image_url}
              label="Article Featured Image"
              recommendedWidth={1200}
              recommendedHeight={600}
            />
          </div>

          {/* Tags */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Tags</h2>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="admin-input"
              />
              <button type="button" onClick={addTag} className="admin-btn-secondary">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">SEO</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="SEO Title"
                className="admin-input text-sm"
              />
              <textarea
                value={formData.seo_description}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="Meta description"
                rows={2}
                className="admin-textarea text-sm"
              />
              <input
                type="text"
                value={typeof formData.seo_keywords === 'string' ? formData.seo_keywords : formData.seo_keywords.join(', ')}
                onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                placeholder="keyword1, keyword2"
                className="admin-input text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="admin-btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : articleId ? 'Update Article' : 'Create Article'}
        </button>
        <button type="button" onClick={() => router.back()} className="admin-btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
