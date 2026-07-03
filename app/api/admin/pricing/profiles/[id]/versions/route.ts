import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('pricing_profile_versions')
      .select('*')
      .eq('profile_id', id)
      .order('version_number', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ versions: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
