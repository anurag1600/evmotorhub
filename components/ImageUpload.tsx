'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ImageUploadProps {
  bucket: 'vehicles' | 'news' | 'manufacturers' | 'charging-stations' | 'general' | 'hero-images' | 'vehicle-gallery' | 'news-images' | 'images';
  onImageUrl: (url: string) => void;
  currentImageUrl?: string;
  label?: string;
  aspectRatio?: 'square' | 'wide' | 'any';
  maxSize?: number; // in MB
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
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${bucket}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;
      setPreview(imageUrl);
      onImageUrl(imageUrl);
      setSuccess('Image uploaded successfully!');
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
      <label className="block text-sm font-semibold text-gray-700">{label}</label>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-600">{success}</div>
        </div>
      )}

      {/* Upload Area */}
      <div
        ref={dragRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-[#145a2c] hover:bg-green-50"
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
            <Loader2 size={32} className="mx-auto mb-2 animate-spin text-[#145a2c]" />
            <p className="text-gray-600 font-medium">Uploading...</p>
          </>
        ) : (
          <>
            <Upload size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-700 font-medium">Drag & drop your image here</p>
            <p className="text-gray-500 text-sm">or click to browse</p>
          </>
        )}

        <p className="text-xs text-gray-500 mt-3">
          JPG, PNG, WEBP, SVG • Max {maxSize}MB
          {recommendedWidth && recommendedHeight && (
            <span> • Recommended: {recommendedWidth}×{recommendedHeight}px</span>
          )}
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={clearImage}
            disabled={uploading}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
          >
            <X size={16} />
          </button>
          <p className="text-xs text-gray-500 mt-2 break-all">{preview}</p>
        </div>
      )}
    </div>
  );
}
