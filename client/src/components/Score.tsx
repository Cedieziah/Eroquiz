import { useState } from 'react';
import Leaderboard from './Leaderboard';
import { useQuery } from '@tanstack/react-query';

interface ScoreProps {
  playerName: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  onPlayAgain: () => void;
  onBackToMain: () => void;
  category: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function Score({
  playerName,
  score,
  questionsAnswered,
  correctAnswers,
  onPlayAgain,
  onBackToMain,
  category
}: ScoreProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Fetch categories from API instead of hardcoding them
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (showLeaderboard) {
    return <Leaderboard onClose={() => setShowLeaderboard(false)} category={category} />;
  }

  // Get category name based on the category ID using fetched categories
  const getCategoryName = (categoryId: number): string => {
    const foundCategory = categories.find(c => c.id === categoryId);
    if (foundCategory) {
      return `${foundCategory.name} (${foundCategory.description})`;
    }
    return "Unknown";
  };

  return (
    <div className="pixel-container animate-fade-in">
      <div className="bg-white p-8 rounded-lg shadow-xl pixel-border-thick relative overflow-hidden">
        <div className="pixel-corner top-left"></div>
        <div className="pixel-corner top-right"></div>
        <div className="pixel-corner bottom-left"></div>
        <div className="pixel-corner bottom-right"></div>
        
        {/* Stylized header */}
        <h1 className="text-pixel-yellow font-pixel text-4xl md:text-5xl text-center mb-8 animate-pulse-slow tracking-widest game-over-text">
          GAME OVER
        </h1>
        
        {/* Score information with pixel styling */}
        <div className="score-container mb-8">
          <div className="score-row">
            <span className="font-pixel text-pixel-blue text-lg">PLAYER:</span>
            <span className="font-pixel-text text-xl">{playerName}</span>
          </div>
          
          <div className="score-row">
            <span className="font-pixel text-pixel-blue text-lg">CATEGORY:</span>
            <span className="font-pixel-text text-xl">{getCategoryName(category)}</span>
          </div>
          
          <div className="score-row">
            <span className="font-pixel text-pixel-blue text-lg">FINAL SCORE:</span>
            <span className="font-pixel text-2xl text-pixel-red animate-pulse-slow">{score}</span>
          </div>
          
          <div className="score-row">
            <span className="font-pixel text-pixel-blue text-lg">QUESTIONS:</span>
            <span className="font-pixel-text text-xl">{questionsAnswered}</span>
          </div>
          
          <div className="score-row">
            <span className="font-pixel text-pixel-blue text-lg">CORRECT:</span>
            <span className="font-pixel-text text-xl">{correctAnswers}</span>
          </div>
          
          <div className="score-row">
            <span className="font-pixel text-pixel-blue text-lg">ACCURACY:</span>
            <span className="font-pixel-text text-xl">
              {Math.round((correctAnswers / questionsAnswered) * 100) || 0}%
            </span>
          </div>
        </div>
        
        {/* Button container with pixel styling */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => setShowLeaderboard(true)}
            className="btn-pixel bg-pixel-yellow text-pixel-dark font-pixel py-4 px-6 hover:brightness-110 transform hover:scale-105 transition-all"
          >
            VIEW LEADERBOARD
          </button>
          
          <button 
            onClick={onPlayAgain}
            className="btn-pixel bg-pixel-green text-white font-pixel py-4 px-6 hover:brightness-110 transform hover:scale-105 transition-all"
          >
            PLAY AGAIN
          </button>
          
          <button 
            onClick={onBackToMain}
            className="btn-pixel bg-pixel-blue text-white font-pixel py-4 px-6 hover:brightness-110 transform hover:scale-105 transition-all"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
