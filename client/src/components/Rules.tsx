import { useEffect, useState } from "react";
import PixelHeart from "./PixelHeart";
import { useQueryClient } from "@tanstack/react-query";
import { Settings } from "@shared/schema";

interface RulesProps {
  onStartQuiz: () => void;
}

export default function Rules({ onStartQuiz }: RulesProps) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Settings | null>(null);
  
  // Prefetch questions and settings as soon as Rules component mounts
  useEffect(() => {
    // Preload questions with high priority to ensure they're ready
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["/api/questions"],
        staleTime: Infinity,
      }),
      queryClient.prefetchQuery({
        queryKey: ["/api/settings"],
        staleTime: Infinity,
      })
    ]).then(() => {
      // Get settings to determine if lives are enabled
      const settingsData = queryClient.getQueryData<Settings>(["/api/settings"]);
      setSettings(settingsData || null);
    });
    
    // Warm up the quiz component
    setTimeout(() => {
      // Force data to be ready when user clicks "I UNDERSTAND"
      queryClient.setQueryData(["/api/questions"], 
        queryClient.getQueryData(["/api/questions"]) || []);
      queryClient.setQueryData(["/api/settings"],
        queryClient.getQueryData(["/api/settings"]));
    }, 1000);
  }, [queryClient]);
  
  return (
    <div className="bg-white p-6 rounded-lg pixel-border my-12">
      <h1 className="text-pixel-yellow text-center font-pixel text-4xl mb-10 leading-relaxed tracking-wider shadow-lg">QUIZ RULES</h1>
      
      <div className="mb-8 font-pixel-text text-xl leading-relaxed">
        <p className="mb-4">🎮 Welcome to EroQuiz! Here are the rules:</p>
        <ul className="list-disc pl-8 space-y-3">
          {/* Only show lives-related rules if lives are enabled */}
          {settings?.livesEnabled && (
            <>
              <li>You have <span className="font-bold text-pixel-red">{settings?.lives || 5} lives</span> to complete the quiz</li>
              <li>Incorrect answers will cost you a life</li>
            </>
          )}
          <li>Each question has a <span className="font-bold text-pixel-red">time limit</span></li>
          <li>The total quiz duration is <span className="font-bold text-pixel-red">{settings ? Math.round(settings.quizDurationSeconds / 60) : 5} minutes</span></li>
          {settings?.livesEnabled ? (
            <li>Answer as many questions as you can before losing all lives</li>
          ) : (
            <li>Answer as many questions as you can within the time limit</li>
          )}
          <li>Your final score will be displayed at the end</li>
        </ul>
      </div>
      
      <div className="text-center">
        <button 
          onClick={onStartQuiz}
          className="bg-pixel-yellow px-8 py-3 font-pixel text-pixel-dark pixel-border hover:bg-yellow-400 pixel-btn transition-all"
        >
          I UNDERSTAND
        </button>
      </div>
    </div>
  );
}
