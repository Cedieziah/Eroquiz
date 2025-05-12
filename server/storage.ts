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
      livesEnabled: true  // Add the livesEnabled field with default true
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
        Array.isArray(insertQuestion.optionImages) ? insertQuestion.optionImages : null : null,
      points: insertQuestion.points ?? 50, // Ensure points is defined with default value
      categories: insertQuestion.categories ? 
        Array.isArray(insertQuestion.categories) ? insertQuestion.categories : [1] : [1] // Handle multiple categories
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
        Array.isArray(questionUpdate.optionImages) ? questionUpdate.optionImages : null : existingQuestion.optionImages,
      points: questionUpdate.points ?? existingQuestion.points,
      categories: questionUpdate.categories !== undefined ?
        Array.isArray(questionUpdate.categories) ? questionUpdate.categories : existingQuestion.categories : existingQuestion.categories
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

export const storage = new MemStorage();
