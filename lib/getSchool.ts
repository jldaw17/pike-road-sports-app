import { supabase } from './supabase';

export type ResolvedSchool = {
  id: string | number;
  slug: string;
};

export async function getSchoolFromSlug(schoolSlug: string) {
  const normalizedSlug = schoolSlug.trim();

  if (!normalizedSlug) {
    return null;
  }

  const { data, error } = await supabase
    .from('schools')
    .select('id, slug')
    .eq('slug', normalizedSlug)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ResolvedSchool | null;
}

export async function getSchoolIdFromSlug(schoolSlug: string) {
  const school = await getSchoolFromSlug(schoolSlug);
  return school?.id ?? null;
}
