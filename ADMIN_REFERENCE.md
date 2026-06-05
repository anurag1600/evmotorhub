# EVMotorHub Admin Panel - Quick Reference Guide

## Admin Login
- **URL**: `/admin/login`
- **Email**: `info.evmotorhub@gmail.com`
- **Password**: `Anurag@123`
- **Role**: Super Admin

---

## Admin Routes & Features

### Dashboard
- **URL**: `/admin`
- **Features**: 
  - Real-time stats (vehicles, news, drafts, upcoming)
  - Quick action links
  - System status indicators

### Vehicle Management
- **URL**: `/admin/vehicles`
- **CRUD**: Full Create/Read/Update/Delete
- **Fields**:
  - Basic: name, slug, manufacturer, type, segment
  - Pricing: price_min, price_max
  - Specs: range, speed, charging_time, battery, motor
  - Media: main image, gallery URLs
  - Status: draft/published/archived, featured, upcoming, latest
  - SEO: title, description, keywords
  - Details: colors, features, pros/cons, specifications

### News Management
- **URL**: `/admin/news`
- **CRUD**: Full Create/Read/Update/Delete
- **Fields**:
  - Content: title, slug, content (HTML), excerpt
  - Media: featured image
  - Metadata: category, author, author image
  - Tags & SEO: tags array, seo_title/description/keywords
  - Status: draft/published/archived, featured
  - Engagement: read_time_mins

### Brand Management (NEW)
- **URL**: `/admin/brands`
- **CRUD**: Full Create/Read/Update/Delete
- **Features**: Search, filter by status, pagination
- **Fields**:
  - Branding: name, slug, logo, hero image
  - Details: country, headquarters, website, description
  - Business: founded_year, total_models, model_year_start
  - Contact: email, phone
  - Status: active/inactive, featured toggle

### Charging Stations (NEW)
- **URL**: `/admin/charging`
- **CRUD**: Read/Delete (Create/Edit in development)
- **Features**: Search by name, view availability
- **Fields**:
  - Location: name, address, city, state, coordinates
  - Infrastructure: operator, connector_types, chargers (total/available)
  - Status: active, inactive, coming_soon
  - Features: fast_charging, booking_available, price_per_kwh

### Settings & Configuration (NEW)
- **URL**: `/admin/settings`
- **Manages**:
  - **SEO Settings**:
    - Meta titles/descriptions
    - Open Graph tags
    - Twitter configuration
    - Analytics IDs (Google Analytics, Search Console)
  - **Homepage Statistics** (DYNAMIC):
    - Total vehicles count
    - Total manufacturers count
    - Charging stations count
    - Monthly visitors metric
  - **Site Config** (stored in database):
    - Bank interest rates (6 banks)
    - Indian cities list
    - Connector types
    - Category descriptions
    - Tools descriptions
    - Benefits list

### Media Library (NEW)
- **URL**: `/admin/media`
- **Status**: Interface created, upload feature in development
- **Database**: media_uploads table with RLS configured
- **Features Coming Soon**:
  - Drag-drop upload
  - Bulk upload
  - Image optimization
  - Image search and filtering

---

## Database Tables - Admin Accessible

### Core Marketplace
- **manufacturers** - Brand/manufacturer listings (Enhanced with status, contact fields)
- **vehicles** - Vehicle inventory (Enhanced with status, SEO fields)
- **news** - News articles (Enhanced with status, SEO fields)
- **charging_stations** - Charging station directory (Enhanced with booking/pricing)

### Content Management
- **page_content** - Static pages (About, Contact, Privacy, Terms)
- **footer_config** - Footer configuration and content
- **site_config** - Global site settings (stats, rates, cities, etc.)
- **compare_entries** - Vehicle comparison data

### User Interactions
- **contact_submissions** - Contact form submissions with status tracking
- **charging_submissions** - User-submitted charging stations (approval queue)
- **email_subscribers** - Newsletter subscription list

### Admin & Security
- **admin_users** - Admin accounts with roles
- **admin_activity_log** - Audit trail of all admin actions
- **seo_settings** - Global SEO configuration

---

## Key Features by Page

### Search & Filter
- **Vehicles**: Search by name, filter by type/segment/status
- **News**: Search by title, filter by category/status
- **Brands**: Search by name, filter by status
- **Charging**: Search by name/city
- **Subscribers**: Search by email

