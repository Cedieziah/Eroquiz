import { useState, useEffect } from "react";
import AdminPanel from "@/components/AdminPanel";
import AdminAuth from "@/components/AdminAuth";
import { Link } from "wouter";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Check if we're already authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem("admin_auth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleAuthenticate = () => {
    setIsAuthenticated(true);
    localStorage.setItem("admin_auth", "true");
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth");
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {isAuthenticated ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-pixel-yellow font-pixel text-3xl">ADMIN PANEL</h1>
            <div className="flex space-x-3">
              <button
                onClick={handleLogout}
                className="bg-pixel-red text-white font-pixel px-4 py-2 border-2 border-black hover:bg-red-500 transition-colors"
              >
                LOGOUT
              </button>
              <Link 
                to="/"
                className="bg-pixel-blue text-white font-pixel px-4 py-2 border-2 border-black hover:bg-blue-400 transition-colors"
              >
                BACK TO GAME
              </Link>
            </div>
          </div>
          
          <AdminPanel />
        </div>
      ) : (
        <AdminAuth onAuthenticate={handleAuthenticate} />
      )}
    </div>
  );
}
