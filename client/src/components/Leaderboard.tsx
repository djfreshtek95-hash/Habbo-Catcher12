import { useScores } from "@/hooks/use-game";
import { PixelCard } from "./PixelCard";
import { Trophy, Crown, Medal } from "lucide-react";

export function Leaderboard() {
  const { data: scores, isLoading } = useScores();

  if (isLoading) {
    return (
      <PixelCard className="w-full max-w-md animate-pulse h-64 flex items-center justify-center">
        <span className="font-pixel text-2xl text-muted-foreground">Loading Top Habbo's...</span>
      </PixelCard>
    );
  }

  return (
    <PixelCard className="w-full max-w-md bg-white/90 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6 border-b-2 border-dashed border-gray-200 pb-4">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h2 className="text-3xl font-pixel uppercase tracking-wide text-primary">Hall of Fame</h2>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20">
        {scores?.slice(0, 10).map((score, index) => (
          <div 
            key={score.id} 
            className="flex items-center justify-between p-3 bg-muted/50 rounded hover:bg-muted transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 flex justify-center font-bold font-pixel text-2xl text-muted-foreground">
                {index === 0 && <Crown className="w-6 h-6 text-yellow-500 animate-bounce" />}
                {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                {index === 2 && <Medal className="w-6 h-6 text-amber-600" />}
                {index > 2 && <span>#{index + 1}</span>}
              </div>
              
              <div className="flex items-center gap-2">
                {score.figureString && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-gray-200 shadow-sm relative">
                     <img 
                       src={`https://www.habbo.com/habbo-imaging/avatarimage?figure=${score.figureString}&head_direction=3&action=std&gesture=sml&headonly=1`} 
                       alt={score.username}
                       className="absolute -top-1 left-1/2 -translate-x-1/2 scale-150"
                     />
                  </div>
                )}
                <span className="font-bold text-lg">{score.username}</span>
              </div>
            </div>
            
            <div className="font-pixel text-2xl text-primary font-bold">
              {score.highScore?.toLocaleString()} pts
            </div>
          </div>
        ))}

        {scores?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground font-pixel text-xl">
            No scores yet. Be the first!
          </div>
        )}
      </div>
    </PixelCard>
  );
}
