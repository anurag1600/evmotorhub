'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react';

interface ImageUploadProps {
  bucket: 'vehicles' | 'news' | 'manufacturers' | 'charging-stations' | 'general' | 'hero-images' | 'vehicle-gallery' | 'news-images' | 'images';
  onImageUrl: (url: string) => void;
  currentImageUrl?: string;
  label?: string;
  aspectRatio?: 'square' | 'wide' | 'any';
  maxSize?: number;
  recommendedWidth?: number;
  recommendedHeight?: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE_MB = 5;

export default function ImageUpload({
  bucket,
  onImageUrl,
  currentImageUrl,
  label = 'Upload Image',
  aspectRatio = 'any',
  maxSize = MAX_SIZE_MB,
  recommendedWidth,
  recommendedHeight,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Allowed: JPG, PNG, WEBP, SVG';
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return null;
  };

  // Convert image to WEBP using canvas
  const convertToWebP = async (file: File): Promise<Blob> => {
    // If already WEBP or SVG, return as-is (SVG doesn't convert well)
    if (file.type === 'image/webp') {
      return file;
    }
    if (file.type === 'image/svg+xml') {
      return file; // SVG will keep its format but we'll name it with .webp for tracking
    }

    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');

          // Clamp dimensions to reasonable max (e.g., 2000px)
          const maxDim = 2000;
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

          // Use recommended dimensions if provided
          if (recommendedWidth && recommendedHeight) {
            width = Math.min(width, recommendedWidth);
            height = Math.min(height, recommendedHeight);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert image'));
              }
            },
            'image/webp',
            0.85 // Quality (85% is a good balance)
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Convert to WEBP
      const webpBlob = await convertToWebP(file);

      // Generate filename with .webp extension
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${baseName}.webp`;
      const filePath = `${bucket}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, webpBlob, {
          upsert: false,
          contentType: 'image/webp'
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;
      setPreview(imageUrl);
      onImageUrl(imageUrl);
      setSuccess('Image converted to WEBP and uploaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current) {
      dragRef.current.classList.add('border-[#145a2c]', 'bg-green-50');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current) {
      dragRef.current.classList.remove('border-[#145a2c]', 'bg-green-50');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current) {
      dragRef.current.classList.remove('border-[#145a2c]', 'bg-green-50');
    }
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const clearImage = () => {
    setPreview(undefined);
    onImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
      )}

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

      <div
        ref={dragRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-[#145a2c] hover:bg-green-50"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.svg"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />

        {uploading ? (
          <>
            <Loader2 size={28} className="mx-auto mb-2 animate-spin text-[#145a2c]" />
            <p className="text-gray-600 font-medium">Converting to WEBP & uploading...</p>
          </>
        ) : (
          <>
            <Upload size={28} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-700 font-medium">Drag & drop your image here</p>
            <p className="text-gray-500 text-sm">or click to browse</p>
          </>
        )}

        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG, WEBP, SVG (converted to WEBP) • Max {maxSize}MB
          {recommendedWidth && recommendedHeight && (
            <span> • Recommended: {recommendedWidth}×{recommendedHeight}px</span>
          )}
        </p>
      </div>

      {preview && (
        <div className="relative">
          <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
            {/* WEBP badge */}
            {preview.endsWith('.webp') && (
              <span className="absolute bottom-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                WEBP
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={clearImage}
            disabled={uploading}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
          >
            <X size={14} />
          </button>
          <p className="text-xs text-gray-500 mt-1.5 break-all truncate">{preview}</p>
        </div>
      )}
    </div>
  );
}
