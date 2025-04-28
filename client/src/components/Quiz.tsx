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

  // Timer functionality
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isTimerRunning]);

  const handleTimeUp = () => {
    setLives((prev) => prev - 1); // Deduct a life if time runs out
    setAnsweredQuestions((prev) => prev + 1);
    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const handleAnswerClick = (answerIndex: number) => {
    if (selectedAnswer !== null || !isTimerRunning) {
      return; // Prevent double answering or answering after the timer stops
    }

    setSelectedAnswer(answerIndex);
    setIsTimerRunning(false);

    const currentQuestion = shuffledQuestionsRef.current[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    setIsAnswerCorrect(isCorrect);

    if (isCorrect) {
      // Use the question's points instead of the global setting
      const basePoints = currentQuestion.points || settings.pointsPerCorrectAnswer;
      setScore((prev) => prev + basePoints);
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setLives((prev) => prev - 1); // Deduct a life for incorrect answers
    }

    setAnsweredQuestions((prev) => prev + 1);

    // Move to the next question after a delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const moveToNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setTimeLeft(settings.timerSeconds);
    setIsTimerRunning(true);

    // Check if there are more questions and if we still have lives
    if (currentQuestionIndex + 1 < shuffledQuestionsRef.current.length && lives > 0) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // End the quiz - this will trigger the useEffect that calls onQuizEnd
      setQuizEnded(true);
    }
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
