import { useState } from "react";
import AdminPanel from "@/components/AdminPanel";
import { Link } from "wouter";

export default function Admin() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white p-6 rounded-lg pixel-border my-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-pixel-yellow text-center font-pixel text-2xl mb-0">ADMIN PANEL</h1>
          <Link 
            to="/"
            className="bg-pixel-blue text-white font-pixel px-4 py-2 rounded-lg hover:bg-blue-400 transition-colors"
          >
            BACK TO GAME
          </Link>
        </div>
        
        <AdminPanel />
      </div>
    </div>
  );
}
