import { useState } from "react";
import PixelHeart from "./PixelHeart";
import AdminHeart from "./AdminHeart";

interface LoginProps {
  onStartGame: (name: string) => void;
}

export default function Login({ onStartGame }: LoginProps) {
  const [playerName, setPlayerName] = useState<string>("");
  const [error, setError] = useState<string>("");
  
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
    <div className="bg-white p-6 rounded-lg pixel-border my-12">
      <div className="flex justify-center mb-6">
        <AdminHeart />
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
            onChange={handleNameChange}
            maxLength={20}
            placeholder="Letters only"
          />
          {error && <p className="text-pixel-red font-pixel text-xs mt-2">{error}</p>}
          <p className="text-gray-500 font-pixel-text text-sm mt-1">Only letters allowed (A-Z, a-z)</p>
        </div>
        
        <div className="text-center">
          <button 
            type="submit" 
            className="bg-pixel-yellow px-8 py-3 font-pixel text-pixel-dark pixel-border hover:bg-yellow-400 pixel-btn transition-all"
            disabled={!playerName || !/^[a-zA-Z]+$/.test(playerName)}
          >
            START GAME
          </button>
        </div>
      </form>
    </div>
  );
}
