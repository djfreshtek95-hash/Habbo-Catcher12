import { db } from "./db";
import { users, type User, type InsertUser } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(username: string): Promise<User | undefined>;
  createOrUpdateScore(username: string, score: number, figureString?: string): Promise<User>;
  getLeaderboard(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createOrUpdateScore(username: string, score: number, figureString?: string): Promise<User> {
    const [existing] = await db.select().from(users).where(eq(users.username, username));

    if (existing) {
      if (score > (existing.highScore || 0)) {
        const [updated] = await db
          .update(users)
          .set({ highScore: score, figureString: figureString || existing.figureString, updatedAt: new Date() })
          .where(eq(users.username, username))
          .returning();
        return updated;
      }
      return existing;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({ username, highScore: score, figureString })
        .returning();
      return newUser;
    }
  }

  async getLeaderboard(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.highScore))
      .limit(10);
  }
}

export const storage = new DatabaseStorage();
