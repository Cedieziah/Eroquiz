import { useState, useEffect } from "react";
import Login from "@/components/Login";
import Rules from "@/components/Rules";
import Quiz from "@/components/Quiz";
import Score from "@/components/Score";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Question, Settings } from "@shared/schema";

type GameStage = "login" | "rules" | "quiz" | "score";

export default function Home() {
  const [gameStage, setGameStage] = useState<GameStage>("login");
  const [playerName, setPlayerName] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
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
    setGameStage("rules");
    
    // Prefetch again just to be sure data is ready when moving to rules
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
  
  const handleQuizEnd = (finalScore: number, answered: number, correct: number) => {
    setScore(finalScore);
    setQuestionsAnswered(answered);
    setCorrectAnswers(correct);
    setGameStage("score");
    
    // Save game session
    if (playerName) {
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
        }),
      }).catch(error => {
        console.error("Failed to save game session:", error);
      });
    }
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
      
      {gameStage === "rules" && (
        <Rules onStartQuiz={handleStartQuiz} />
      )}
      
      {gameStage === "quiz" && settings && (
        <Quiz 
          questions={questions} 
          settings={settings}
          onQuizEnd={handleQuizEnd}
        />
      )}
      
      {gameStage === "score" && (
        <Score 
          score={score}
          questionsAnswered={questionsAnswered}
          correctAnswers={correctAnswers}
          onPlayAgain={handlePlayAgain}
          onBackToMain={handleBackToMain}
        />
      )}
      
      {/* Admin Panel Toggle */}
      <div className="fixed bottom-4 right-4 z-10">
        <a 
          href="/admin"
          className="bg-pixel-dark text-white font-pixel px-4 py-2 cursor-pointer rounded-lg hover:bg-gray-700 inline-block"
        >
          ⚙️ ADMIN
        </a>
      </div>
    </div>
  );
}
