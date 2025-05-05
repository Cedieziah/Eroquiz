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
  points: integer("points").notNull().default(50), // Default to 50 points
  category: integer("category").notNull().default(1), // Default to Category 1 (Grades 3-4)
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  question: true,
  options: true,
  correctAnswer: true,
  points: true,
  category: true, // Add category to schema
});

// Remove duplicate type definitions - use only the z.infer types
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// Game settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  timerSeconds: integer("timer_seconds").notNull().default(30),
  quizDurationSeconds: integer("quiz_duration_seconds").notNull().default(300), // 5 minutes default
  lives: integer("lives").notNull().default(5),
  pointsPerCorrectAnswer: integer("points_per_correct_answer").notNull().default(50),
  timeBonus: integer("time_bonus").notNull().default(5),
  livesEnabled: boolean("lives_enabled").notNull().default(true), // New field to toggle lives feature
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  timerSeconds: true,
  quizDurationSeconds: true,
  lives: true,
  pointsPerCorrectAnswer: true,
  timeBonus: true,
  livesEnabled: true, // Add to schema
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
