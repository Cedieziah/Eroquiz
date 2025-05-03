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
  const [scoreAnimation, setScoreAnimation] = useState(false); // For score animation
  const [feedbackAnimation, setFeedbackAnimation] = useState(false); // For feedback message animation
  
  // New state variables for question navigation
  const [answeredQuestionsMap, setAnsweredQuestionsMap] = useState<Record<number, boolean>>({});
  const [visitedQuestionsMap, setVisitedQuestionsMap] = useState<Record<number, boolean>>({});
  const [showNavigationTooltip, setShowNavigationTooltip] = useState(false);

  const timerRef = useRef<number | null>(null);
  const shuffledQuestionsRef = useRef<Question[]>([]);

  // Shuffle and prepare questions immediately on mount
  useEffect(() => {
    if (questions && questions.length > 0) {
      shuffledQuestionsRef.current = [...questions].sort(() => Math.random() - 0.5);
      console.log(`Loaded ${shuffledQuestionsRef.current.length} questions`);
      
      // Mark the first question as visited when quiz starts
      setVisitedQuestionsMap(prev => ({ ...prev, 0: true }));
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
    
    // Mark this question as answered in our map
    setAnsweredQuestionsMap(prev => ({ ...prev, [currentQuestionIndex]: true }));
    
    // Trigger feedback animation
    setFeedbackAnimation(true);
    
    if (isCorrect) {
      // Use the question's points directly (no time bonus)
      const points = currentQuestion.points;
      setScore((prev) => prev + points);
      setCorrectAnswers((prev) => prev + 1);
      
      // Animate the score
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), 1000);
    } else if (settings.livesEnabled) {
      // Only deduct lives if the feature is enabled
      setLives((prev) => prev - 1);
    }

    setAnsweredQuestions((prev) => prev + 1);

    // Move to the next question after a delay, but keep the timer running
    setTimeout(() => {
      setFeedbackAnimation(false); // Reset animation before moving to next question
      moveToNextQuestion();
    }, 1500);
  };

  const moveToNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    
    // Count the total number of answered questions
    const totalAnsweredQuestions = Object.values(answeredQuestionsMap).filter(Boolean).length;
    const allQuestionsAnswered = totalAnsweredQuestions === shuffledQuestionsRef.current.length;
    
    // If all questions have been answered, end the quiz
    if (allQuestionsAnswered || (settings.livesEnabled && lives <= 0)) {
      setQuizEnded(true);
      return;
    }
    
    // Find the next unanswered question
    let nextIndex = currentQuestionIndex + 1;
    
    // If we're at the last question, loop back to find any unanswered questions
    if (nextIndex >= shuffledQuestionsRef.current.length) {
      // Find the first unanswered question from the beginning
      nextIndex = 0;
      while (nextIndex < shuffledQuestionsRef.current.length && answeredQuestionsMap[nextIndex]) {
        nextIndex++;
      }
      
      // If we couldn't find any unanswered questions, which shouldn't happen at this point, end the quiz
      if (nextIndex >= shuffledQuestionsRef.current.length) {
        setQuizEnded(true);
        return;
      }
    } else {
      // If the next question is already answered, find the next unanswered one
      while (nextIndex < shuffledQuestionsRef.current.length && answeredQuestionsMap[nextIndex]) {
        nextIndex++;
      }
      
      // If we couldn't find an unanswered question after the current one, 
      // loop back to the beginning to search for any remaining unanswered questions
      if (nextIndex >= shuffledQuestionsRef.current.length) {
        nextIndex = 0;
        while (nextIndex < currentQuestionIndex && answeredQuestionsMap[nextIndex]) {
          nextIndex++;
        }
        
        // If we still couldn't find any unanswered questions, end the quiz
        if (nextIndex >= currentQuestionIndex) {
          setQuizEnded(true);
          return;
        }
      }
    }
    
    // Set the new question index and mark it as visited
    setCurrentQuestionIndex(nextIndex);
    setVisitedQuestionsMap(prev => ({ ...prev, [nextIndex]: true }));
  };
  
  // Navigation functions
  const navigateToQuestion = (index: number) => {
    // Don't allow navigation if:
    // 1. User tries to navigate to the current question
    // 2. User tries to navigate to a question they've already answered
    // 3. Timer has stopped
    if (
      index === currentQuestionIndex ||
      answeredQuestionsMap[index] ||
      !isTimerRunning
    ) {
      return;
    }
    
    // Only allow navigation to questions that are within range
    if (index >= 0 && index < shuffledQuestionsRef.current.length) {
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setCurrentQuestionIndex(index);
      // Mark as visited
      setVisitedQuestionsMap(prev => ({ ...prev, [index]: true }));
    }
  };
  
  const toggleNavigationTooltip = () => {
    setShowNavigationTooltip(prev => !prev);
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
        <div className={`font-pixel text-sm bg-black text-white p-3 rounded-lg border-2 border-gray-800 ${!settings.livesEnabled ? 'ml-auto' : ''} ${scoreAnimation ? 'animate-bounce' : ''}`}>
          <span className="mr-2">SCORE:</span>
          <span className={`text-pixel-yellow ${scoreAnimation ? 'text-2xl' : ''}`}>{score}</span>
        </div>
      </div>

      {/* Main Quiz Container with black border and yellow corners */}
      <div className="relative flex">
        {/* Main Quiz Panel */}
        <div className="relative flex-grow">
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
                    className={`w-full text-left px-4 py-4 font-pixel-text text-lg border-4 border-black flex items-center transition-all duration-200 ${
                      selectedAnswer === index 
                        ? isAnswerCorrect 
                          ? 'bg-green-100 border-green-500 shake-correct' 
                          : 'bg-red-100 border-red-500 shake-incorrect'
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
                <div className={`mt-6 p-4 text-center font-pixel border-4 border-black ${
                  isAnswerCorrect 
                    ? 'bg-green-100 border-green-500 text-green-800' 
                    : 'bg-red-100 border-red-500 text-red-800'
                  } ${feedbackAnimation ? 'animate-pulse' : ''}`}>
                  {isAnswerCorrect 
                    ? 'Correct! Good job! ✅' 
                    : settings.livesEnabled 
                      ? 'Incorrect! You lost a life! ❌' 
                      : 'Incorrect! Try the next question. ❌'}
                  <div className="mt-2 text-center">
                    <span className={isAnswerCorrect ? 'text-green-600' : 'text-red-600'}>▼</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation Panel */}
        <div className="ml-4 relative">
          {/* Navigation tooltip */}
          {showNavigationTooltip && (
            <div className="absolute -top-10 -right-2 bg-black text-white font-pixel text-xs p-2 rounded-lg z-30">
              Navigate between questions
              <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-4 h-4 bg-black"></div>
            </div>
          )}

          {/* Info button */}
          <button 
            className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white font-bold rounded-full flex items-center justify-center z-30"
            onClick={toggleNavigationTooltip}
            aria-label="Navigation info"
          >
            i
          </button>
          
          {/* Navigation container */}
          <div className="bg-black bg-opacity-80 border-4 border-black p-2 rounded-lg">
            <h3 className="font-pixel text-white text-center mb-2 text-sm">Questions</h3>
            
            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1">
              {shuffledQuestionsRef.current.map((_, index) => {
                const isCurrentQuestion = index === currentQuestionIndex;
                const isAnswered = answeredQuestionsMap[index] === true;
                const isVisited = visitedQuestionsMap[index] === true;
                
                let bgColor = "bg-gray-700"; // default for unvisited
                let textColor = "text-white";
                let extraClasses = "";
                
                if (isAnswered) {
                  bgColor = "bg-green-700";
                  textColor = "text-white";
                  extraClasses = "cursor-not-allowed";
                } else if (isCurrentQuestion) {
                  bgColor = "bg-pixel-yellow";
                  textColor = "text-black";
                  extraClasses = "border-2 border-white";
                } else if (isVisited) {
                  bgColor = "bg-blue-600";
                  textColor = "text-white";
                }
                
                return (
                  <button
                    key={index}
                    className={`${bgColor} ${textColor} ${extraClasses} w-8 h-8 font-pixel flex items-center justify-center rounded-md transition-all hover:opacity-80`}
                    onClick={() => navigateToQuestion(index)}
                    disabled={isCurrentQuestion || isAnswered || !isTimerRunning}
                    title={isAnswered ? "Already answered" : isCurrentQuestion ? "Current question" : isVisited ? "Visited" : "Jump to this question"}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-3 px-2">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-pixel-yellow rounded-sm mr-2"></div>
                <span className="text-white font-pixel text-xs">Current</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-green-700 rounded-sm mr-2"></div>
                <span className="text-white font-pixel text-xs">Answered</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-blue-600 rounded-sm mr-2"></div>
                <span className="text-white font-pixel text-xs">Visited</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-700 rounded-sm mr-2"></div>
                <span className="text-white font-pixel text-xs">Unvisited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
