import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";

interface CategorySelectionProps {
  onCategorySelect: (category: number) => void;
  playerName: string;
}

export default function CategorySelection({ onCategorySelect, playerName }: CategorySelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // Default categories as fallback
  const defaultCategories: Category[] = [
    { id: 1, name: "Category 1", description: "Grades 3-4" },
    { id: 2, name: "Category 2", description: "Grades 5-6" },
    { id: 3, name: "Category 3", description: "Grades 7-8" },
    { id: 4, name: "Category 4", description: "Grades 9-10" },
    { id: 5, name: "Category 5", description: "Grades 11-12" }
  ];

  // Fetch categories from API
  const { data: categories = defaultCategories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleContinue = () => {
    if (selectedCategory !== null) {
      onCategorySelect(selectedCategory);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="relative bg-white p-10 max-w-2xl w-full mx-4 animate-fade-in">
        {/* Main border */}
        <div className="absolute inset-0 border-8 border-black"></div>
        
        {/* Yellow corner accents */}
        <div className="absolute w-8 h-8 bg-pixel-yellow top-0 left-0 z-10"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow top-0 right-0 z-10"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow bottom-0 left-0 z-10"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow bottom-0 right-0 z-10"></div>
        
        <div className="relative z-20">
          <h1 className="text-pixel-yellow text-center font-pixel text-3xl mb-8 leading-relaxed tracking-wider">SELECT YOUR CATEGORY</h1>
          
          <p className="font-pixel-text text-xl mb-8 text-center">
            Welcome <span className="font-bold text-pixel-blue">{playerName}</span>! Please select your grade category:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 border-4 border-black font-pixel text-lg transition-all ${
                  selectedCategory === category.id
                    ? "bg-pixel-blue text-white transform scale-105"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div className="font-bold">{category.name}</div>
                <div className="font-pixel-text text-sm">{category.description}</div>
              </button>
            ))}
          </div>
          
          <div className="text-center">
            <button 
              onClick={handleContinue}
              disabled={selectedCategory === null}
              className={`relative bg-pixel-yellow px-10 py-4 font-pixel text-xl text-pixel-dark transition-all ${
                selectedCategory === null ? 'opacity-50' : 'animate-pulse-slow hover:bg-yellow-400'
              }`}
            >
              <div className="absolute inset-0 border-4 border-black"></div>
              <span className="relative z-10">CONTINUE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}