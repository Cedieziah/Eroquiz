// client/src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kisyohitdycdkevyvpxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpc3lvaGl0ZHljZGtldnl2cHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MTMwODYsImV4cCI6MjA2MTM4OTA4Nn0.rLLnKo8hlr-CXZ8gkt0jbasOWZhhh5U28q3uLQegk0M';

export const supabase = createClient(supabaseUrl, supabaseKey);

interface ScoreData {
  playerName: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  timeSpentSeconds?: number;
  category: number; // Added category field
}

export async function saveScore(data: ScoreData) {
  try {
    const { error } = await supabase
      .from('leaderboards')
      .insert([{
        player_name: data.playerName,
        score: data.score,
        questions_answered: data.questionsAnswered,
        correct_answers: data.correctAnswers,
        time_spent_seconds: data.timeSpentSeconds || null,
        category: data.category // Add category to the saved data
      }]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving score to Supabase:", error);
    return false;
  }
}

export async function getLeaderboard(limit = 20, category?: number) {
  try {
    let query = supabase
      .from('leaderboards')
      .select('*')
      .order('score', { ascending: false });
    
    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching leaderboard from Supabase:", error);
    return [];
  }
}

// Image management functions
const BUCKET_NAME = 'quiz-images';

export interface ImageInfo {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  size: number;
}

/**
 * Upload an image to Supabase storage
 */
export async function uploadImage(file: File): Promise<ImageInfo | null> {
  try {
    // Create a unique file name to prevent overwrites
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`public/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`public/${fileName}`);
    
    return {
      id: data.path,
      name: file.name,
      url: urlData.publicUrl,
      createdAt: new Date().toISOString(),
      size: file.size
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

/**
 * Get all images from the Supabase storage bucket
 */
export async function getImages(): Promise<ImageInfo[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('public', {
        sortBy: { column: 'created_at', order: 'desc' }
      });
      
    if (error) throw error;
    
    return data.map(item => {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`public/${item.name}`);
      
      return {
        id: item.id,
        name: item.name,
        url: urlData.publicUrl,
        createdAt: item.created_at,
        size: item.metadata?.size || 0
      };
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

/**
 * Delete an image from Supabase storage
 */
export async function deleteImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}