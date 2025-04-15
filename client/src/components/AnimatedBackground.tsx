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

export default function AnimatedBackground() {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  
  // Create leaves animation
  useEffect(() => {
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
  }, [leaves.length]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1]">
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