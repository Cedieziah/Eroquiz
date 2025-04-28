// client/src/pages/LeaderboardPage.tsx
import { Link } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Leaderboard onClose={() => window.history.back()} />
      <div className="text-center mt-4">
        <Link 
          to="/"
          className="bg-pixel-blue px-6 py-2 font-pixel text-white pixel-border hover:bg-blue-600 pixel-btn transition-all inline-block"
        >
          BACK TO GAME
        </Link>
      </div>
    </div>
  );
}