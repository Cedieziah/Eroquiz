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

  const timerRef = useRef<number | null>(null);
  const shuffledQuestionsRef = useRef<Question[]>([]);

  // Shuffle and prepare questions immediately on mount
  useEffect(() => {
    shuffledQuestionsRef.current = [...questions].sort(() => Math.random() - 0.5);
    console.log(`Loaded ${shuffledQuestionsRef.current.length} questions`);
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
    } else {
      setLives((prev) => prev - 1); // Deduct a life for incorrect answers
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
    
    // Check if there are more questions and if we still have lives
    if (currentQuestionIndex + 1 < shuffledQuestionsRef.current.length && lives > 0) {
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

  // If we don't have any questions or the quiz has ended
  if (!shuffledQuestionsRef.current.length || quizEnded) {
    return <div>Loading...</div>;
  }

  // If we're out of questions or lives, end the quiz
  if (currentQuestionIndex >= shuffledQuestionsRef.current.length || lives <= 0) {
    setQuizEnded(true);
    return <div>Finishing quiz...</div>;
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

      {/* Quiz Title Bar with Timer */}
      <div className="bg-pixel-yellow rounded-t-lg p-4 flex justify-between items-center">
        <h2 className="font-pixel text-center text-2xl">QUIZ TIME!</h2>
        <div className="font-pixel text-xl">{formatTime(quizTimeLeft)}</div>
      </div>

      {/* Timer Bar */}
      <div className="bg-gray-200 h-6 w-full">
        <div 
          className="bg-pixel-red h-full transition-all duration-1000" 
          style={{ width: `${(quizTimeLeft / settings.quizDurationSeconds) * 100}%` }}
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
