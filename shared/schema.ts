import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  highScore: integer("high_score").default(0),
  figureString: text("figure_string"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tekkenSessions = pgTable("tekken_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 50 }).notNull().unique(),
  player1: text("player1").notNull(),
  player2: text("player2"),
  player1Hp: integer("player1_hp").default(100),
  player2Hp: integer("player2_hp").default(100),
  winner: text("winner"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  highScore: true,
  figureString: true,
});

export const scoreSchema = z.object({
  username: z.string(),
  score: z.number(),
  figureString: z.string().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ScoreRequest = z.infer<typeof scoreSchema>;
export type TekkenSession = typeof tekkenSessions.$inferSelect;
