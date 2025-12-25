import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import GameMenu from "@/pages/GameMenu";
import HabboCatcher from "@/pages/HabboCatcher";
import BeatEmUp from "@/pages/BeatEmUp";
import TekkenGame from "@/pages/TekkenGame";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GameMenu} />
      <Route path="/catcher" component={HabboCatcher} />
      <Route path="/beatem" component={BeatEmUp} />
      <Route path="/tekken" component={TekkenGame} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
