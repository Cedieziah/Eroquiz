import { useState, useEffect, useRef } from "react";
import PixelHeart from "./PixelHeart";
import { Question, Settings } from "@shared/schema";
import { useToast } from "../hooks/use-toast";

interface QuizProps {
  questions: Question[];
  settings: Settings;
  onQuizEnd: (score: number, answered: number, correct: number, timeSpent?: number, reviewData?: any) => void;
  category: number; // Add category prop
}

export default function Quiz({ questions, settings, onQuizEnd, category }: QuizProps) {
  const { toast } = useToast(); // Add the toast hook
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lives, setLives] = useState(settings.lives);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
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
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [visitedQuestionsMap, setVisitedQuestionsMap] = useState<Record<number, boolean>>({});
  const [showNavigationTooltip, setShowNavigationTooltip] = useState(false);
  
  // States for review mode
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [isReviewMode] = useState(settings.reviewModeEnabled ?? false);

  // For handling image errors
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageLoadStatus, setImageLoadStatus] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});

  const timerRef = useRef<number | null>(null);
  const shuffledQuestionsRef = useRef<Question[]>([]);

  // Filter questions by category and shuffle them on mount
  useEffect(() => {
    if (questions && questions.length > 0) {
      // Filter questions by the selected category (check in categories array)
      const categoryQuestions = questions.filter(q => q.categories && q.categories.includes(category));
      
      if (categoryQuestions.length > 0) {
        shuffledQuestionsRef.current = [...categoryQuestions].sort(() => Math.random() - 0.5);
        console.log(`Loaded ${shuffledQuestionsRef.current.length} questions for category ${category}`);
      } else {
        // Fallback to all questions if no questions found for this category
        console.log(`No questions found for category ${category}, using all questions`);
        shuffledQuestionsRef.current = [...questions].sort(() => Math.random() - 0.5);
      }
      
      // Mark the first question as visited when quiz starts
      setVisitedQuestionsMap(prev => ({ ...prev, 0: true }));
      setIsLoading(false);
      setStartTime(Date.now());
    } else {
      console.log("No questions available yet", questions);
    }
  }, [questions, category]);

  // Handle quiz end
  useEffect(() => {
    if (quizEnded) {
      const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
      console.log(`Quiz ended: Score ${score}, Answered ${answeredQuestions}, Correct ${correctAnswers}, Time spent: ${timeSpentSeconds}s`);
      console.log(`Total questions: ${shuffledQuestionsRef.current.length}`);
      onQuizEnd(score, answeredQuestions, correctAnswers, timeSpentSeconds);
    }
  }, [quizEnded, score, answeredQuestions, correctAnswers, onQuizEnd, startTime]);

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

    // Save user's answer
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: answerIndex }));
    
    // Mark this question as answered in our map
    setAnsweredQuestionsMap(prev => ({ ...prev, [currentQuestionIndex]: true }));
    
    if (isReviewMode) {
      // In review mode, just set the selection visually and delay moving to next question
      setSelectedAnswer(answerIndex);
      
      // Short delay before moving to next question
      setTimeout(() => {
        setSelectedAnswer(null); // Reset selection
        moveToNextQuestion();
      }, 500);
    } else {
      // In immediate feedback mode
      setSelectedAnswer(answerIndex);
      
      const currentQuestion = shuffledQuestionsRef.current[currentQuestionIndex];
      const isCorrect = answerIndex === currentQuestion.correctAnswer;
      
      // Show feedback
      setIsAnswerCorrect(isCorrect);
      
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
    }
  };
  
  const moveToNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    
    // Check if all questions have been answered first
    const totalAnsweredQuestions = Object.values(answeredQuestionsMap).filter(Boolean).length;
    const allQuestionsAnswered = totalAnsweredQuestions >= shuffledQuestionsRef.current.length;
    
    // If all questions have been answered
    if (allQuestionsAnswered) {
      if (isReviewMode) {
        // In review mode, show the review screen instead of ending the quiz
        setShowReviewScreen(true);
        return;
      } else {
        // In immediate feedback mode, end the quiz
        console.log("All questions answered - ending quiz");
        setQuizEnded(true);
        return;
      }
    }
    
    // If we're out of lives, end the quiz immediately
    if (settings.livesEnabled && lives <= 0) {
      console.log("No lives left - ending quiz");
      setQuizEnded(true);
      return;
    }
    
    // Special handling for single-question quizzes
    if (shuffledQuestionsRef.current.length === 1) {
      if (isReviewMode) {
        setShowReviewScreen(true);
      } else {
        console.log("Single question quiz completed - ending quiz");
        setQuizEnded(true);
      }
      return;
    }
    
    // Find the next unanswered question
    let nextIndex = -1;
    let searchIndex = currentQuestionIndex + 1;
    
    // First try to find an unanswered question after the current one
    while (searchIndex < shuffledQuestionsRef.current.length) {
      if (!answeredQuestionsMap[searchIndex]) {
        nextIndex = searchIndex;
        break;
      }
      searchIndex++;
    }
    
    // If we didn't find any unanswered questions after the current one, 
    // loop back to the beginning to search
    if (nextIndex === -1) {
      searchIndex = 0;
      while (searchIndex < currentQuestionIndex) {
        if (!answeredQuestionsMap[searchIndex]) {
          nextIndex = searchIndex;
          break;
        }
        searchIndex++;
      }
    }
    
    // If we still didn't find any unanswered questions, show review screen or end the quiz
    if (nextIndex === -1) {
      if (isReviewMode) {
        setShowReviewScreen(true);
      } else {
        console.log("No more unanswered questions found - ending quiz");
        setQuizEnded(true);
      }
      return;
    }
    
    // Set the new question index and mark it as visited
    setCurrentQuestionIndex(nextIndex);
    setVisitedQuestionsMap(prev => ({ ...prev, [nextIndex]: true }));
  };
  
  // Navigation functions
  const navigateToQuestion = (index: number) => {
    // Don't allow navigation if:
    // 1. User tries to navigate to the current question
    // 2. User tries to navigate to a question they've already answered (in immediate feedback mode)
    // 3. Timer has stopped
    if (
      index === currentQuestionIndex ||
      (!isReviewMode && answeredQuestionsMap[index]) ||
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

  // Handle image load error with improved error handling
  const handleImageError = (imageUrl: string) => {
    console.error("Failed to load image:", imageUrl);
    setImageErrors(prev => ({ ...prev, [imageUrl]: true }));
    setImageLoadStatus(prev => ({ ...prev, [imageUrl]: 'error' }));
  };

  // Handle image load success
  const handleImageLoaded = (imageUrl: string) => {
    setImageLoadStatus(prev => ({ ...prev, [imageUrl]: 'loaded' }));
  };

  // Check if an image is valid and not in error state
  const isValidImage = (url: string | null | undefined) => {
    if (!url) return false;
    if (imageErrors[url]) return false;
    return true;
  };

  // Format time to display as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Function to submit all answers after review
  const handleSubmitReview = () => {
    // Ensure all questions have been answered before allowing submission
    if (Object.keys(userAnswers).length < shuffledQuestionsRef.current.length) {
      toast({
        title: "Incomplete Quiz",
        description: `Please answer all ${shuffledQuestionsRef.current.length} questions before submitting. You've answered ${Object.keys(userAnswers).length} so far.`,
        variant: "destructive",
      });
      return;
    }
    
    // Calculate the score and correctness based on user answers
    let finalScore = 0;
    let correctCount = 0;
    
    Object.entries(userAnswers).forEach(([questionIndexStr, userAnswerIndex]) => {
      const questionIndex = parseInt(questionIndexStr);
      const question = shuffledQuestionsRef.current[questionIndex];
      
      if (userAnswerIndex === question.correctAnswer) {
        // If correct, add points
        finalScore += question.points;
        correctCount++;
      }
    });
    
    // Update the score
    setScore(finalScore);
    setCorrectAnswers(correctCount);
    setAnsweredQuestions(Object.keys(userAnswers).length);
    
    // Create review data to pass to Score component
    const reviewData = {
      questions: shuffledQuestionsRef.current,
      userAnswers: userAnswers
    };
    
    // End the quiz and pass the review data
    setQuizEnded(true);
    
    // Pass review data to parent component through onQuizEnd
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
    onQuizEnd(finalScore, Object.keys(userAnswers).length, correctCount, timeSpentSeconds, reviewData);
  };

  // If still loading
  if (isLoading) {
    return <div className="p-8 text-center font-pixel">Loading questions...</div>;
  }

  // If we don't have any questions after loading
  if (!shuffledQuestionsRef.current.length) {
    return (
      <div className="p-8 text-center font-pixel">
        <h2 className="text-2xl mb-4">No Questions Available</h2>
        <p className="mb-4">There are no questions available for this category.</p>
        <p>Please add some questions in the admin panel or select a different category.</p>
      </div>
    );
  }

  // If the quiz has ended
  if (quizEnded) {
    return <div className="p-8 text-center font-pixel">Finishing quiz...</div>;
  }
  
  // If we're showing the review screen
  if (showReviewScreen) {
    // Check if all questions have been answered
    const totalQuestions = shuffledQuestionsRef.current.length;
    const answeredCount = Object.keys(userAnswers).length;
    const allQuestionsAnswered = answeredCount === totalQuestions;
    
    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel text-2xl text-pixel-yellow">REVIEW YOUR ANSWERS</h2>
          <div className="font-pixel text-sm bg-black text-white p-3 rounded-lg border-2 border-gray-800">
            <span className="mr-2">TIME LEFT:</span>
            <span className="text-pixel-yellow">{formatTime(quizTimeLeft)}</span>
          </div>
        </div>

        <div className="relative border-8 border-black rounded-lg bg-white p-6">
          {/* Yellow corner accents */}
          <div className="absolute w-8 h-8 bg-pixel-yellow top-0 left-0 rounded-tl-lg z-10"></div>
          <div className="absolute w-8 h-8 bg-pixel-yellow top-0 right-0 rounded-tr-lg z-10"></div>
          <div className="absolute w-8 h-8 bg-pixel-yellow bottom-0 left-0 rounded-bl-lg z-10"></div>
          <div className="absolute w-8 h-8 bg-pixel-yellow bottom-0 right-0 rounded-br-lg z-10"></div>

          <div className="relative z-20">
            <div className="mb-6 text-center">
              <p className="font-pixel text-lg">You've answered {answeredCount} of {totalQuestions} questions. Review your answers before submitting.</p>
              {!allQuestionsAnswered && (
                <p className="text-sm text-pixel-red font-bold mt-2">You must answer all questions before submitting!</p>
              )}
              <p className="text-sm text-gray-600 mt-2">Click on a question to edit your answer or click SUBMIT to finish the quiz.</p>
            </div>
            
            {/* Detailed Review of Questions and Answers */}
            <div className="max-h-[400px] overflow-y-auto mb-6 p-2">
              {shuffledQuestionsRef.current.map((question, index) => {
                const userAnswer = userAnswers[index];
                const hasAnswered = userAnswer !== undefined;
                
                return (
                  <div key={index} 
                    className={`mb-4 p-4 rounded-lg border-4 ${hasAnswered ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                    onClick={() => {
                      if (isTimerRunning) {
                        setShowReviewScreen(false);
                        setCurrentQuestionIndex(index);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-pixel-text mb-2 flex-1">
                        <span className="font-pixel text-gray-700 mr-2">Q{index + 1}:</span>
                        {question.question}
                        
                        {/* Question Image */}
                        {isValidImage(question.questionImage) && (
                          <div className="mt-2 flex justify-start">
                            <img 
                              src={question.questionImage || ""} 
                              alt="Question" 
                              className="max-h-20 object-contain" 
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-2">
                        <span className={`font-pixel px-3 py-1 rounded ${hasAnswered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {hasAnswered ? 'ANSWERED' : 'NOT ANSWERED'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Show options with the selected one highlighted */}
                    <div className="ml-6 mt-3 space-y-2">
                      {hasAnswered ? (
                        <div>
                          <p className="font-pixel text-gray-700 mb-1">Your answer:</p>
                          {question.options.map((option, optIndex) => {
                            const isSelected = userAnswer === optIndex;
                            return (
                              <div 
                                key={optIndex} 
                                className={`p-2 rounded ${isSelected ? 'bg-blue-100 border-2 border-blue-300' : ''}`}
                              >
                                <div className="flex items-center">
                                  <span className="inline-block w-7 h-7 bg-black text-white font-pixel flex items-center justify-center mr-2 text-sm">
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <span className={`${isSelected ? 'font-bold' : ''}`}>{option}</span>
                                </div>
                                
                                {/* Option Image */}
                                {isSelected && question.optionImages && isValidImage(question.optionImages[optIndex]) && (
                                  <div className="mt-2 ml-9 flex justify-start">
                                    <img 
                                      src={question.optionImages[optIndex] || ""} 
                                      alt="Selected option" 
                                      className="max-h-16 object-contain border-2 border-gray-200 p-1 bg-white" 
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="font-pixel-text text-sm text-gray-500 italic">No answer selected yet</p>
                      )}
                    </div>
                    
                    <div className="mt-3 text-right">
                      <button 
                        className="font-pixel text-xs text-blue-600 hover:text-blue-800 underline bg-white px-2 py-1 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isTimerRunning) {
                            setShowReviewScreen(false);
                            setCurrentQuestionIndex(index);
                          }
                        }}
                      >
                        {hasAnswered ? 'CHANGE ANSWER' : 'ANSWER NOW'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center">
              {Object.keys(userAnswers).length < shuffledQuestionsRef.current.length ? (
                <>
                  <button 
                    disabled
                    className="bg-gray-400 px-10 py-4 font-pixel text-xl text-gray-700 border-4 border-black cursor-not-allowed"
                  >
                    SUBMIT AND SEE RESULTS
                  </button>
                  <p className="mt-2 text-red-500 font-pixel text-sm">
                    Please answer all {shuffledQuestionsRef.current.length} questions before submitting. 
                    You've answered {Object.keys(userAnswers).length} so far.
                  </p>
                </>
              ) : (
                <button 
                  onClick={handleSubmitReview}
                  className="bg-pixel-yellow px-10 py-4 font-pixel text-xl text-pixel-dark border-4 border-black hover:bg-yellow-400 transition-all"
                >
                  SUBMIT AND SEE RESULTS
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we're out of questions or lives (if lives feature is enabled), end the quiz
  if (currentQuestionIndex >= shuffledQuestionsRef.current.length || 
      (settings.livesEnabled && lives <= 0)) {
    setQuizEnded(true);
    return <div className="p-8 text-center font-pixel">Finishing quiz...</div>;
  }
  
  const currentQuestion = shuffledQuestionsRef.current[currentQuestionIndex];
  const hasQuestionImage = isValidImage(currentQuestion.questionImage);
  const hasOptionImages = currentQuestion.optionImages && 
    currentQuestion.optionImages.some(img => img && !imageErrors[img]);
  
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
        {/* Only show score in non-review mode */}
        {!isReviewMode && (
          <div className={`font-pixel text-sm bg-black text-white p-3 rounded-lg border-2 border-gray-800 ${!settings.livesEnabled ? 'ml-auto' : ''} ${scoreAnimation ? 'animate-bounce' : ''}`}>
            <span className="mr-2">SCORE:</span>
            <span className={`text-pixel-yellow ${scoreAnimation ? 'text-2xl' : ''}`}>{score}</span>
          </div>
        )}
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
              <div className="border-l-4 border-pixel-yellow pl-4 mb-6">
                <h3 className="font-pixel text-lg">{currentQuestion.question}</h3>
                
                {/* Question Image with improved handling */}
                {hasQuestionImage && (
                  <div className="mt-4 bg-gray-50 p-3 border-2 border-black rounded-md flex justify-center">
                    <div className="relative">
                      {imageLoadStatus[currentQuestion.questionImage || ''] !== 'loaded' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <div className="animate-pulse rounded-md bg-gray-200 h-48 w-48"></div>
                        </div>
                      )}
                      <img 
                        src={currentQuestion.questionImage || ""}
                        alt="Question Visual" 
                        className={`max-h-64 object-contain ${
                          imageLoadStatus[currentQuestion.questionImage || ''] === 'loaded' 
                            ? 'opacity-100' 
                            : 'opacity-0'
                        }`}
                        onError={() => handleImageError(currentQuestion.questionImage || "")}
                        onLoad={() => handleImageLoaded(currentQuestion.questionImage || "")}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => {
                  const optionImage = currentQuestion.optionImages?.[index];
                  const hasOptionImage = isValidImage(optionImage);
                  const isSelected = selectedAnswer === index;
                  const userPreviousAnswer = userAnswers[currentQuestionIndex];
                  const isPreviouslySelected = userPreviousAnswer === index;
                  
                  // Determine button styling
                  let buttonStyle = 'bg-white hover:bg-gray-100';
                  
                  if (isReviewMode) {
                    // In review mode
                    if (isPreviouslySelected) {
                      buttonStyle = 'bg-blue-100 border-blue-500';
                    }
                  } else {
                    // In immediate feedback mode
                    if (isSelected) {
                      buttonStyle = isAnswerCorrect 
                        ? 'bg-green-100 border-green-500 shake-correct' 
                        : 'bg-red-100 border-red-500 shake-incorrect';
                    }
                  }
                  
                  return (
                    <button 
                      key={index}
                      onClick={() => handleAnswerClick(index)}
                      className={`w-full text-left px-4 py-5 font-pixel-text text-xl border-4 border-black transition-all duration-200 ${buttonStyle}`}
                      disabled={(!isReviewMode && selectedAnswer !== null) || isPreviouslySelected || !isTimerRunning}
                    >
                      <div className="flex items-center">
                        <span className="inline-block w-10 h-10 bg-black text-white font-pixel flex items-center justify-center mr-4 text-lg">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{option}</span>
                      </div>
                      
                      {/* Option Image with improved handling */}
                      {hasOptionImage && (
                        <div className="mt-2 ml-14 flex justify-start">
                          <div className="border-2 border-gray-300 p-2 rounded bg-gray-50 inline-block">
                            <div className="relative">
                              {imageLoadStatus[optionImage || ''] !== 'loaded' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                  <div className="animate-pulse rounded-md bg-gray-200 h-20 w-32"></div>
                                </div>
                              )}
                              <img 
                                src={optionImage || ""}
                                alt={`Option ${String.fromCharCode(65 + index)}`}
                                className={`max-h-24 object-contain ${
                                  imageLoadStatus[optionImage || ''] === 'loaded' 
                                    ? 'opacity-100' 
                                    : 'opacity-0'
                                }`}
                                onError={() => handleImageError(optionImage || "")}
                                onLoad={() => handleImageLoaded(optionImage || "")}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Review Mode Note */}
              {isReviewMode && (
                <div className="mt-6 p-4 text-center font-pixel border-4 border-gray-300 bg-gray-50">
                  <p>Review Mode: Answer all questions first, then see your results</p>
                </div>
              )}
              
              {/* Feedback message - only show in immediate feedback mode */}
              {!isReviewMode && isAnswerCorrect !== null && (
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
              
              {/* Review Button - show in review mode when at least one question is answered */}
              {isReviewMode && Object.keys(userAnswers).length > 0 && (
                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setShowReviewScreen(true)}
                    className="bg-blue-500 text-white px-6 py-3 font-pixel border-4 border-black hover:bg-blue-600 transition-all"
                  >
                    REVIEW ANSWERS
                  </button>
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
                const isAnswered = userAnswers[index] !== undefined;
                const isVisited = visitedQuestionsMap[index] === true;
                
                let bgColor = "bg-gray-700"; // default for unvisited
                let textColor = "text-white";
                let extraClasses = "";
                
                if (isAnswered) {
                  bgColor = "bg-green-700";
                  textColor = "text-white";
                  extraClasses = isReviewMode ? "" : "cursor-not-allowed";  // Allow revisiting answered questions in review mode
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
                    disabled={isCurrentQuestion || (!isReviewMode && isAnswered) || !isTimerRunning}
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
