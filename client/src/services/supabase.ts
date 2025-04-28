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
        time_spent_seconds: data.timeSpentSeconds || null
      }]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving score to Supabase:", error);
    return false;
  }
}

export async function getLeaderboard(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching leaderboard from Supabase:", error);
    return [];
  }
}