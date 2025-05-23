import { useState, useEffect } from "react";
import Login from "@/components/Login";
import CategorySelection from "@/components/CategorySelection";
import Rules from "@/components/Rules";
import Quiz from "@/components/Quiz";
import Score from "@/components/Score";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Question, Settings } from "@shared/schema";
import { saveScore } from '../services/supabase';

type GameStage = "login" | "category" | "rules" | "quiz" | "score";

export default function Home() {
  const [gameStage, setGameStage] = useState<GameStage>("login");
  const [playerName, setPlayerName] = useState<string>("");
  const [playerCategory, setPlayerCategory] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<any>(null);
  const queryClient = useQueryClient();
  
  // Fetch questions from the server
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    staleTime: Infinity,
  });
  
  // Fetch game settings from the server
  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    staleTime: Infinity,
  });
  
  // Prefetch and prepare data as soon as possible
  useEffect(() => {
    // Pre-load the data on component mount
    const prefetchData = async () => {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["/api/questions"],
          staleTime: Infinity,
        }),
        queryClient.prefetchQuery({
          queryKey: ["/api/settings"],
          staleTime: Infinity,
        })
      ]);
      setIsReady(true);
    };
    
    prefetchData();
  }, [queryClient]);
  
  const handleStartGame = (name: string) => {
    setPlayerName(name);
    setGameStage("category");
  };

  const handleCategorySelect = (category: number) => {
    setPlayerCategory(category);
    setGameStage("rules");
    
    // Prefetch data when category is selected
    queryClient.prefetchQuery({
      queryKey: ["/api/questions"],
      staleTime: Infinity,
    });
    queryClient.prefetchQuery({
      queryKey: ["/api/settings"],
      staleTime: Infinity,
    });
  };
  
  const handleStartQuiz = () => {
    // Start quiz immediately with cached data
    setGameStage("quiz");
    // Reset game state
    setScore(0);
    setCorrectAnswers(0);
    setQuestionsAnswered(0);
  };
  
  const handleQuizEnd = (finalScore: number, answered: number, correct: number, timeSpent?: number, reviewData?: any) => {
    setScore(finalScore);
    setQuestionsAnswered(answered);
    setCorrectAnswers(correct);
    setGameStage("score");
    
    // Save score to both local storage and Supabase
    if (playerName) {
      // First save to local storage
      fetch("/api/game-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName,
          score: finalScore,
          questionsAnswered: answered,
          correctAnswers: correct,
          category: playerCategory, // Add category to local storage
        }),
      }).catch(error => {
        console.error("Failed to save game session locally:", error);
      });
      
      // Then save to Supabase
      saveScore({
        playerName,
        score: finalScore,
        questionsAnswered: answered,
        correctAnswers: correct,
        timeSpentSeconds: timeSpent,
        category: playerCategory // Add category to Supabase
      }).catch(error => {
        console.error("Failed to save score to Supabase:", error);
      });
    }
    
    // Save reviewData for Score component
    setReviewData(reviewData);
  };
  
  const handlePlayAgain = () => {
    setGameStage("quiz");
    // Reset game state
    setScore(0);
    setCorrectAnswers(0);
    setQuestionsAnswered(0);
  };
  
  const handleBackToMain = () => {
    setGameStage("login");
    setPlayerName("");
    setPlayerCategory(1);
  };
  
  // Loading indicator - only show when absolutely necessary
  if (gameStage === "quiz" && (questionsLoading || settingsLoading || !settings)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white p-6 rounded-lg pixel-border my-12">
          <h1 className="text-pixel-yellow text-center font-pixel text-2xl mb-10">LOADING...</h1>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {gameStage === "login" && (
        <Login onStartGame={handleStartGame} />
      )}
      
      {gameStage === "category" && (
        <CategorySelection 
          onCategorySelect={handleCategorySelect} 
          playerName={playerName} 
        />
      )}
      
      {gameStage === "rules" && (
        <Rules onStartQuiz={handleStartQuiz} />
      )}
      
      {gameStage === "quiz" && settings && (
        <Quiz 
          questions={questions} 
          settings={settings}
          onQuizEnd={handleQuizEnd}
          category={playerCategory} // Pass category to Quiz
        />
      )}
      
      {gameStage === "score" && (
        <Score 
          playerName={playerName}
          score={score}
          questionsAnswered={questionsAnswered}
          correctAnswers={correctAnswers}
          onPlayAgain={handlePlayAgain}
          onBackToMain={handleBackToMain}
          category={playerCategory}
          reviewData={reviewData} // Pass review data to Score
        />
      )}
      
      {/* Admin Panel Toggle - Removed, now using heart instead */}
    </div>
  );
}
