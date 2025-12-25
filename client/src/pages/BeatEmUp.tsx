import { useState } from "react";
import { useLocation } from "wouter";
import { PixelButton } from "@/components/PixelButton";
import { PixelCard } from "@/components/PixelCard";
import { ArrowLeft } from "lucide-react";

export default function BeatEmUp() {
  const [_, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const username = searchParams.get("username") || "Player";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <PixelCard variant="neutral" className="bg-slate-800 border-slate-700 max-w-md w-full">
        <h1 className="text-4xl font-pixel text-center text-orange-400 mb-4">
          BEAT 'EM UP
        </h1>
        <p className="text-center text-slate-300 mb-6">
          Coming Soon - Procedural Beat 'Em Up Game
        </p>
        <div className="text-center text-slate-400 mb-6">
          <p>Player: {username}</p>
        </div>
        <PixelButton 
          onClick={() => setLocation("/")}
          className="w-full"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> BACK
        </PixelButton>
      </PixelCard>
    </div>
  );
}
