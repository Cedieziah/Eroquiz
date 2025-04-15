import PixelHeart from "./PixelHeart";

interface ScoreProps {
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  onPlayAgain: () => void;
  onBackToMain: () => void;
}

export default function Score({ 
  score, 
  questionsAnswered, 
  correctAnswers,
  onPlayAgain, 
  onBackToMain 
}: ScoreProps) {
  const getScoreMessage = () => {
    if (correctAnswers === 0) {
      return "Oh no! Better luck next time!";
    } else if (correctAnswers < 3) {
      return "Good effort! Keep practicing!";
    } else if (correctAnswers < 6) {
      return "Great job! You're getting better!";
    } else if (correctAnswers < 10) {
      return "Fantastic! You're a quiz master!";
    } else {
      return "Incredible! You're a quiz legend!";
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg pixel-border my-12">
      <h1 className="text-pixel-yellow text-center font-pixel text-4xl mb-8 leading-relaxed tracking-wider shadow-lg">SCORE!</h1>
      
      <div className="text-center mb-8">
        <div className="inline-block bg-pixel-dark p-4 rounded-lg">
          <span className="font-pixel text-white text-2xl mr-2">FINAL SCORE:</span>
          <span className="font-pixel text-pixel-yellow text-4xl">{score}</span>
        </div>
      </div>
      
      <div className="mb-6 text-center font-pixel-text text-2xl">
        <p className="mb-6">{getScoreMessage()}</p>
        <p className="text-xl">
          You answered <span className="text-pixel-yellow">{correctAnswers}</span> out of <span className="text-pixel-yellow">{questionsAnswered}</span> questions correctly!
        </p>
        <p className="text-xl text-gray-600 mt-4">Want to try again?</p>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button 
          onClick={onPlayAgain}
          className="bg-pixel-yellow px-6 py-3 font-pixel text-pixel-dark pixel-border hover:bg-yellow-400 pixel-btn transition-all"
        >
          PLAY AGAIN
        </button>
        
        <button 
          onClick={onBackToMain}
          className="bg-pixel-blue px-6 py-3 font-pixel text-white pixel-border hover:bg-blue-400 pixel-btn transition-all"
        >
          MAIN MENU
        </button>
      </div>
    </div>
  );
}