### Status Management
- **Vehicles/News**: draft → published → archived
- **Brands**: active / inactive
- **Charging**: active / inactive / coming_soon
- **Contact**: new → responded → closed
- **Charging Submissions**: pending → approved/rejected

### Pagination
- Default 10 items per page
- Previous/Next navigation
- Page indicators

### Bulk Actions (Ready for implementation)
- Multi-select for bulk delete
- Status changes for multiple records
- Export to CSV/PDF (ready)

---

## Important Notes

### Admin Authentication
- Uses Supabase Auth with email/password
- Session stored in browser
- Auto-redirects to login if session expires
- AdminProvider context manages auth state throughout app

### RLS (Row Level Security)
- All tables have RLS enabled
- Admins can only access their own data plus content tables
- Public can view published content only
- Users can submit forms (contact, charging) but not edit

### Admin Logs
- All admin actions are logged to admin_activity_log table
- Includes: admin_id, action type, table name, record_id, before/after data
- Useful for compliance, audits, and debugging

### Soft Deletes
- No soft delete system currently
- Deletes are permanent
- Activity log provides audit trail

---

## Creating/Editing Content

### Adding a Vehicle
1. Go to `/admin/vehicles`
2. Click "Add Vehicle"
3. Fill basic info (name generates slug automatically)
4. Add specs (range, speed, battery, etc.)
5. Upload or paste image URLs
6. Add colors, features, pros/cons
7. Set SEO fields for search
8. Set status (draft/published)
9. Save

### Adding a Brand
1. Go to `/admin/brands`
2. Click "Add Brand"
3. Fill brand details (name, country, headquarters)
4. Add logo and hero images
5. Set contact info
6. Mark as featured if needed
7. Set active/inactive status
8. Save

### Managing Settings
1. Go to `/admin/settings`
2. Update SEO meta tags
3. Update homepage statistics (vehicles count, visitors, etc.)
4. Add/edit Google Analytics IDs
5. Save changes immediately

---

## Troubleshooting

### Login Issues
- Check email and password
- Ensure account is active (is_active = true in admin_users)
- Check network connection
- Clear browser cache if needed

### Form Validation Errors
- All required fields (marked with *) must be filled
- URLs must be valid format (https://...)
- Slugs auto-generate from names, can be customized
- Numeric fields must be numbers

### Data Not Appearing
- Check status field (must be "published" for public view)
- Verify RLS policies allow access
- Check for browser cache
- Review browser console for API errors

### Build Issues
- Run `npm run build` to verify changes
- Check TypeScript errors with `npx tsc`
- Clear .next folder if needed: `rm -rf .next`

---

## API Reference (Internal)

All admin operations use Supabase client library:

```typescript
// Read
const { data } = await supabase
  .from('vehicles')
  .select('*')
  .eq('id', vehicleId)
  .maybeSingle();

// Create
const { error } = await supabase
  .from('vehicles')
  .insert([{ name, slug, ... }]);

// Update
const { error } = await supabase
  .from('vehicles')
  .update({ name, ... })
  .eq('id', vehicleId);

// Delete
const { error } = await supabase
  .from('vehicles')
  .delete()
  .eq('id', vehicleId);
```

All queries automatically respect RLS policies.

---

## Future Enhancements

### Short-term
- [ ] Image upload with CDN integration
- [ ] Bulk import from CSV/Excel
- [ ] Content scheduling/publishing
- [ ] Advanced search with filters
- [ ] User comments moderation

### Medium-term
- [ ] User role refinement (editor vs viewer)
- [ ] Notification system for admin actions
- [ ] Content versioning/history
- [ ] A/B testing support
- [ ] Analytics dashboard

### Long-term
- [ ] AI-powered content suggestions
- [ ] Multi-language support
- [ ] Mobile admin app
- [ ] API for third-party integrations
- [ ] Advanced reporting

---

## Admin User Management

### Current Admin
- Email: `info.evmotorhub@gmail.com`
- Role: `super_admin`
- Access: Full CRUD on all tables

### Adding New Admins (Future)
- Database structure ready
- Admin UI in development
- Will support roles: super_admin, editor, viewer
- Each role will have specific permissions

---

## Support & Documentation

- **Database Docs**: See COMPLETION_REPORT.md
- **Implementation Plan**: See IMPLEMENTATION_PLAN.md
- **Code Comments**: Check individual files for inline documentation
- **Type Definitions**: /lib/types.ts for interface definitions

---

**Last Updated**: May 31, 2026  
**Next Update**: After Phase 5 (Frontend Integration)
