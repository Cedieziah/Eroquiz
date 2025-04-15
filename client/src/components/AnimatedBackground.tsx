import { useEffect, useState } from 'react';

interface Leaf {
  id: number;
  left: number;
  animationDuration: number;
  delay: number;
  size: number;
  rotation: number;
  color: string;
}

interface Tree {
  id: number;
  left: number;
  height: number;
  width: number;
  swaySpeed: number;
  swayAmount: number;
}

export default function AnimatedBackground() {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  
  // Create trees on mount
  useEffect(() => {
    // Create trees
    const newTrees = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: Math.random() * 85 + 5, // 5-90% of screen width
      height: Math.random() * 20 + 15, // 15-35vh
      width: Math.random() * 10 + 6, // 6-16vw
      swaySpeed: Math.random() * 10 + 5, // 5-15s
      swayAmount: Math.random() * 2 + 1, // 1-3 degrees
    }));
    
    setTrees(newTrees);
    
    // Start creating leaves periodically
    const leafInterval = setInterval(() => {
      const newLeaf: Leaf = {
        id: Date.now(),
        left: Math.random() * 100, // 0-100% of screen width
        animationDuration: Math.random() * 10 + 5, // 5-15s
        delay: Math.random() * 2, // 0-2s
        size: Math.random() * 15 + 5, // 5-20px
        rotation: Math.random() * 360, // 0-360 degrees
        color: ['#FFD700', '#FFA500', '#FF8C00', '#FF4500', '#8B0000'][Math.floor(Math.random() * 5)], // Fall colors
      };
      
      setLeaves(prevLeaves => [...prevLeaves, newLeaf]);
      
      // Remove leaves that have fallen off screen to avoid memory issues
      if (leaves.length > 50) {
        setLeaves(prevLeaves => prevLeaves.slice(1));
      }
    }, 600); // Create a new leaf every 600ms
    
    return () => {
      clearInterval(leafInterval);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1]">
      {/* Trees */}
      {trees.map(tree => (
        <div 
          key={tree.id}
          className="absolute bottom-16" 
          style={{
            left: `${tree.left}%`,
            height: `${tree.height}vh`,
            width: `${tree.width}vw`,
          }}
        >
          {/* Tree trunk */}
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-[#8B4513]" 
            style={{
              width: '25%',
              height: '70%',
              borderRadius: '0 0 2px 2px',
            }}
          ></div>
          
          {/* Tree top */}
          <div 
            className="absolute bottom-[60%] left-1/2 transform -translate-x-1/2 bg-[#006400]" 
            style={{
              width: '100%',
              height: '50%',
              borderRadius: '50% 50% 10% 10%',
              animation: `sway ${tree.swaySpeed}s ease-in-out infinite alternate`,
            }}
          ></div>
        </div>
      ))}
      
      {/* Falling leaves */}
      {leaves.map(leaf => (
        <div 
          key={leaf.id}
          className="absolute top-0 animate-fall"
          style={{
            left: `${leaf.left}%`,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            background: leaf.color,
            borderRadius: '50% 0 50% 50%',
            transform: `rotate(${leaf.rotation}deg)`,
            animationDuration: `${leaf.animationDuration}s`,
            animationDelay: `${leaf.delay}s`,
          }}
        ></div>
      ))}
    </div>
  );
}