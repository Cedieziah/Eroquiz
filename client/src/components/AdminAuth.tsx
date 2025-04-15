import { useState } from "react";

interface AdminAuthProps {
  onAuthenticate: () => void;
}

export default function AdminAuth({ onAuthenticate }: AdminAuthProps) {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  const correctPin = "2045";
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin === correctPin) {
      onAuthenticate();
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg pixel-border my-12">
      <h1 className="text-pixel-yellow text-center font-pixel text-4xl mb-10 leading-relaxed tracking-wider shadow-lg">ADMIN LOGIN</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-6">
          <label htmlFor="admin-pin" className="block font-pixel text-pixel-dark text-sm mb-3">ENTER ADMIN PIN:</label>
          <input 
            type="password" 
            id="admin-pin" 
            className="w-full px-4 py-3 bg-gray-100 border-4 border-pixel-dark font-pixel-text text-xl"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={4}
          />
          {error && <p className="text-pixel-red font-pixel text-xs mt-2">{error}</p>}
        </div>
        
        <div className="text-center">
          <button 
            type="submit" 
            className="bg-pixel-yellow px-8 py-3 font-pixel text-pixel-dark pixel-border hover:bg-yellow-400 pixel-btn transition-all"
          >
            LOGIN
          </button>
        </div>
      </form>
      
      <div className="text-center mt-4">
        <a href="/" className="font-pixel text-pixel-blue text-sm hover:underline">BACK TO GAME</a>
      </div>
    </div>
  );
}