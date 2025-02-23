import { supabase } from './supabase';
import { State } from './constants';

export interface UserData {
  branch: string;
  rankCategory: string;
  rank: string;
  jobCode: string;
  locationPreference: string;
  locationType?: 'CONUS' | 'OCONUS';
  location?: string;
  consideringAreas?: State[];
  locationAdditionalInfo?: string;
  careerGoal: string;
  educationLevel?: string;
  separationDate: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UpdateOptions {
  silent?: boolean;
}

export async function updateUserData(userData: UserData, options: UpdateOptions = { silent: false }) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No session available');

    // First check if user data exists
    const { data: existingData, error: checkError } = await supabase
      .from('user_data')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    let result;
    if (!existingData) {
      // Insert new record
      result = await supabase
        .from('user_data')
        .insert({
          user_id: session.user.id,
          branch: userData.branch,
          rank_category: userData.rankCategory,
          rank: userData.rank,
          job_code: userData.jobCode,
          location_preference: userData.locationPreference,
          location_type: userData.locationType,
          location: userData.location || '',
          considering_areas: userData.consideringAreas,
          location_additional_info: userData.locationAdditionalInfo,
          career_goal: userData.careerGoal,
          education_level: userData.educationLevel,
          separation_date: userData.separationDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    } else {
      // Update existing record
      result = await supabase
        .from('user_data')
        .update({
          branch: userData.branch,
          rank_category: userData.rankCategory,
          rank: userData.rank,
          job_code: userData.jobCode,
          location_preference: userData.locationPreference,
          location_type: userData.locationType,
          location: userData.location || '',
          considering_areas: userData.consideringAreas,
          location_additional_info: userData.locationAdditionalInfo,
          career_goal: userData.careerGoal,
          education_level: userData.educationLevel,
          separation_date: userData.separationDate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return result.data;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

export async function getUserData(): Promise<UserData | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No session available');

    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      throw error;
    }

    return {
      branch: data.branch || '',
      rankCategory: data.rank_category || '',
      rank: data.rank || '',
      jobCode: data.job_code || '',
      locationPreference: data.location_preference || '',
      locationType: data.location_type,
      location: data.location,
      consideringAreas: data.considering_areas,
      locationAdditionalInfo: data.location_additional_info,
      careerGoal: data.career_goal || '',
      educationLevel: data.education_level,
      separationDate: data.separation_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
} 