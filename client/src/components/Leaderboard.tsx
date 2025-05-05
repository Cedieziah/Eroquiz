// client/src/components/Leaderboard.tsx
import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/supabase';

interface LeaderboardProps {
  onClose: () => void;
  category?: number; // Make category optional for standalone leaderboard page
}

interface LeaderboardEntry {
  id: number;
  player_name: string;
  score: number;
  questions_answered: number; 
  correct_answers: number;
  time_spent_seconds?: number;
  created_at: string;
  category: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function Leaderboard({ onClose, category }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(category);
  
  const categories: Category[] = [
    { id: 0, name: "All Categories", description: "All Grades" },
    { id: 1, name: "Category 1", description: "Grades 3-4" },
    { id: 2, name: "Category 2", description: "Grades 5-6" },
    { id: 3, name: "Category 3", description: "Grades 7-8" },
    { id: 4, name: "Category 4", description: "Grades 9-10" },
    { id: 5, name: "Category 5", description: "Grades 11-12" }
  ];

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      const data = await getLeaderboard(20, selectedCategory);
      setLeaderboard(data);
      setLoading(false);
    }
    
    fetchLeaderboard();
  }, [selectedCategory]);

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId === 0 ? undefined : categoryId);
  };

  // Find the current category name
  const currentCategory = categories.find(cat => 
    (cat.id === 0 && selectedCategory === undefined) || cat.id === selectedCategory
  );

  return (
    <div className="bg-white p-6 rounded-lg pixel-border my-12">
      <h1 className="text-pixel-yellow text-center font-pixel text-3xl mb-6">LEADERBOARD</h1>
      
      {/* Category selector */}
      <div className="mb-6">
        <h2 className="font-pixel text-center mb-3">{currentCategory?.name || "All Categories"}</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`p-2 text-sm border-2 border-black font-pixel transition-all ${
                (cat.id === 0 && selectedCategory === undefined) || cat.id === selectedCategory
                  ? "bg-pixel-blue text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <p className="text-center font-pixel-text">Loading scores...</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-center font-pixel-text">No scores recorded yet for this category.</p>
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