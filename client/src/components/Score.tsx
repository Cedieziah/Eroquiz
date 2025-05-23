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
  reviewData?: {
    questions: any[];
    userAnswers: Record<number, number>;
  };
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
  category,
  reviewData
}: ScoreProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showReviewDetails, setShowReviewDetails] = useState(false);

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
        
        {/* Review Results Section - only show if we have review data */}
        {reviewData && (
          <div className="mt-4 mb-8">
            {showReviewDetails ? (
              <div className="bg-gray-50 p-4 border-4 border-black rounded-lg">
                <h3 className="font-pixel text-pixel-blue text-xl mb-4 text-center">QUESTION REVIEW</h3>
                
                <div className="max-h-[300px] overflow-y-auto">
                  {reviewData.questions.map((question, index) => {
                    const userAnswer = reviewData.userAnswers[index];
                    const isCorrect = userAnswer === question.correctAnswer;
                    
                    return (
                      <div key={index} className={`mb-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                        <div className="font-pixel-text mb-2">
                          <span className="font-pixel text-gray-700 mr-2">Q{index + 1}:</span>
                          {question.question}
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-pixel text-gray-700">Your answer: 
                            <span className={isCorrect ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                              {question.options[userAnswer]}
                            </span>
                          </p>
                          
                          {!isCorrect && (
                            <p className="font-pixel text-gray-700">Correct answer: 
                              <span className="text-green-600 ml-2">
                                {question.options[question.correctAnswer]}
                              </span>
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right mt-2">
                          <span className={`font-pixel px-3 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isCorrect ? '+' + question.points : '0'} points
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center mt-4">
                  <button 
                    onClick={() => setShowReviewDetails(false)}
                    className="font-pixel bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    HIDE DETAILS
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button 
                  onClick={() => setShowReviewDetails(true)}
                  className="font-pixel bg-pixel-green text-white px-6 py-3 rounded-lg hover:brightness-110 transition-all"
                >
                  REVIEW ANSWERS
                </button>
              </div>
            )}
          </div>
        )}
        
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
