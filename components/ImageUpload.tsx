'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type BucketName = 'vehicles' | 'news' | 'manufacturers' | 'charging-stations' | 'general' | 'hero-images' | 'vehicle-gallery' | 'news-images' | 'images' | 'advertisements' | 'logos' | 'icons' | 'og-images' | 'faq' | 'cms' | 'reviews' | 'banners' | 'categories' | 'variants';

interface ImageUploadProps {
  bucket: BucketName;
  onImageUrl: (url: string) => void;
  currentImageUrl?: string;
  label?: string;
  aspectRatio?: 'square' | 'wide' | 'any';
  maxSize?: number;
  recommendedWidth?: number;
  recommendedHeight?: number;
  generateSizes?: boolean;
  quality?: number;
  helpText?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif', 'image/gif'];
const MAX_SIZE_MB = 5;

const SIZE_VARIANTS = [
  { suffix: 'thumb', maxDim: 300, quality: 0.75 },
  { suffix: 'medium', maxDim: 800, quality: 0.80 },
  { suffix: 'large', maxDim: 1600, quality: 0.85 },
];

export default function ImageUpload({
  bucket,
  onImageUrl,
  currentImageUrl,
  label = 'Upload Image',
  aspectRatio = 'any',
  maxSize = MAX_SIZE_MB,
  recommendedWidth,
  recommendedHeight,
  generateSizes = false,
  quality = 0.82,
  helpText,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(currentImageUrl);
  const [originalSize, setOriginalSize] = useState(0);
  const [optimizedSize, setOptimizedSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const lastFileRef = useRef<File | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|svg|avif|gif)$/i)) {
      return 'Invalid file type. Allowed: JPG, PNG, WEBP, SVG, AVIF, GIF';
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    if (file.size === 0) {
      return 'File appears to be empty or corrupted';
    }
    return null;
  };

  const checkDuplicate = (file: File): boolean => {
    if (lastFileRef.current &&
      lastFileRef.current.name === file.name &&
      lastFileRef.current.size === file.size &&
      lastFileRef.current.lastModified === file.lastModified) {
      return true;
    }
    lastFileRef.current = file;
    return false;
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image is corrupted or cannot be decoded'));
      img.src = URL.createObjectURL(file);
    });
  };

  const convertToWebP = async (file: File, maxDim: number, qual: number): Promise<Blob> => {
    if (file.type === 'image/svg+xml') return file;
    if (file.type === 'image/webp' && maxDim >= 1600) {
      const img = await loadImage(file);
      if (img.width <= maxDim && img.height <= maxDim) return file;
    }

    const img = await loadImage(file);
    let width = img.width;
    let height = img.height;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height / width) * maxDim);
        width = maxDim;
      } else {
        width = Math.round((width / height) * maxDim);
        height = maxDim;
      }
    }

    if (recommendedWidth && recommendedHeight && maxDim >= 1600) {
      width = Math.min(width, recommendedWidth);
      height = Math.min(height, recommendedHeight);
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to convert image to WEBP')),
        'image/webp',
        qual
      );
    });
  };

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    if (checkDuplicate(file)) {
      toast.info('This file was just uploaded. Skipping duplicate.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(5);
    setOriginalSize(file.size);

    try {
      setProgress(15);
      const webpBlob = await convertToWebP(file, 1600, quality);
      setOptimizedSize(webpBlob.size);
      setProgress(40);

      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${baseName}.webp`;
      const filePath = `${bucket}/${fileName}`;

      setProgress(50);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, webpBlob, { upsert: false, contentType: 'image/webp' });

      if (uploadError) throw uploadError;
      setProgress(70);

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const imageUrl = publicUrlData.publicUrl;

      if (generateSizes && file.type !== 'image/svg+xml') {
        setProgress(75);
        for (let i = 0; i < SIZE_VARIANTS.length; i++) {
          const variant = SIZE_VARIANTS[i];
          try {
            const variantBlob = await convertToWebP(file, variant.maxDim, variant.quality);
            const variantPath = `${bucket}/${variant.suffix}/${fileName}`;
            await supabase.storage.from(bucket).upload(variantPath, variantBlob, { upsert: false, contentType: 'image/webp' });
          } catch { /* variant generation is best-effort */ }
          setProgress(75 + Math.round(((i + 1) / SIZE_VARIANTS.length) * 20));
        }
      }

      setProgress(100);
      setPreview(imageUrl);
      onImageUrl(imageUrl);

      const savings = file.size > 0 ? Math.round((1 - webpBlob.size / file.size) * 100) : 0;
      const sizeStr = webpBlob.size < 1024 * 1024
        ? `${(webpBlob.size / 1024).toFixed(0)}KB`
        : `${(webpBlob.size / 1024 / 1024).toFixed(1)}MB`;
      setSuccess(`Uploaded as WEBP (${sizeStr}${savings > 0 ? `, ${savings}% smaller` : ''})`);
      toast.success(`Image uploaded & optimized as WEBP (${sizeStr})`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error('Upload error:', err);
      const msg = err.message || 'Failed to upload image';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [bucket, generateSizes, quality, onImageUrl, maxSize, recommendedWidth, recommendedHeight]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const clearImage = () => {
    setPreview(undefined);
    onImageUrl('');
    setSuccess('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const replaceImage = () => {
    fileInputRef.current?.click();
  };

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'wide' ? 'aspect-video' : 'h-40';

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-semibold text-gray-700">{label}</label>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-600">{success}</div>
        </div>
      )}

      {preview ? (
        <div className="relative group">
          <div className={`relative w-full ${aspectClass} bg-gray-100 rounded-lg overflow-hidden border border-gray-200`}>
            <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
            {preview.endsWith('.webp') && (
              <span className="absolute bottom-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">WEBP</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-white" />
                <div className="w-3/4 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div className="bg-white h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-white text-xs font-medium">{progress}%</span>
              </div>
            )}
          </div>
          {!uploading && (
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button type="button" onClick={replaceImage} className="bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 transition-colors shadow-sm" title="Replace">
                <RefreshCw size={14} />
              </button>
              <button type="button" onClick={clearImage} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-sm" title="Remove">
                <X size={14} />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1.5 break-all truncate">{preview}</p>
        </div>
      ) : (
        <div
          ref={dragRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-[#145a2c] bg-green-50' : 'border-gray-300 hover:border-[#145a2c] hover:bg-green-50'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.svg,.avif,.gif" onChange={handleFileSelect} disabled={uploading} className="hidden" />
          {uploading ? (
            <>
              <Loader2 size={28} className="mx-auto mb-2 animate-spin text-[#145a2c]" />
              <p className="text-gray-600 font-medium">Optimizing & uploading...</p>
              <div className="w-1/2 mx-auto mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-[#145a2c] h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-gray-500 mt-1 block">{progress}%</span>
            </>
          ) : (
            <>
              <Upload size={28} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-700 font-medium">Drag & drop your image here</p>
              <p className="text-gray-500 text-sm">or click to browse</p>
            </>
          )}
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG, WEBP, SVG, AVIF (auto-converted to WEBP) • Max {maxSize}MB
            {recommendedWidth && recommendedHeight && <span> • Recommended: {recommendedWidth}×{recommendedHeight}px</span>}
          </p>
          {helpText && <p className="text-xs text-gray-400 mt-1">{helpText}</p>}
        </div>
      )}
    </div>
  );
}
