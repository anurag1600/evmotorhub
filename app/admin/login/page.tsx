'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      router.replace(redirect);
    }
  }, [adminLoading, isAdmin, redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!user) throw new Error('Login failed');

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError) {
        await supabase.auth.signOut();
        throw new Error(`Database error: ${adminError.message}`);
      }

      if (!adminUser) {
        await supabase.auth.signOut();
        throw new Error('Access denied. You are not an admin.');
      }

      if (!adminUser.is_active) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Account is inactive.');
      }

      setSuccess('Login successful! Redirecting...');
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a2e14] to-[#145a2c] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-300" />
      </div>
    );
  }

  if (isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2e14] to-[#145a2c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/EV_logo_White.webp"
              alt="EVMotorHub"
              width={160}
              height={40}
              className="h-10 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-green-200 text-sm">EVMotorHub Management Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@evmotorhub.in"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
              />
            </div>

            {/* Errors */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-red-700">{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#145a2c] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#0f4020] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in to Admin'}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600">
            <p className="font-semibold mb-1">Admin Access:</p>
            <p>Contact your administrator for access credentials or password reset.</p>
          </div>

          {/* Back to Site */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-[#145a2c] text-sm font-medium hover:underline">
              &larr; Back to Website
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-green-200 text-xs mt-8">
          EVMotorHub Admin &bull; Secure Portal
        </p>
      </div>
    </div>
  );
}
