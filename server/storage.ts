import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

import { 
  users, 
  questions, 
  settings, 
  gameSessions,
  categories,
  type User, 
  type InsertUser,
  type Question,
  type InsertQuestion,
  type Settings,
  type InsertSettings,
  type GameSession,
  type InsertGameSession,
  type Category,
  type InsertCategory
} from "@shared/schema";

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Question methods
  getAllQuestions(): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Settings methods
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
  
  // Game session methods
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSessions(): Promise<GameSession[]>;
}

// Keep the existing in-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private categories: Map<number, Category>;
  private gameSettings: Settings;
  private gameSessions: Map<number, GameSession>;
  private currentUserId: number;
  private currentQuestionId: number;
  private currentGameSessionId: number;
  private currentCategoryId: number;

  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.categories = new Map();
    this.gameSessions = new Map();
    this.currentUserId = 1;
    this.currentQuestionId = 1;
    this.currentGameSessionId = 1;
    this.currentCategoryId = 1;
    
    // Initialize with default settings
    this.gameSettings = {
      id: 1,
      timerSeconds: 30,
      quizDurationSeconds: 300, // 5 minutes total quiz duration
      lives: 5,
      pointsPerCorrectAnswer: 50,
      timeBonus: 5,
      livesEnabled: true,  // Add the livesEnabled field with default true
      reviewModeEnabled: false // Add the reviewModeEnabled field with default false
    };
    
    // Add default categories
    this.createDefaultCategories();
    
    // Add some default questions
    this.createDefaultQuestions();
  }

  private createDefaultCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: "Category 1", description: "Grades 3-4" },
      { name: "Category 2", description: "Grades 5-6" },
      { name: "Category 3", description: "Grades 7-8" },
      { name: "Category 4", description: "Grades 9-10" },
      { name: "Category 5", description: "Grades 11-12" }
    ];

    defaultCategories.forEach(category => {
      this.createCategory(category);
    });
  }

  private createDefaultQuestions() {
    const defaultQuestions: InsertQuestion[] = [
      {
        question: "Which of these is NOT a programming language?",
        options: ["Jabbascript", "Python", "Java", "C++"],
        correctAnswer: 0,
        points: 50 // Add points field
      },
      {
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Technology Modern Language",
          "Hyperlink and Text Markup Language",
          "Home Tool Markup Language"
        ],
        correctAnswer: 0,
        points: 50
      },
      {
        question: "Which company created JavaScript?",
        options: ["Microsoft", "Netscape", "Apple", "Google"],
        correctAnswer: 1,
        points: 50
      },
      {
        question: "Which symbol is used for single-line comments in JavaScript?",
        options: ["//", "/* */", "#", "<!---->"],
        correctAnswer: 0,
        points: 50
      },
      {
        question: "What is the correct way to write a JavaScript array?",
        options: [
          "var colors = ['red', 'green', 'blue']",
          "var colors = (1:'red', 2:'green', 3:'blue')",
          "var colors = 'red', 'green', 'blue'",
          "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')"
        ],
        correctAnswer: 0,
        points: 50
      }
    ];

    defaultQuestions.forEach((q) => this.createQuestion(q));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Question methods
  async getAllQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    const question: Question = {
      ...insertQuestion,
      id,
      options: [...insertQuestion.options], // Ensure options is a string[]
      questionImage: insertQuestion.questionImage || null,
      optionImages: insertQuestion.optionImages ? 
        [...insertQuestion.optionImages] : null,
      points: insertQuestion.points ?? 50, // Ensure points is defined with default value
      categories: insertQuestion.categories ? 
        [...insertQuestion.categories] : [1] // Handle multiple categories
    };
    this.questions.set(id, question);
    return question;
  }
  
  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    const existingQuestion = this.questions.get(id);
    if (!existingQuestion) {
      return undefined;
    }
    
    const updatedQuestion: Question = {
      ...existingQuestion,
      ...questionUpdate,
      options: questionUpdate.options ? [...questionUpdate.options] : existingQuestion.options,
      questionImage: questionUpdate.questionImage !== undefined ? 
        questionUpdate.questionImage : existingQuestion.questionImage,
      optionImages: questionUpdate.optionImages !== undefined ?
        questionUpdate.optionImages ? [...questionUpdate.optionImages] : null 
        : existingQuestion.optionImages,
      points: questionUpdate.points ?? existingQuestion.points,
      categories: questionUpdate.categories !== undefined ?
        questionUpdate.categories ? [...questionUpdate.categories] : existingQuestion.categories : existingQuestion.categories
    };
    
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) {
      return undefined;
    }

    const updatedCategory: Category = {
      ...existingCategory,
      ...categoryUpdate
    };

    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Settings methods
  async getSettings(): Promise<Settings> {
    return this.gameSettings;
  }
  
  async updateSettings(settingsUpdate: Partial<InsertSettings>): Promise<Settings> {
    this.gameSettings = {
      ...this.gameSettings,
      ...settingsUpdate
    };
    
    return this.gameSettings;
  }
  
  // Game session methods
  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const id = this.currentGameSessionId++;
    const session: GameSession = {
      ...insertSession,
      id,
      score: insertSession.score ?? 0, // Default to 0 if undefined
      questionsAnswered: insertSession.questionsAnswered ?? 0,
      correctAnswers: insertSession.correctAnswers ?? 0,
    };
    this.gameSessions.set(id, session);
    return session;
  }
  
  async getGameSessions(): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values());
  }
}

