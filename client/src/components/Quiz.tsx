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
  
  // Replace per-question timer with quiz timer
  const [quizTimeLeft, setQuizTimeLeft] = useState(settings.quizDurationSeconds);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [quizEnded, setQuizEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const timerRef = useRef<number | null>(null);
  const shuffledQuestionsRef = useRef<Question[]>([]);

  // Shuffle and prepare questions immediately on mount
  useEffect(() => {
    if (questions && questions.length > 0) {
      shuffledQuestionsRef.current = [...questions].sort(() => Math.random() - 0.5);
      console.log(`Loaded ${shuffledQuestionsRef.current.length} questions`);
      setIsLoading(false);
    } else {
      console.log("No questions available yet", questions);
    }
  }, [questions]);

  // Handle quiz end
  useEffect(() => {
    if (quizEnded) {
      console.log(`Quiz ended: Score ${score}, Answered ${answeredQuestions}, Correct ${correctAnswers}`);
      console.log(`Total questions: ${shuffledQuestionsRef.current.length}`);
      onQuizEnd(score, answeredQuestions, correctAnswers);
    }
  }, [quizEnded, score, answeredQuestions, correctAnswers, onQuizEnd]);

  // Quiz timer functionality - counts down for the entire quiz
  useEffect(() => {
    if (isTimerRunning && quizTimeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        setQuizTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (quizTimeLeft === 0) {
      // Time's up for the whole quiz
      setIsTimerRunning(false);
      setQuizEnded(true);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [quizTimeLeft, isTimerRunning]);

  const handleAnswerClick = (answerIndex: number) => {
    if (selectedAnswer !== null || !isTimerRunning) {
      return; // Prevent double answering
    }

    setSelectedAnswer(answerIndex);
    // Don't stop the timer when answering a question

    const currentQuestion = shuffledQuestionsRef.current[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    setIsAnswerCorrect(isCorrect);

    if (isCorrect) {
      // Use the question's points directly (no time bonus)
      const points = currentQuestion.points;
      setScore((prev) => prev + points);
      setCorrectAnswers((prev) => prev + 1);
    } else if (settings.livesEnabled) {
      // Only deduct lives if the feature is enabled
      setLives((prev) => prev - 1);
    }

    setAnsweredQuestions((prev) => prev + 1);

    // Move to the next question after a delay, but keep the timer running
    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const moveToNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    
    // Don't reset the timer for each question
    
    // Check if there are more questions and if we still have lives (or if lives feature is disabled)
    if (currentQuestionIndex + 1 < shuffledQuestionsRef.current.length && 
        (!settings.livesEnabled || lives > 0)) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // End the quiz
      setQuizEnded(true);
    }
  };

  // Format time to display as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // If still loading
  if (isLoading) {
    return <div className="p-8 text-center font-pixel">Loading questions...</div>;
  }

  // If we don't have any questions after loading
  if (!shuffledQuestionsRef.current.length) {
    return <div className="p-8 text-center font-pixel">No questions available. Please add some questions in the admin panel.</div>;
  }

  // If the quiz has ended
  if (quizEnded) {
    return <div className="p-8 text-center font-pixel">Finishing quiz...</div>;
  }

  // If we're out of questions or lives (if lives feature is enabled), end the quiz
  if (currentQuestionIndex >= shuffledQuestionsRef.current.length || 
      (settings.livesEnabled && lives <= 0)) {
    setQuizEnded(true);
    return <div className="p-8 text-center font-pixel">Finishing quiz...</div>;
  }

  const currentQuestion = shuffledQuestionsRef.current[currentQuestionIndex];
  
  return (
    <div className="relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {/* Hearts/Lives Display - Only show if lives feature is enabled */}
        {settings.livesEnabled && (
          <div className="flex items-center space-x-1 bg-white p-2 rounded-lg border-4 border-black">
            {Array.from({ length: lives }).map((_, index) => (
              <PixelHeart key={index} />
            ))}
          </div>
        )}
        <div className={`font-pixel text-sm bg-black text-white p-3 rounded-lg border-2 border-gray-800 ${!settings.livesEnabled ? 'ml-auto' : ''}`}>
          <span className="mr-2">SCORE:</span>
          <span className="text-pixel-yellow">{score}</span>
        </div>
      </div>

      {/* Main Quiz Container with black border and yellow corners */}
      <div className="relative">
        {/* Border */}
        <div className="absolute inset-0 border-8 border-black rounded-lg"></div>
        
        {/* Yellow corner accents */}
        <div className="absolute w-8 h-8 bg-pixel-yellow top-0 left-0 rounded-tl-lg z-10"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow top-0 right-0 rounded-tr-lg z-10"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow bottom-0 left-0 rounded-bl-lg z-10"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow bottom-0 right-0 rounded-br-lg z-10"></div>

        <div className="relative z-20">
          {/* Quiz Title Bar with Timer */}
          <div className="bg-pixel-yellow p-4 flex justify-between items-center">
            <h2 className="font-pixel text-2xl text-black">QUIZ TIME!</h2>
            <div className="font-pixel text-xl text-black">{formatTime(quizTimeLeft)}</div>
          </div>

          {/* Timer Bar */}
          <div className="bg-pixel-red h-6 w-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-pixel-yellow rounded-full"></div>
                ))}
              </div>
            </div>
            <div 
              className="bg-pixel-red h-full transition-all duration-1000" 
              style={{ width: `${(quizTimeLeft / settings.quizDurationSeconds) * 100}%` }}
            ></div>
          </div>

          {/* Question Card */}
          <div className="bg-white p-6">
            <div className="border-l-4 border-pixel-yellow pl-4 mb-8">
              <h3 className="font-pixel text-lg">{currentQuestion.question}</h3>
            </div>
            
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button 
                  key={index}
                  onClick={() => handleAnswerClick(index)}
                  className={`w-full text-left px-4 py-4 font-pixel-text text-lg border-4 border-black flex items-center ${
                    selectedAnswer === index 
                      ? isAnswerCorrect 
                        ? 'bg-green-100' 
                        : 'bg-white'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                  disabled={selectedAnswer !== null || !isTimerRunning}
                >
                  <span className="inline-block w-8 h-8 bg-black text-white font-pixel flex items-center justify-center mr-3">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </button>
              ))}
            </div>
            
            {/* Feedback message */}
            {isAnswerCorrect !== null && (
              <div className="mt-6 p-4 text-center font-pixel border-4 border-black bg-green-100 text-black">
                {isAnswerCorrect 
                  ? 'Correct! Good job!' 
                  : settings.livesEnabled 
                    ? 'Incorrect! You lost a life!' 
                    : 'Incorrect! Try the next question.'}
                <div className="mt-2 text-center text-green-600">
                  <span>▼</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
