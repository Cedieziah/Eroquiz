import { useState } from 'react';
import Leaderboard from './Leaderboard';

interface ScoreProps {
  playerName: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  onPlayAgain: () => void;
  onBackToMain: () => void;
  category: number;
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

  if (showLeaderboard) {
    return <Leaderboard onClose={() => setShowLeaderboard(false)} category={category} />;
  }

  // Get category name based on the category ID
  const getCategoryName = (categoryId: number): string => {
    switch (categoryId) {
      case 1: return "Grades 3-4";
      case 2: return "Grades 5-6";
      case 3: return "Grades 7-8";
      case 4: return "Grades 9-10";
      case 5: return "Grades 11-12";
      default: return "Unknown";
    }
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
