import { 
  users, 
  questions, 
  settings, 
  gameSessions,
  type User, 
  type InsertUser,
  type Question,
  type InsertQuestion,
  type Settings,
  type InsertSettings,
  type GameSession,
  type InsertGameSession
} from "@shared/schema";

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
  
  // Settings methods
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
  
  // Game session methods
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSessions(): Promise<GameSession[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private gameSettings: Settings;
  private gameSessions: Map<number, GameSession>;
  private currentUserId: number;
  private currentQuestionId: number;
  private currentGameSessionId: number;

  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.gameSessions = new Map();
    this.currentUserId = 1;
    this.currentQuestionId = 1;
    this.currentGameSessionId = 1;
    
    // Initialize with default settings
    this.gameSettings = {
      id: 1,
      timerSeconds: 30,
      lives: 5,
      pointsPerCorrectAnswer: 50,
      timeBonus: 5
    };
    
    // Add some default questions
    this.createDefaultQuestions();
  }

  private createDefaultQuestions() {
    const defaultQuestions: InsertQuestion[] = [
      {
        question: "Which of these is NOT a programming language?",
        options: ["Jabbascript", "Python", "Java", "C++"], // Ensure options is string[]
        correctAnswer: 0,
      },
      {
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Technology Modern Language",
          "Hyperlink and Text Markup Language",
          "Home Tool Markup Language",
        ],
        correctAnswer: 0,
      },
      {
        question: "Which company created JavaScript?",
        options: ["Microsoft", "Netscape", "Apple", "Google"],
        correctAnswer: 1,
      },
      {
        question: "Which symbol is used for single-line comments in JavaScript?",
        options: ["//", "/* */", "#", "<!---->"],
        correctAnswer: 0,
      },
      {
        question: "What is the correct way to write a JavaScript array?",
        options: [
          "var colors = ['red', 'green', 'blue']",
          "var colors = (1:'red', 2:'green', 3:'blue')",
          "var colors = 'red', 'green', 'blue'",
          "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')",
        ],
        correctAnswer: 0,
      },
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
      options: questionUpdate.options ? [...questionUpdate.options] : existingQuestion.options, // Ensure options is a string[]
    };
    
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
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

export const storage = new MemStorage();
