import { useState, useEffect, useRef } from "react";
import PixelHeart from "./PixelHeart";
import { Question, Settings } from "@shared/schema";

interface QuizProps {
  questions: Question[];
  settings: Settings;
  onQuizEnd: (score: number, answered: number, correct: number) => void;
}

export default function Quiz({ questions, settings, onQuizEnd }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lives, setLives] = useState(settings.lives);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timerSeconds);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  
  const timerRef = useRef<number | null>(null);
  const shuffledQuestionsRef = useRef<Question[]>([]);
  
  // Shuffle questions on mount
  useEffect(() => {
    shuffledQuestionsRef.current = [...questions].sort(() => Math.random() - 0.5);
    
    // Start with a fresh quiz
    setCurrentQuestionIndex(0);
    setLives(settings.lives);
    setScore(0);
    setTimeLeft(settings.timerSeconds);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setAnsweredQuestions(0);
    setCorrectAnswers(0);
    setIsTimerRunning(true);
  }, [questions, settings]);
  
  // Timer functionality
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      // Time's up, handle as incorrect answer
      handleTimeUp();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isTimerRunning]);
  
  const handleTimeUp = () => {
    setIsTimerRunning(false);
    setLives(prev => prev - 1);
    setIsAnswerCorrect(false);
    
    // Move to next question after a delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };
  
  const handleAnswerClick = (answerIndex: number) => {
    if (selectedAnswer !== null || !isTimerRunning) {
      return; // Already answered or timer stopped
    }
    
    setSelectedAnswer(answerIndex);
    setIsTimerRunning(false);
    
    const currentQuestion = shuffledQuestionsRef.current[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    setIsAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      // Calculate score: base points + time bonus
      const timeBonus = timeLeft * settings.timeBonus;
      const questionScore = settings.pointsPerCorrectAnswer + timeBonus;
      setScore(prev => prev + questionScore);
      setCorrectAnswers(prev => prev + 1);
    } else {
      setLives(prev => prev - 1);
    }
    
    setAnsweredQuestions(prev => prev + 1);
    
    // Move to next question after a delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };
  
  const moveToNextQuestion = () => {
    // If no more lives or no more questions, end the quiz
    if (lives <= 0 || currentQuestionIndex >= shuffledQuestionsRef.current.length - 1) {
      onQuizEnd(score, answeredQuestions, correctAnswers);
      return;
    }
    
    // Otherwise, move to the next question
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setTimeLeft(settings.timerSeconds);
    setIsTimerRunning(true);
  };
  
  // If we don't have any questions or we've gone through all questions
  if (!shuffledQuestionsRef.current.length || currentQuestionIndex >= shuffledQuestionsRef.current.length) {
    return (
      <div className="bg-white p-6 rounded-lg pixel-border my-12">
        <h2 className="text-pixel-yellow text-center font-pixel text-xl mb-6">No questions available!</h2>
        <div className="text-center">
          <button 
            onClick={() => onQuizEnd(score, answeredQuestions, correctAnswers)}
            className="bg-pixel-yellow px-8 py-3 font-pixel text-pixel-dark pixel-border hover:bg-yellow-400 pixel-btn transition-all"
          >
            FINISH
          </button>
        </div>
      </div>
    );
  }
  
  const currentQuestion = shuffledQuestionsRef.current[currentQuestionIndex];
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-1">
          {/* Hearts/Lives Display */}
          {Array.from({ length: lives }).map((_, index) => (
            <PixelHeart key={index} />
          ))}
        </div>
        <div className="font-pixel text-sm">
          <span className="mr-2">SCORE:</span>
          <span className="text-pixel-yellow">{score}</span>
        </div>
      </div>

      {/* Quiz Title Bar */}
      <div className="bg-pixel-yellow rounded-t-lg p-4">
        <h2 className="font-pixel text-center text-2xl">QUIZ START!</h2>
      </div>

      {/* Timer Bar */}
      <div className="bg-gray-200 h-6 w-full">
        <div 
          className="bg-pixel-red h-full transition-all duration-1000" 
          style={{ width: `${(timeLeft / settings.timerSeconds) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-6 rounded-b-lg pixel-border mb-8">
        <h3 className="font-pixel text-lg mb-6">{currentQuestion.question}</h3>
        
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <button 
              key={index}
              onClick={() => handleAnswerClick(index)}
              className={`w-full text-left px-4 py-3 font-pixel-text text-xl transition-all ${
                selectedAnswer === index 
                  ? isAnswerCorrect 
                    ? 'bg-green-200 border-4 border-green-500' 
                    : 'bg-red-200 border-4 border-red-500'
                  : 'bg-gray-100 border-4 border-pixel-dark hover:bg-pixel-yellow hover:border-pixel-yellow'
              }`}
              disabled={selectedAnswer !== null || !isTimerRunning}
            >
              {String.fromCharCode(65 + index)}. {option}
            </button>
          ))}
        </div>
        
        {/* Feedback message */}
        {isAnswerCorrect !== null && (
          <div className={`mt-4 p-2 text-center font-pixel text-sm ${
            isAnswerCorrect ? 'text-green-600' : 'text-red-600'
          }`}>
            {isAnswerCorrect 
              ? 'Correct! Good job!' 
              : 'Incorrect! You lost a life!'}
          </div>
        )}
      </div>
    </div>
  );
}
