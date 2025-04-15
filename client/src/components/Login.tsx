import { useState } from "react";
import PixelHeart from "./PixelHeart";

interface LoginProps {
  onStartGame: (name: string) => void;
}

export default function Login({ onStartGame }: LoginProps) {
  const [playerName, setPlayerName] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError("Please enter your name to continue!");
      return;
    }
    
    onStartGame(playerName);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg pixel-border my-12">
      <div className="flex justify-center mb-6">
        <PixelHeart />
        <PixelHeart />
        <PixelHeart />
        <PixelHeart />
        <PixelHeart />
      </div>
      
      <h1 className="text-pixel-yellow text-center font-pixel text-4xl mb-10 leading-relaxed tracking-wider shadow-lg">EROQUIZ</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-6">
          <label htmlFor="player-name" className="block font-pixel text-pixel-dark text-sm mb-3">ENTER YOUR NAME:</label>
          <input 
            type="text" 
            id="player-name" 
            className="w-full px-4 py-3 bg-gray-100 border-4 border-pixel-dark font-pixel-text text-xl"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
          />
          {error && <p className="text-pixel-red font-pixel text-xs mt-2">{error}</p>}
        </div>
        
        <div className="text-center">
          <button 
            type="submit" 
            className="bg-pixel-yellow px-8 py-3 font-pixel text-pixel-dark pixel-border hover:bg-yellow-400 pixel-btn transition-all"
          >
            START GAME
          </button>
        </div>
      </form>
    </div>
  );
}
