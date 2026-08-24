'use client';

import { useState } from 'react';
import { slugify } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import ImageUpload from '@/components/ImageUpload';
import VehicleBulkUpload from '@/components/VehicleBulkUpload';
import { toast } from 'sonner';
import { Building2, Globe, Mail, Phone, MapPin, Loader as Loader2, CircleCheck as CheckCircle2, ArrowRight, ArrowLeft, FileSpreadsheet, Zap, Package, ChevronRight, CircleAlert as AlertCircle, User } from 'lucide-react';
import Link from 'next/link';

interface CompanyFormData {
  company_name: string;
  slug: string;
  logo_url: string;
  hero_image_url: string;
  description: string;
  country: string;
  founded_year: number | string;
  headquarters: string;
  website: string;
  total_models: number | string;
  contact_person: string;
  contact_email: string;
  support_phone: string;
  address: string;
}

const initialFormData: CompanyFormData = {
  company_name: '',
  slug: '',
  logo_url: '',
  hero_image_url: '',
  description: '',
  country: 'India',
  founded_year: '',
  headquarters: '',
  website: '',
  total_models: '',
  contact_person: '',
  contact_email: '',
  support_phone: '',
  address: '',
};

const steps = [
  { number: 1, label: 'Company Info', icon: Building2 },
  { number: 2, label: 'Branding', icon: Package },
  { number: 3, label: 'Vehicles', icon: FileSpreadsheet },
  { number: 4, label: 'Review', icon: CheckCircle2 },
];

