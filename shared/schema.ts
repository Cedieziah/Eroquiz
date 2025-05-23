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

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Question schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  questionImage: text("question_image"), // Optional image URL for the question
  options: json("options").$type<string[]>().notNull(),
  optionImages: json("option_images").$type<string[]>(), // Optional image URLs for answers
  correctAnswer: integer("correct_answer").notNull(),
  points: integer("points").notNull().default(50), // Default to 50 points
  categories: json("categories").$type<number[]>().notNull().default([1]), // Support multiple categories
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  question: true,
  questionImage: true,
  options: true,
  optionImages: true,
  correctAnswer: true,
  points: true,
  categories: true,
});

// Remove duplicate type definitions - use only the z.infer types
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// Game settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  quizDurationSeconds: integer("quiz_duration_seconds").notNull().default(300), // Default to 5 minutes
  timerSeconds: integer("timer_seconds").notNull().default(30), // Default to 30 seconds per question
  lives: integer("lives").notNull().default(5), // Default to 5 lives
  livesEnabled: boolean("lives_enabled").notNull().default(true), // Whether lives feature is enabled
  reviewModeEnabled: boolean("review_mode_enabled").notNull().default(false), // Whether review mode is enabled
  pointsPerCorrectAnswer: integer("points_per_correct_answer").notNull().default(50), // Default to 50 points
  timeBonus: integer("time_bonus").notNull().default(0), // Time bonus points (0 = disabled)
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  timerSeconds: true,
  quizDurationSeconds: true,
  lives: true,
  pointsPerCorrectAnswer: true,
  timeBonus: true,
  livesEnabled: true, // Add to schema
  reviewModeEnabled: true, // Add to schema
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