// New SQLite storage implementation
export class SQLiteStorage implements IStorage {
  private db: Database.Database;
  private dbPath: string;
  
  constructor(dbPath?: string) {
    // Set default database path if not provided
    this.dbPath = dbPath || path.join(__dirname, '../data/quiz.db');
    
    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Initialize database
    this.db = new Database(this.dbPath);
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Initialize database schema
    this.initializeSchema();
    
    // Add default data if database is empty
    this.addDefaultData();
  }
  
  private initializeSchema(): void {
    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
    
    // Create categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL
      )
    `);
    
    // Create questions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        question_image TEXT,
        options TEXT NOT NULL,
        option_images TEXT,
        correct_answer INTEGER NOT NULL,
        points INTEGER NOT NULL DEFAULT 50,
        categories TEXT NOT NULL
      )
    `);
    
    // Create settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timer_seconds INTEGER NOT NULL DEFAULT 30,
        quiz_duration_seconds INTEGER NOT NULL DEFAULT 300,
        lives INTEGER NOT NULL DEFAULT 5,
        points_per_correct_answer INTEGER NOT NULL DEFAULT 50,
        time_bonus INTEGER NOT NULL DEFAULT 5,
        lives_enabled BOOLEAN NOT NULL DEFAULT 1,
        review_mode_enabled BOOLEAN NOT NULL DEFAULT 0
      )
    `);
    
    // Create game sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        questions_answered INTEGER NOT NULL DEFAULT 0,
        correct_answers INTEGER NOT NULL DEFAULT 0
      )
    `);
  }
  
  private addDefaultData(): void {
    // Check if settings exists, if not create default
    const settingsCheck = this.db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
    if (settingsCheck.count === 0) {
      this.db.prepare(`
        INSERT INTO settings (timer_seconds, quiz_duration_seconds, lives, points_per_correct_answer, time_bonus, lives_enabled, review_mode_enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(30, 300, 5, 50, 5, 1, 0);
    }
    
    // Add default categories if none exist
    const categoriesCheck = this.db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    if (categoriesCheck.count === 0) {
      this.createDefaultCategories();
    }
    
    // Add default questions if none exist
    const questionsCheck = this.db.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
    if (questionsCheck.count === 0) {
      this.createDefaultQuestions();
    }
  }
  
  private createDefaultCategories(): void {
    const defaultCategories: InsertCategory[] = [
      { name: "Category 1", description: "Grades 3-4" },
      { name: "Category 2", description: "Grades 5-6" },
      { name: "Category 3", description: "Grades 7-8" },
      { name: "Category 4", description: "Grades 9-10" },
      { name: "Category 5", description: "Grades 11-12" }
    ];

    const stmt = this.db.prepare(`
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `);
    
    for (const category of defaultCategories) {
      stmt.run(category.name, category.description);
    }
  }
  
  private createDefaultQuestions(): void {
    const defaultQuestions: InsertQuestion[] = [
      {
        question: "Which of these is NOT a programming language?",
        options: ["Jabbascript", "Python", "Java", "C++"],
        correctAnswer: 0,
        points: 50
      },
      {
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Technology Modern Language",
          "Hyperlink and Text Markup Language",
          "Home Tool Markup Language"
        ],
        correctAnswer: 0,
        points: 50
      },
      {
        question: "Which company created JavaScript?",
        options: ["Microsoft", "Netscape", "Apple", "Google"],
        correctAnswer: 1,
        points: 50
      },
      {
        question: "Which symbol is used for single-line comments in JavaScript?",
        options: ["//", "/* */", "#", "<!---->"],
        correctAnswer: 0,
        points: 50
      },
      {
        question: "What is the correct way to write a JavaScript array?",
        options: [
          "var colors = ['red', 'green', 'blue']",
          "var colors = (1:'red', 2:'green', 3:'blue')",
          "var colors = 'red', 'green', 'blue'",
          "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')"
        ],
        correctAnswer: 0,
        points: 50
      }
    ];
    
    const stmt = this.db.prepare(`
      INSERT INTO questions (question, options, correct_answer, points, categories)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const q of defaultQuestions) {
      stmt.run(
        q.question, 
        JSON.stringify(q.options), 
        q.correctAnswer, 
        q.points || 50,
        JSON.stringify(q.categories || [1])
      );
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = this.db.prepare(`
      INSERT INTO users (username, password)
      VALUES (?, ?)
    `).run(insertUser.username, insertUser.password);
    
    const newUser: User = {
      id: result.lastInsertRowid as number,
      ...insertUser
    };
    
    return newUser;
  }
  
  // Question methods
  async getAllQuestions(): Promise<Question[]> {
    const rows = this.db.prepare('SELECT * FROM questions').all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      question: row.question,
      questionImage: row.question_image,
      options: JSON.parse(row.options) as string[],
      optionImages: row.option_images ? JSON.parse(row.option_images) as string[] : null,
      correctAnswer: row.correct_answer,
      points: row.points,
      categories: JSON.parse(row.categories) as number[]
    }));
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    const row = this.db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as any;
    
    if (!row) return undefined;
    
    return {
      id: row.id,
      question: row.question,
      questionImage: row.question_image,
      options: JSON.parse(row.options) as string[],
      optionImages: row.option_images ? JSON.parse(row.option_images) as string[] : null,
      correctAnswer: row.correct_answer,
      points: row.points,
      categories: JSON.parse(row.categories) as number[]
    };
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const result = this.db.prepare(`
      INSERT INTO questions (question, question_image, options, option_images, correct_answer, points, categories)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      insertQuestion.question,
      insertQuestion.questionImage || null,
      JSON.stringify(insertQuestion.options),
      insertQuestion.optionImages ? JSON.stringify(insertQuestion.optionImages) : null,
      insertQuestion.correctAnswer,
      insertQuestion.points || 50,
      JSON.stringify(insertQuestion.categories || [1])
    );
    
    const newId = result.lastInsertRowid as number;
    
    const question: Question = {
      id: newId,
      question: insertQuestion.question,
      questionImage: insertQuestion.questionImage || null,
      options: [...insertQuestion.options],
      optionImages: insertQuestion.optionImages ? [...insertQuestion.optionImages] : null,
      correctAnswer: insertQuestion.correctAnswer,
      points: insertQuestion.points || 50,
      categories: insertQuestion.categories ? [...insertQuestion.categories] : [1]
    };
    
    return question;
  }
  
  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    // First get the existing question
    const existingQuestion = await this.getQuestion(id);
    if (!existingQuestion) {
      return undefined;
    }
    
    // Create updated question by merging existing with updates
    const updatedQuestion: Question = {
      ...existingQuestion,
      ...questionUpdate,
      options: questionUpdate.options ? [...questionUpdate.options] : existingQuestion.options,
      optionImages: questionUpdate.optionImages !== undefined ? 
        questionUpdate.optionImages ? [...questionUpdate.optionImages] : null : existingQuestion.optionImages,
      categories: questionUpdate.categories !== undefined ?
        questionUpdate.categories ? [...questionUpdate.categories] : existingQuestion.categories : existingQuestion.categories
    };
    
    // Update in database
    this.db.prepare(`
      UPDATE questions
      SET question = ?, question_image = ?, options = ?, option_images = ?, correct_answer = ?, points = ?, categories = ?
      WHERE id = ?
    `).run(
      updatedQuestion.question,
      updatedQuestion.questionImage,
      JSON.stringify(updatedQuestion.options),
      updatedQuestion.optionImages ? JSON.stringify(updatedQuestion.optionImages) : null,
      updatedQuestion.correctAnswer,
      updatedQuestion.points,
      JSON.stringify(updatedQuestion.categories),
      id
    );
    
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM questions WHERE id = ?').run(id);
    return result.changes > 0;
  }
  
  // Category methods
  async getAllCategories(): Promise<Category[]> {
    const rows = this.db.prepare('SELECT * FROM categories').all() as Category[];
    return rows;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const category = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = this.db.prepare(`
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `).run(insertCategory.name, insertCategory.description);
    
    const newCategory: Category = {
      id: result.lastInsertRowid as number,
      ...insertCategory
    };
    
    return newCategory;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    // First get the existing category
    const existingCategory = await this.getCategory(id);
    if (!existingCategory) {
      return undefined;
    }
    
    const updatedCategory = {
      ...existingCategory,
      ...categoryUpdate
    };
    
    this.db.prepare(`
      UPDATE categories
      SET name = ?, description = ?
      WHERE id = ?
    `).run(updatedCategory.name, updatedCategory.description, id);
    
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return result.changes > 0;
  }
  
  // Settings methods
  async getSettings(): Promise<Settings> {
    const row = this.db.prepare('SELECT * FROM settings ORDER BY id LIMIT 1').get() as any;
    
    if (!row) {
      // If no settings found, create default and return
      this.db.prepare(`
        INSERT INTO settings (timer_seconds, quiz_duration_seconds, lives, points_per_correct_answer, time_bonus, lives_enabled, review_mode_enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(30, 300, 5, 50, 5, 1, 0);
      
      return {
        id: 1,
        timerSeconds: 30,
        quizDurationSeconds: 300,
        lives: 5,
        pointsPerCorrectAnswer: 50,
        timeBonus: 5,
        livesEnabled: true,
        reviewModeEnabled: false
      };
    }
    
    return {
      id: row.id,
      timerSeconds: row.timer_seconds,
      quizDurationSeconds: row.quiz_duration_seconds,
      lives: row.lives,
      pointsPerCorrectAnswer: row.points_per_correct_answer,
      timeBonus: row.time_bonus,
      livesEnabled: Boolean(row.lives_enabled),
      reviewModeEnabled: Boolean(row.review_mode_enabled)
    };
  }
  
  async updateSettings(settingsUpdate: Partial<InsertSettings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    
    const updatedSettings = {
      ...currentSettings,
      ...settingsUpdate
    };
    
    this.db.prepare(`
      UPDATE settings
      SET timer_seconds = ?, quiz_duration_seconds = ?, lives = ?, points_per_correct_answer = ?, time_bonus = ?, lives_enabled = ?, review_mode_enabled = ?
      WHERE id = ?
    `).run(
      updatedSettings.timerSeconds,
      updatedSettings.quizDurationSeconds,
      updatedSettings.lives,
      updatedSettings.pointsPerCorrectAnswer,
      updatedSettings.timeBonus,
      updatedSettings.livesEnabled ? 1 : 0,
      updatedSettings.reviewModeEnabled ? 1 : 0,
      currentSettings.id
    );
    
    return updatedSettings;
  }
  
  // Game session methods
  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const result = this.db.prepare(`
      INSERT INTO game_sessions (player_name, score, questions_answered, correct_answers)
      VALUES (?, ?, ?, ?)
    `).run(
      insertSession.playerName,
      insertSession.score || 0,
      insertSession.questionsAnswered || 0,
      insertSession.correctAnswers || 0
    );
    
    const newSession: GameSession = {
      id: result.lastInsertRowid as number,
      playerName: insertSession.playerName,
      score: insertSession.score || 0,
      questionsAnswered: insertSession.questionsAnswered || 0,
      correctAnswers: insertSession.correctAnswers || 0
    };
    
    return newSession;
  }
  
  async getGameSessions(): Promise<GameSession[]> {
    const rows = this.db.prepare('SELECT * FROM game_sessions ORDER BY score DESC').all() as GameSession[];
    return rows;
  }
}

// Export SQLite implementation instead of memory implementation
export const storage = new SQLiteStorage();
