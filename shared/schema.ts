import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Question schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  correctAnswer: integer("correct_answer").notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  question: true,
  options: true,
  correctAnswer: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// Game settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  timerSeconds: integer("timer_seconds").notNull().default(30),
  lives: integer("lives").notNull().default(5),
  pointsPerCorrectAnswer: integer("points_per_correct_answer").notNull().default(50),
  timeBonus: integer("time_bonus").notNull().default(5),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  timerSeconds: true,
  lives: true,
  pointsPerCorrectAnswer: true,
  timeBonus: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Game session schema
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull().default(0),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  playerName: true,
  score: true,
  questionsAnswered: true,
  correctAnswers: true,
});

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
