# EVMotorHub Image Upload - Quick Start Guide

## 5-Minute Setup

### Step 1: Create Storage Buckets (2 minutes)
Go to **Supabase Dashboard → Storage → New Bucket**

Create these 5 buckets:
1. `vehicles` (Public, 5MB limit)
2. `news` (Public, 5MB limit)  
3. `manufacturers` (Public, 5MB limit)
4. `charging-stations` (Public, 5MB limit)
5. `general` (Public, 5MB limit)

### Step 2: Test Image Upload (2 minutes)
1. Log in to admin: `/admin/login`
2. Email: `info.evmotorhub@gmail.com`
3. Go to: `/admin/media`
4. Upload test image using drag-drop
5. See it appear in gallery

### Step 3: Add Image to Manufacturer (1 minute)
1. Go to `/admin/brands` → "Add Brand"
2. Fill in brand details
3. See **"Brand Logo"** section with upload
4. Drag image or click to upload
5. Preview appears
6. Save manufacturer

Done! Images automatically save to database.

---

## What Works Now

✅ **ImageUpload Component**
- Drag & drop
- File picker
- Preview
- Remove button
- Validation

✅ **Media Library**
- Upload to 4 buckets
- Browse all images
- Search/filter
- Copy URL
- Delete

✅ **Admin Forms**
- ManufacturerForm: Logo + Hero Image
- NewsForm: Featured Image
- Auto-save URLs to database

✅ **Supported Formats**
- JPG, JPEG
- PNG
- WEBP
- SVG

✅ **Validation**
- Max 5MB
- Type checking
- User feedback

---

## Usage in Admin

### Media Library (`/admin/media`)
```
1. Upload section: 4 buckets to choose from
2. Gallery: Browse all uploaded images
3. Search: Find images by filename
4. Filter: By bucket
5. Copy: Get public URL
6. Delete: Remove image
```

### Add Manufacturer
```
1. Go to /admin/brands
2. Click "Add Brand"
3. Fill basic info
4. See ImageUpload for:
   - Brand Logo
   - Hero Image
5. Drag image or click upload
6. Preview appears
7. Save
```

### Edit News
```
1. Go to /admin/news
2. Click edit article
3. See ImageUpload for featured image
4. Upload or drag image
5. Save
```

---

## Common Issues

**"Bucket not found"**
→ Create buckets in Supabase Dashboard

**"Upload failed"**
→ Check file size (max 5MB) and format (JPG/PNG/WEBP/SVG)

**"Images not showing"**
→ Verify buckets are PUBLIC

**"No images in Media Library"**
→ Create buckets first, then upload

---

## Architecture

```
User Upload (PC)
    ↓
ImageUpload Component (UI)
    ↓
storage.ts (uploadImage function)
    ↓
Supabase Storage Bucket
    ↓
Public URL Generated
    ↓
Saved to Database
    ↓
Display on Admin/Frontend
```

---

## File Locations

```
Components:
  /components/ImageUpload.tsx (upload UI)
  /components/admin/ManufacturerForm.tsx (uses ImageUpload)
  /components/admin/NewsForm.tsx (uses ImageUpload)

Utilities:
  /lib/storage.ts (uploadImage, deleteImage functions)

Pages:
  /app/admin/media/page.tsx (Media Library)

Configuration:
  See IMAGE_MANAGEMENT_GUIDE.md for full details
```

---

## Next Steps

1. ✓ Create buckets (do now)
2. ✓ Test uploads (do now)
3. ⏳ Update VehicleForm
4. ⏳ Update SettingsForm
5. ⏳ Frontend testing

---

## Support

**Questions?** Check:
- IMAGE_MANAGEMENT_GUIDE.md (complete guide)
- FINAL_AUDIT_REPORT.md (full report)
- Component code comments

**Need Help?**
- ImageUpload component: `/components/ImageUpload.tsx`
- Storage utils: `/lib/storage.ts`
- Media Library: `/app/admin/media/page.tsx`

---

**Status**: Ready for bucket creation and testing
**Build**: ✓ PASSING
**Last Updated**: May 31, 2026
