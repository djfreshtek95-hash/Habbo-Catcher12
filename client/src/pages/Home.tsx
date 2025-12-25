import { useState } from "react";
import { useLocation } from "wouter";
import { PixelCard } from "@/components/PixelCard";
import { PixelButton } from "@/components/PixelButton";
import { Input } from "@/components/ui/input";
import { Gamepad2, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [username, setUsername] = useState(".:josefaura:.");
  const [_, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setLocation(`/game?username=${encodeURIComponent(username)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8 md:p-4 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent" />
      
      {/* Falling Rares Animation (Decorative) */}
      {[...Array(5)].map((_, i) => (
         <motion.img 
            key={i}
            initial={{ y: -100, x: Math.random() * window.innerWidth, rotate: 0 }}
            animate={{ 
              y: window.innerHeight + 100, 
              rotate: 360 
            }}
            transition={{ 
              duration: 10 + Math.random() * 10, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * 2 
            }}
            src="https://files.habboemotion.com/resources/images/small_furni/rare/diamond.gif"
            className="absolute w-8 h-8 opacity-20 pointer-events-none grayscale"
         />
      ))}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-6 md:mb-8 space-y-3 md:space-y-2">
           <div className="inline-block bg-primary text-primary-foreground px-3 py-1 text-xs md:text-sm font-bold rounded-full mb-3 md:mb-4 shadow-lg shadow-primary/30">
             V1.0 - PIXEL EDITION
           </div>
           <h1 className="text-4xl md:text-6xl font-pixel text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent drop-shadow-sm py-2">
             HABBO CATCH
           </h1>
           <p className="text-base md:text-xl text-muted-foreground font-light">
             Catch the rares, avoid the floor.
           </p>
        </div>

        <PixelCard variant="neutral" className="bg-white/80 backdrop-blur-xl shadow-xl border-t-white/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-3">
              <label htmlFor="username" className="text-xs md:text-sm font-bold uppercase tracking-wide text-gray-500">
                Enter Habbo Username
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Frank"
                  className="pl-10 h-12 text-base md:text-lg font-pixel bg-slate-50 border-2 border-slate-200 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-none"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground pl-1">
                We'll fetch your actual Habbo avatar!
              </p>
            </div>

            <div className="pt-2">
              <PixelButton type="submit" size="lg" className="w-full text-base md:text-xl shadow-lg shadow-indigo-500/20">
                <Gamepad2 className="mr-2 w-5 h-5 md:w-6 md:h-6" /> PLAY NOW
              </PixelButton>
            </div>

          </form>
        </PixelCard>

      </motion.div>
    </div>
  );
}