export default function ManufacturerRegistrationClient() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleErrors, setVehicleErrors] = useState<any[]>([]);

  const validateStep1 = (): boolean => {
    const e: Partial<Record<keyof CompanyFormData, string>> = {};
    if (!formData.company_name.trim()) e.company_name = 'Company name is required';
    if (!formData.country.trim()) e.country = 'Country is required';
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) e.website = 'Website must start with http:// or https://';
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) e.contact_email = 'Invalid email format';
    if (formData.support_phone && formData.support_phone.replace(/[^0-9+]/g, '').length < 7) e.support_phone = 'Phone number is too short';
    if (formData.founded_year && (Number(formData.founded_year) < 1800 || Number(formData.founded_year) > new Date().getFullYear())) e.founded_year = 'Invalid year';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(s => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const submissionData = {
        company_name: formData.company_name.trim(),
        slug: formData.slug || slugify(formData.company_name),
        logo_url: formData.logo_url,
        hero_image_url: formData.hero_image_url,
        description: formData.description,
        country: formData.country || 'India',
        founded_year: formData.founded_year ? Number(formData.founded_year) : null,
        headquarters: formData.headquarters,
        website: formData.website,
        total_models: formData.total_models ? Number(formData.total_models) : 0,
        contact_person: formData.contact_person,
        contact_email: formData.contact_email,
        support_phone: formData.support_phone,
        address: formData.address,
        status: 'pending',
      };

      const { data: mfgData, error: mfgError } = await supabase
        .from('manufacturer_submissions')
        .insert([submissionData])
        .select('id')
        .maybeSingle();

      if (mfgError) throw mfgError;
      if (!mfgData) throw new Error('Failed to create submission');

      if (vehicles.length > 0) {
        const { error: vError } = await supabase
          .from('vehicle_submissions')
          .insert([{
            manufacturer_submission_id: mfgData.id,
            company_name: formData.company_name.trim(),
            vehicles: vehicles,
            validation_errors: vehicleErrors,
            status: 'pending',
          }]);

        if (vError) {
          console.error('Vehicle submission error:', vError);
          toast.warning('Company registered, but vehicle upload had an issue. Admin will contact you.');
        }
      }

      setSubmitted(true);
      toast.success('Registration submitted successfully!');
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Failed to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 sm:p-10 text-center">
            <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted!</h1>
            <p className="text-gray-600 mb-2">
              Thank you for registering <strong>{formData.company_name}</strong> on EVMotorHub.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Our team will review your submission and approve it shortly. You&apos;ll be able to see your company listed once approved.
            </p>
            <div className="bg-green-50 rounded-xl p-4 mb-8 text-left">
              <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                <Zap size={14} />
                <span className="font-semibold">What happens next?</span>
              </div>
              <ul className="text-xs text-green-600 space-y-1 ml-6 list-disc">
                <li>Our admin team reviews your company details</li>
                <li>Once approved, your company appears in the manufacturer listing</li>
                <li>Your vehicles will be reviewed and published</li>
                <li>You&apos;ll be part of India&apos;s growing EV ecosystem</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors">
                Back to Home
              </Link>
              <Link href="/manufacturers" className="px-6 py-3 bg-[#145a2c] hover:bg-[#0f4a23] text-white rounded-xl font-medium text-sm transition-colors">
                Browse Manufacturers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-green-300 text-xs mb-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span>Register Company</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Register Your Company</h1>
          <p className="text-green-200 text-sm">
            Join India&apos;s leading EV marketplace. List your electric vehicles and reach thousands of buyers.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${step >= s.number ? 'bg-[#145a2c] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {step > s.number ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step >= s.number ? 'text-[#145a2c]' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 sm:mx-3 transition-all duration-300 ${step > s.number ? 'bg-[#145a2c]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Company Information</h2>
                <p className="text-sm text-gray-500">Tell us about your company. Fields marked * are required.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Company / Brand Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      onBlur={() => setFormData({ ...formData, slug: slugify(formData.company_name) })}
                      placeholder="e.g. Ather Energy"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 transition-all ${errors.company_name ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-[#145a2c]'}`}
                    />
                  </div>
                  {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your company and its EV products..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="India"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 transition-all ${errors.country ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-[#145a2c]'}`}
                  />
                  {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Headquarters Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.headquarters}
                      onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                      placeholder="e.g. Bengaluru, Karnataka"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Founded Year</label>
                  <input
                    type="number"
                    value={formData.founded_year}
                    onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                    placeholder="e.g. 2013"
                    min={1800}
                    max={new Date().getFullYear()}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 transition-all ${errors.founded_year ? 'border-red-300' : 'border-gray-200 focus:border-[#145a2c]'}`}
                  />
                  {errors.founded_year && <p className="text-xs text-red-500 mt-1">{errors.founded_year}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total EV Models</label>
                  <input
                    type="number"
                    value={formData.total_models}
                    onChange={(e) => setFormData({ ...formData, total_models: e.target.value })}
                    placeholder="e.g. 5"
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c] transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.yourcompany.com"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 transition-all ${errors.website ? 'border-red-300' : 'border-gray-200 focus:border-[#145a2c]'}`}
                    />
                  </div>
                  {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website}</p>}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Contact Details</h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Person</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        placeholder="Full name of contact person"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="contact@company.com"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 transition-all ${errors.contact_email ? 'border-red-300' : 'border-gray-200 focus:border-[#145a2c]'}`}
                      />
                    </div>
                    {errors.contact_email && <p className="text-xs text-red-500 mt-1">{errors.contact_email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.support_phone}
                        onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
                        placeholder="+91-XXX-XXX-XXXX"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 transition-all ${errors.support_phone ? 'border-red-300' : 'border-gray-200 focus:border-[#145a2c]'}`}
                      />
                    </div>
                    {errors.support_phone && <p className="text-xs text-red-500 mt-1">{errors.support_phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full office address"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Brand Media</h2>
                <p className="text-sm text-gray-500">Upload your company logo and hero image. These will appear on your manufacturer page.</p>
              </div>
              <ImageUpload
                bucket="manufacturers"
                onImageUrl={(url) => setFormData({ ...formData, logo_url: url })}
                currentImageUrl={formData.logo_url}
                label="Company Logo"
                recommendedWidth={400}
                recommendedHeight={200}
                helpText="PNG or JPG, up to 5MB. Will be optimized to WebP."
              />
              <ImageUpload
                bucket="manufacturers"
                onImageUrl={(url) => setFormData({ ...formData, hero_image_url: url })}
                currentImageUrl={formData.hero_image_url}
                label="Hero Banner Image"
                recommendedWidth={1200}
                recommendedHeight={600}
                helpText="A wide banner image for your manufacturer page header."
              />
            </div>
          )}

          {/* Step 3: Vehicle Bulk Upload */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Add Your Vehicles</h2>
                <p className="text-sm text-gray-500">
                  Upload your vehicle data using our spreadsheet template. This step is optional — you can skip it and add vehicles later.
                </p>
              </div>
              <VehicleBulkUpload
                onVehiclesChange={setVehicles}
                onErrorsChange={setVehicleErrors}
              />
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Review &amp; Submit</h2>
                <p className="text-sm text-gray-500">Please review your information before submitting.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-cover bg-white" onError={(e) => { e.currentTarget.src = '/images/placeholders/image.png'; }} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#145a2c]/10 flex items-center justify-center">
                      <Building2 size={20} className="text-[#145a2c]" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">{formData.company_name || 'Company Name'}</h3>
                    <p className="text-xs text-gray-500">{formData.country} {formData.headquarters && `\u2022 ${formData.headquarters}`}</p>
                  </div>
                </div>
                <ReviewField label="Description" value={formData.description} />
                <ReviewField label="Website" value={formData.website} />
                <ReviewField label="Founded Year" value={String(formData.founded_year)} />
                <ReviewField label="Total Models" value={String(formData.total_models)} />
                <ReviewField label="Contact Person" value={formData.contact_person} />
                <ReviewField label="Email" value={formData.contact_email} />
                <ReviewField label="Phone" value={formData.support_phone} />
                <ReviewField label="Address" value={formData.address} />
              </div>

              {vehicles.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-1">
                    <FileSpreadsheet size={16} />
                    {vehicles.length} Vehicle{vehicles.length !== 1 ? 's' : ''} Ready for Submission
                  </div>
                  <p className="text-xs text-green-600">These vehicles will be reviewed by admin alongside your company registration.</p>
                </div>
              )}

              <div className="bg-amber-50 rounded-xl p-4 flex gap-3">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-semibold mb-0.5">Admin Review Required</p>
                  <p className="text-xs">Your submission will be reviewed by our admin team before it appears publicly. This typically takes 1-2 business days.</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} /> Back
            </button>
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[#145a2c] hover:bg-[#0f4a23] text-white rounded-xl text-sm font-medium transition-colors"
              >
                {step === 3 && vehicles.length === 0 ? 'Skip' : 'Continue'} <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#145a2c] hover:bg-[#0f4a23] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  if (!value || value === '') return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
