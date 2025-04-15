import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create background elements
const createBackgroundElements = () => {
  const body = document.body;
  
  // Ground - keeping only the ground element
  const ground = document.createElement('div');
  ground.className = 'fixed bottom-0 left-0 right-0 h-16 bg-pixel-stone';
  
  // Append ground element to body
  body.appendChild(ground);
};

// Create background elements
createBackgroundElements();

// Render the React app
createRoot(document.getElementById("root")!).render(<App />);
