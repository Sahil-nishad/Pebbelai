import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

/* ===================== AUTH HELPERS ===================== */

export async function signUpUser(email, password) {
  return await supabase.auth.signUp({ email, password });
}

export async function signInUser(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOutUser() {
  return await supabase.auth.signOut();
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) {
    alert("Google Login Error: " + error.message);
    console.error(error);
  }
  return { data, error };
}

/* ===================== RESUME DATABASE HELPERS ===================== */

// Fetch all resumes for the currently logged-in user
export async function fetchUserResumes() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .order('updated_at', { ascending: false });

  return { data, error };
}

// Save a new or existing resume
export async function saveResumeToDB(resumeId, templateId, formData, layoutSettings) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Attempt to upsert (insert or update) based on resume ID
  const { data, error } = await supabase
    .from('resumes')
    .upsert({
      id: resumeId || undefined,
      user_id: user.id,
      template_id: templateId,
      form_data: formData,
      layout_settings: layoutSettings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  return { data, error };
}

// Delete a resume
export async function deleteResumeFromDB(resumeId) {
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId);
    
  return { error };
}

