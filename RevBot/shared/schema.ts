import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  messages: jsonb("messages").notNull().default([]),
  language: text("language").notNull().default("hinglish"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  messages: true,
  language: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Message types for voice chat
export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
  audioUrl: z.string().optional(),
  language: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// Voice chat session types
export const VoiceChatSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  language: z.enum(["english", "hindi", "hinglish", "auto"]),
  isRecording: z.boolean(),
  isProcessing: z.boolean(),
  connectionStatus: z.enum(["disconnected", "connecting", "connected", "error"]),
});

export type VoiceChatSession = z.infer<typeof VoiceChatSessionSchema>;
