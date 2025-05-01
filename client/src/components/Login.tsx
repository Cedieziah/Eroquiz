import { useState, useEffect } from "react";
import PixelHeart from "./PixelHeart";
import AdminHeart from "./AdminHeart";

interface LoginProps {
  onStartGame: (name: string) => void;
}

export default function Login({ onStartGame }: LoginProps) {
  const [playerName, setPlayerName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [animateCorner, setAnimateCorner] = useState(0);
  const [pulse, setPulse] = useState(false);
  
  // Animation effects
  useEffect(() => {
    // Corner animation
    const cornerInterval = setInterval(() => {
      setAnimateCorner(prev => (prev + 1) % 4);
    }, 800);
    
    // Pulse animation
    const pulseInterval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1500);
    
    return () => {
      clearInterval(cornerInterval);
      clearInterval(pulseInterval);
    };
  }, []);
  
  // Handle input change with validation - only allow letters
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow alphabetic characters (letters)
    if (value === "" || /^[a-zA-Z]+$/.test(value)) {
      setPlayerName(value);
      if (error) setError("");
    } else {
      setError("Only letters are allowed (no spaces, numbers, or symbols)");
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name format
    if (!playerName) {
      setError("Please enter your name to continue!");
      return;
    }
    
    if (!/^[a-zA-Z]+$/.test(playerName)) {
      setError("Name must contain only letters (no spaces, numbers, or symbols)");
      return;
    }
    
    onStartGame(playerName);
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="relative bg-white p-10 max-w-2xl w-full mx-4 animate-fade-in">
        {/* Main border */}
        <div className="absolute inset-0 border-8 border-black"></div>
        
        {/* Yellow corner accents with animation */}
        <div className={`absolute w-12 h-12 bg-pixel-yellow top-0 left-0 z-10 transition-all duration-300 ${animateCorner === 0 ? 'scale-110' : ''}`}></div>
        <div className={`absolute w-12 h-12 bg-pixel-yellow top-0 right-0 z-10 transition-all duration-300 ${animateCorner === 1 ? 'scale-110' : ''}`}></div>
        <div className={`absolute w-12 h-12 bg-pixel-yellow bottom-0 left-0 z-10 transition-all duration-300 ${animateCorner === 2 ? 'scale-110' : ''}`}></div>
        <div className={`absolute w-12 h-12 bg-pixel-yellow bottom-0 right-0 z-10 transition-all duration-300 ${animateCorner === 3 ? 'scale-110' : ''}`}></div>
        
        <div className="relative z-20">
          <div className="flex justify-center mb-7">
            <div className="scale-125 mx-1">
              <AdminHeart />
            </div>
            <div className="scale-125 mx-1">
              <PixelHeart />
            </div>
            <div className="scale-125 mx-1">
              <PixelHeart />
            </div>
            <div className="scale-125 mx-1">
              <PixelHeart />
            </div>
            <div className="scale-125 mx-1">
              <PixelHeart />
            </div>
          </div>
          
          <h1 className={`text-pixel-yellow text-center font-pixel text-5xl mb-10 leading-relaxed tracking-wider ${pulse ? 'scale-105' : 'scale-100'} transition-transform duration-700`}>EROQUIZ</h1>
          
          <form onSubmit={handleSubmit} className="mb-8 px-6">
            <div className="mb-8">
              <label htmlFor="player-name" className="block font-pixel text-pixel-dark text-lg mb-4">ENTER YOUR NAME:</label>
              <input 
                type="text" 
                id="player-name" 
                className="w-full px-5 py-4 bg-gray-100 border-4 border-pixel-dark font-pixel-text text-2xl"
                value={playerName}
                onChange={handleNameChange}
                maxLength={20}
                placeholder="Letters only"
              />
              {error && <p className="text-pixel-red font-pixel text-sm mt-3">{error}</p>}
              <p className="text-gray-500 font-pixel-text text-base mt-3">Only letters allowed (A-Z, a-z)</p>
            </div>
            
            <div className="text-center">
              <button 
                type="submit" 
                className={`relative bg-pixel-yellow px-10 py-4 font-pixel text-xl text-pixel-dark hover:bg-yellow-400 transition-all ${!playerName || !/^[a-zA-Z]+$/.test(playerName) ? 'opacity-50' : 'animate-pulse-slow'}`}
                disabled={!playerName || !/^[a-zA-Z]+$/.test(playerName)}
              >
                <div className="absolute inset-0 border-4 border-black"></div>
                <span className="relative z-10">START GAME</span>
              </button>
            </div>
          </form>
          
          <div className="flex justify-center items-center mt-6">
            <div className="text-3xl font-bold mx-3 text-pixel-yellow animate-pulse">0</div>
            <div className="text-blue-400 text-3xl mx-3 animate-bounce">★</div>
            <div className="text-3xl font-bold mx-3 text-pixel-yellow animate-pulse">0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
