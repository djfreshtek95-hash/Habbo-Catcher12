import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ScoreInput } from "@shared/routes";

// ============================================
// GAME HOOKS
// ============================================

// Default fallback avatar when user is not found or API fails
const DEFAULT_AVATAR = {
  figureString: "hr-155-1035.hd-185-1026.ch-255-1189.lg-275-1239.sh-290-62",
  username: "guest",
};

// LocalStorage cache for user data
const getUserFromCache = (username: string) => {
  try {
    const cached = localStorage.getItem(`habbo_user_${username.toLowerCase()}`);
    if (cached) {
      const data = JSON.parse(cached);
      const now = Date.now();
      // Cache valid for 24 hours
      if (now - data.timestamp < 24 * 60 * 60 * 1000) {
        console.log(`[LocalStorage Cache HIT] User: ${username}`);
        return data.user;
      }
    }
  } catch (e) {
    console.error("Error reading user cache:", e);
  }
  return null;
};

const setCacheUser = (username: string, user: any) => {
  try {
    localStorage.setItem(`habbo_user_${username.toLowerCase()}`, JSON.stringify({
      user,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.error("Error saving user cache:", e);
  }
};

export function useHabboUser(username: string) {
  return useQuery({
    queryKey: [api.users.getFigure.path, username],
    queryFn: async () => {
      // Default fallback if username is empty
      const targetUser = username || ".:josefaura:.";
      
      // Check local cache first
      const cachedUser = getUserFromCache(targetUser);
      if (cachedUser) {
        return cachedUser;
      }

      try {
        const url = buildUrl(api.users.getFigure.path, { username: targetUser });
        console.log(`[API Request] Fetching user: ${targetUser}`);
        
        const res = await fetch(url, {
          signal: AbortSignal.timeout(8000), // 8 second timeout
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            console.log(`[API 404] User not found: ${targetUser}`);
            // Return default but still valid user object
            return { ...DEFAULT_AVATAR, username: targetUser };
          }
          throw new Error(`HTTP ${res.status}: Failed to fetch user`);
        }

        const data = await res.json();
        const parsed = api.users.getFigure.responses[200].parse(data);
        
        // Cache the successful response
        setCacheUser(targetUser, parsed);
        console.log(`[API Success] User fetched: ${targetUser}`);
        return parsed;
      } catch (error) {
        console.error(`[API Error] Failed to fetch ${targetUser}:`, error);
        
        // Return a valid user object with requested username
        // This allows the game to proceed even if API fails
        const fallback = { ...DEFAULT_AVATAR, username: targetUser };
        setCacheUser(targetUser, fallback);
        return fallback;
      }
    },
    enabled: !!username, // Only run if username exists
    staleTime: 1000 * 60 * 60, // Cache for 1 hour in react-query
    gcTime: 1000 * 60 * 60 * 24, // Keep in memory for 24 hours
    retry: 2, // Retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

export function useScores() {
  return useQuery({
    queryKey: [api.scores.list.path],
    queryFn: async () => {
      const res = await fetch(api.scores.list.path);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return api.scores.list.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Refresh every 10s
  });
}

export function useSubmitScore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ScoreInput) => {
      const res = await fetch(api.scores.create.path, {
        method: api.scores.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error("Failed to submit score");
      }
      
      return api.scores.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.scores.list.path] });
    },
  });
}
