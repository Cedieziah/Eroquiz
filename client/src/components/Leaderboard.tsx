// client/src/components/Leaderboard.tsx
import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/supabase';

interface LeaderboardProps {
  onClose: () => void;
}

interface LeaderboardEntry {
  id: number;
  player_name: string;
  score: number;
  questions_answered: number; 
  correct_answers: number;
  time_spent_seconds?: number;
  created_at: string;
}

export default function Leaderboard({ onClose }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaderboard(data);
      setLoading(false);
    }
    
    fetchLeaderboard();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg pixel-border my-12">
      <h1 className="text-pixel-yellow text-center font-pixel text-3xl mb-6">GLOBAL LEADERBOARD</h1>
      
      {loading ? (
        <p className="text-center font-pixel-text">Loading scores...</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-center font-pixel-text">No scores recorded yet. Be the first!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-pixel-yellow">
                <th className="px-4 py-2 font-pixel text-left">Rank</th>
                <th className="px-4 py-2 font-pixel text-left">Player</th>
                <th className="px-4 py-2 font-pixel text-right">Score</th>
                <th className="px-4 py-2 font-pixel text-right">Correct</th>
                <th className="px-4 py-2 font-pixel text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={entry.id} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                  <td className="px-4 py-3 font-pixel-text">{index + 1}</td>
                  <td className="px-4 py-3 font-pixel-text">{entry.player_name}</td>
                  <td className="px-4 py-3 font-pixel-text text-right">{entry.score}</td>
                  <td className="px-4 py-3 font-pixel-text text-right">{entry.correct_answers}/{entry.questions_answered}</td>
                  <td className="px-4 py-3 font-pixel-text text-right">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="text-center mt-6">
        <button 
          onClick={onClose}
          className="bg-pixel-blue px-6 py-2 font-pixel text-white pixel-border hover:bg-blue-600 pixel-btn transition-all"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}