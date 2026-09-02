'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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

interface MultiImageUploadProps {
  bucket: BucketName;
  onImagesChange: (urls: string[]) => void;
  currentImages?: string[];
  label?: string;
  maxImages?: number;
  aspectRatio?: 'square' | 'wide' | 'any';
  maxSize?: number;
  helpText?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif', 'image/gif'];
const MAX_SIZE_MB = 5;

const SIZE_VARIANTS = [
  { suffix: 'thumb', maxDim: 300, quality: 0.75 },
  { suffix: 'medium', maxDim: 800, quality: 0.80 },
  { suffix: 'large', maxDim: 1600, quality: 0.85 },
];

function validateFile(file: File, maxSize: number): string | null {
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
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image is corrupted or cannot be decoded'));
    img.src = URL.createObjectURL(file);
  });
}

async function convertToWebP(file: File, maxDim: number, qual: number, recommendedWidth?: number, recommendedHeight?: number): Promise<Blob> {
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
}

async function uploadSingleFile(
  file: File,
  bucket: string,
  maxSize: number,
  quality: number,
  recommendedWidth?: number,
  recommendedHeight?: number,
  generateSizes?: boolean,
): Promise<string> {
  const validationError = validateFile(file, maxSize);
  if (validationError) throw new Error(validationError);

  const webpBlob = await convertToWebP(file, 1600, quality, recommendedWidth, recommendedHeight);

  const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${baseName}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, webpBlob, { upsert: false, contentType: 'image/webp' });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  const imageUrl = publicUrlData.publicUrl;

  if (generateSizes && file.type !== 'image/svg+xml') {
    for (const variant of SIZE_VARIANTS) {
      try {
        const variantBlob = await convertToWebP(file, variant.maxDim, variant.quality);
        const variantPath = `${variant.suffix}/${fileName}`;
        await supabase.storage.from(bucket).upload(variantPath, variantBlob, { upsert: false, contentType: 'image/webp' });
      } catch { /* best-effort */ }
    }
  }

  return imageUrl;
}

export function MultiImageUpload({
  bucket,
  onImagesChange,
  currentImages = [],
  label = 'Upload Images',
  maxImages = 10,
  aspectRatio = 'any',
  maxSize = MAX_SIZE_MB,
  helpText,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(currentImages);
  }, [currentImages]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const toUpload = fileArray.slice(0, remaining);
    setUploading(true);
    setError('');

    const newUrls: string[] = [];
    for (const file of toUpload) {
      try {
        const url = await uploadSingleFile(file, bucket, maxSize, 0.82);
        if (!images.includes(url) && !newUrls.includes(url)) {
          newUrls.push(url);
        }
      } catch (err: any) {
        console.error('Upload error:', err);
        toast.error(err.message || 'Failed to upload image');
      }
    }

    if (newUrls.length > 0) {
      const updated = [...images, ...newUrls];
      setImages(updated);
      onImagesChange(updated);
      toast.success(`${newUrls.length} image(s) uploaded`);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [bucket, maxSize, images, maxImages, onImagesChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onImagesChange(updated);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;
    const updated = [...images];
    [updated[index], updated[newIdx]] = [updated[newIdx], updated[index]];
    setImages(updated);
    onImagesChange(updated);
  };

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'wide' ? 'aspect-video' : 'h-32';

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-semibold text-gray-700">{label}</label>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={url + i} className="relative group">
              <div className={`relative ${aspectClass} bg-gray-100 rounded-lg overflow-hidden border border-gray-200`}>
                <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" unoptimized />
              </div>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors z-10"
                title="Remove"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => moveImage(i, 'left')} disabled={i === 0} className="bg-white/90 rounded p-0.5 disabled:opacity-30" title="Move left">
                  <RefreshCw size={10} className="text-gray-700 -scale-x-100" />
                </button>
                <button type="button" onClick={() => moveImage(i, 'right')} disabled={i === images.length - 1} className="bg-white/90 rounded p-0.5 disabled:opacity-30" title="Move right">
                  <RefreshCw size={10} className="text-gray-700" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${isDragging ? 'border-[#145a2c] bg-green-50' : 'border-gray-300 hover:border-[#145a2c] hover:bg-green-50'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.svg,.avif,.gif"
            onChange={handleFileSelect}
            multiple
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <>
              <Loader2 size={24} className="mx-auto mb-2 animate-spin text-[#145a2c]" />
              <p className="text-gray-600 font-medium text-sm">Uploading...</p>
            </>
          ) : (
            <>
              <Upload size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-700 font-medium text-sm">Drag & drop images here</p>
              <p className="text-gray-500 text-xs">or click to browse ({images.length}/{maxImages})</p>
            </>
          )}
          <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP, SVG • Max {maxSize}MB each</p>
          {helpText && <p className="text-xs text-gray-400 mt-1">{helpText}</p>}
        </div>
      )}
    </div>
  );
}

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview when currentImageUrl changes externally
  useEffect(() => {
    setPreview(currentImageUrl);
  }, [currentImageUrl]);

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file, maxSize);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(10);

    try {
      setProgress(30);
      const imageUrl = await uploadSingleFile(file, bucket, maxSize, quality, recommendedWidth, recommendedHeight, generateSizes);
      setProgress(100);
      setPreview(imageUrl);
      onImageUrl(imageUrl);
      setSuccess('Image uploaded successfully');
      toast.success('Image uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      const msg = err.message || 'Failed to upload image';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [bucket, generateSizes, quality, onImageUrl, maxSize, recommendedWidth, recommendedHeight]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-[#145a2c] bg-green-50' : 'border-gray-300 hover:border-[#145a2c] hover:bg-green-50'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.svg,.avif,.gif" onChange={handleFileSelect} disabled={uploading} className="hidden" />
          {uploading ? (
            <>
              <Loader2 size={28} className="mx-auto mb-2 animate-spin text-[#145a2c]" />
              <p className="text-gray-600 font-medium">Uploading...</p>
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
