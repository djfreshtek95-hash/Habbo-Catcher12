import { z } from 'zod';
import { insertUserSchema, scoreSchema, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    getFigure: {
      method: 'GET' as const,
      path: '/api/users/:username/figure',
      responses: {
        200: z.object({ figureString: z.string(), username: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  scores: {
    create: {
      method: 'POST' as const,
      path: '/api/scores',
      input: scoreSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(), // Returns the user record with high score
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/scores',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ScoreInput = z.infer<typeof api.scores.create.input>;
export type UserResponse = z.infer<typeof api.scores.create.responses[201]>;
export type LeaderboardResponse = z.infer<typeof api.scores.list.responses[200]>;
