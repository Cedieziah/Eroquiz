// This component is now deprecated as we use a secret click pattern instead
// Keeping this file as a placeholder in case we need to restore it

export default function AdminHeart() {
  return (
    <svg 
      className="heart w-8 h-8 inline-block mx-1" 
      viewBox="0 0 20 20" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        fill="#FF3333" 
        d="M10,4 L8,2 L6,2 L4,2 L2,4 L2,6 L2,8 L4,10 L6,12 L8,14 L10,16 L12,14 L14,12 L16,10 L18,8 L18,6 L18,4 L16,2 L14,2 L12,2 Z" 
      />
      <path 
        fill="#CC0000" 
        d="M10,6 L8,4 L6,4 L4,4 L4,6 L4,8 L6,10 L8,12 L10,14 L12,12 L14,10 L16,8 L16,6 L16,4 L14,4 L12,4 Z" 
      />
    </svg>
  );
}