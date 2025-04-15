import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create background elements
const createBackgroundElements = () => {
  const body = document.body;
  
  // Cloud 1
  const cloud1 = document.createElement('div');
  cloud1.className = 'fixed top-5 left-5 w-24 h-16 bg-white opacity-80 rounded-full';
  
  // Cloud 2
  const cloud2 = document.createElement('div');
  cloud2.className = 'fixed top-20 right-20 w-32 h-20 bg-white opacity-80 rounded-full';
  
  // Ground
  const ground = document.createElement('div');
  ground.className = 'fixed bottom-0 left-0 right-0 h-16 bg-pixel-stone';
  
  // Bush
  const bush = document.createElement('div');
  bush.className = 'fixed bottom-10 left-1/4 w-48 h-10 bg-green-700 rounded-lg';
  
  // Append all elements to body
  body.appendChild(cloud1);
  body.appendChild(cloud2);
  body.appendChild(ground);
  body.appendChild(bush);
};

// Create background elements
createBackgroundElements();

// Render the React app
createRoot(document.getElementById("root")!).render(<App />);
