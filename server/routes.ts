import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

interface GameRoom {
  id: string;
  player1: { name: string; ws: WebSocket; x: number; hp: number; figure: string };
  player2?: { name: string; ws: WebSocket; x: number; hp: number; figure: string };
  state: "waiting" | "playing" | "finished";
  winner?: number;
}

const gameRooms = new Map<string, GameRoom>();
const waitingPlayers: Array<{ name: string; ws: WebSocket; figure: string }> = [];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/tekken" });
  // Cache for Habbo user data to reduce API calls
  const userCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour

  // Habbo API endpoints to try
  const HABBO_API_ENDPOINTS = [
    (username: string) => `https://origins.habbo.es/api/public/users?name=${encodeURIComponent(username)}`,
    (username: string) => `https://habbo.com.br/api/public/users?name=${encodeURIComponent(username)}`,
    (username: string) => `https://habbo.fr/api/public/users?name=${encodeURIComponent(username)}`,
    (username: string) => `https://habbo.de/api/public/users?name=${encodeURIComponent(username)}`,
  ];

  // Proxy for Habbo Origins API with fallback endpoints and retry logic
  app.get(api.users.getFigure.path, async (req, res) => {
    const { username } = req.params;
    
    if (!username || username.length === 0) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Check cache first
    const cached = userCache.get(username.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache HIT] User: ${username}`);
      return res.json(cached.data);
    }

    try {
      let response = null;
      let lastError = null;

      // Try multiple endpoints with fallback
      for (const endpoint of HABBO_API_ENDPOINTS) {
        try {
          const url = endpoint(username);
          console.log(`[API Request] Trying endpoint for ${username}: ${url}`);
          
          response = await fetch(url, {
            headers: {
              'User-Agent': 'HabboCatcher/1.0',
            },
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            console.log(`[API Success] User ${username} found`);
            break;
          } else if (response.status === 404) {
            console.log(`[API 404] User ${username} not found on this endpoint`);
            lastError = new Error("User not found");
            continue;
          }
        } catch (error) {
          console.log(`[API Error] Endpoint failed for ${username}:`, error);
          lastError = error;
          continue;
        }
      }

      if (!response || !response.ok) {
        console.error(`[API Final Error] All endpoints failed for ${username}`, lastError);
        return res.status(404).json({ message: "User not found on any Habbo server" });
      }

      const data = await response.json();
      
      // Validate response has required fields
      if (!data.figureString || !data.name) {
        console.error(`[API Invalid] Missing figureString or name for ${username}`);
        return res.status(500).json({ message: "Invalid response from Habbo API" });
      }

      const responseData = { figureString: data.figureString, username: data.name };
      
      // Cache the result
      userCache.set(username.toLowerCase(), { data: responseData, timestamp: Date.now() });
      
      res.json(responseData);
    } catch (error) {
      console.error(`[API Unexpected Error] ${username}:`, error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  app.post(api.scores.create.path, async (req, res) => {
    try {
      const { username, score, figureString } = api.scores.create.input.parse(req.body);
      const user = await storage.createOrUpdateScore(username, score, figureString);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.scores.list.path, async (req, res) => {
    const leaderboard = await storage.getLeaderboard();
    res.json(leaderboard);
  });

  // Tekken endpoints
  app.post("/api/tekken/start", (req, res) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { player1 } = req.body;
    res.json({ sessionId, player1 });
  });

  app.post("/api/tekken/join", (req, res) => {
    const { sessionId, player2 } = req.body;
    res.json({ sessionId, player2, joined: true });
  });

  app.post("/api/tekken/update", (req, res) => {
    const { sessionId, player1Hp, player2Hp, winner } = req.body;
    res.json({ sessionId, player1Hp, player2Hp, winner });
  });

  app.get("/api/tekken/status/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    res.json({ sessionId, status: "active" });
  });

  // WebSocket handler
  wss.on("connection", (ws: WebSocket) => {
    let currentRoom: GameRoom | null = null;
    let playerNumber = 0;
    let playerName = "";

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "join") {
          playerName = message.username;
          const playerFigure = message.figure || "hr-155-1035.hd-185-1026.ch-255-1189.lg-275-1239.sh-290-62";
          
          // Find or create room
          if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift()!;
            const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            currentRoom = {
              id: roomId,
              player1: { name: opponent.name, ws: opponent.ws, x: 50, hp: 100, figure: opponent.figure },
              player2: { name: playerName, ws, x: 750, hp: 100, figure: playerFigure },
              state: "playing",
            };
            gameRooms.set(roomId, currentRoom);
            playerNumber = 2;

            // Notify both players with opponent figure
            opponent.ws.send(JSON.stringify({
              type: "start",
              roomId,
              playerNumber: 1,
              opponent: playerName,
              opponentFigure: playerFigure,
            }));
            ws.send(JSON.stringify({
              type: "start",
              roomId,
              playerNumber: 2,
              opponent: opponent.name,
              opponentFigure: opponent.figure,
            }));
          } else {
            waitingPlayers.push({ name: playerName, ws, figure: playerFigure });
            ws.send(JSON.stringify({ type: "waiting" }));
          }
        }

        if (message.type === "move" && currentRoom) {
          const room = currentRoom;
          if (playerNumber === 1) {
            room.player1.x = message.x;
            room.player2?.ws.send(JSON.stringify({
              type: "update",
              p1X: message.x,
              p2X: room.player2.x,
              p1Hp: room.player1.hp,
              p2Hp: room.player2.hp,
            }));
          } else if (playerNumber === 2) {
            room.player2!.x = message.x;
            room.player1.ws.send(JSON.stringify({
              type: "update",
              p1X: room.player1.x,
              p2X: message.x,
              p1Hp: room.player1.hp,
              p2Hp: room.player2!.hp,
            }));
          }
        }

        if (message.type === "attack" && currentRoom) {
          const room = currentRoom;
          if (playerNumber === 1) {
            room.player2!.hp = Math.max(0, room.player2!.hp - 15);
            room.player2!.ws.send(JSON.stringify({
              type: "damage",
              damage: 15,
              p2Hp: room.player2!.hp,
            }));
            if (room.player2!.hp <= 0) {
              room.state = "finished";
              room.winner = 1;
              room.player1.ws.send(JSON.stringify({ type: "win" }));
              room.player2!.ws.send(JSON.stringify({ type: "lose" }));
            }
          } else if (playerNumber === 2) {
            room.player1.hp = Math.max(0, room.player1.hp - 15);
            room.player1.ws.send(JSON.stringify({
              type: "damage",
              damage: 15,
              p1Hp: room.player1.hp,
            }));
            if (room.player1.hp <= 0) {
              room.state = "finished";
              room.winner = 2;
              room.player2!.ws.send(JSON.stringify({ type: "win" }));
              room.player1.ws.send(JSON.stringify({ type: "lose" }));
            }
          }
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    });

    ws.on("close", () => {
      if (currentRoom) {
        gameRooms.delete(currentRoom.id);
        currentRoom.player1.ws.close();
        currentRoom.player2?.ws.close();
      }
      waitingPlayers.splice(
        waitingPlayers.findIndex((p) => p.ws === ws),
        1
      );
    });
  });

  return httpServer;
}
