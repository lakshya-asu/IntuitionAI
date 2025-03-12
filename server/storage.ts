import { 
  users, type User, type InsertUser, 
  type Module, type Resource, type Assessment,
  type UserModule, type UserAssessment, type Recommendation, type Skill, 
  type ChatMessage, type InsertChatMessage, type UserPersona,
  chatMessages, userPersonas
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Calendar management
  getCalendarEvents(userId: number): Promise<CalendarEvent[]>;
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: number): Promise<void>;
  updateGoogleEventId(id: number, googleEventId: string): Promise<void>;

  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCurrentUser(): Promise<User | undefined>;
  setCurrentUser(user: User): Promise<void>;
  updateUserProfile(profile: { name: string; email: string }): Promise<User>;
  updateUserPreferences(preferences: {
    learningSpeed: number;
    dailyGoal: number;
    emailNotifications: boolean;
    pushNotifications: boolean;
  }): Promise<User>;
  
  // User persona management
  getUserPersona(userId: number): Promise<UserPersona | undefined>;
  saveUserPersona(userId: number, persona: {
    contentFormat: string[];
    studyHabits: string[];
    currentWeaknesses: string[];
    learningStyle: string;
    rawAnalysis?: any;
  }): Promise<UserPersona>;

  // Learning path and curriculum
  getLearningPath(): Promise<{
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'upcoming';
    progress?: number;
    completedOn?: string;
    topics: string[];
  }[]>;
  
  getCurriculum(): Promise<{
    modules: Module[];
  }>;
  
  getLearningLibrary(): Promise<{
    resources: Resource[];
  }>;

  // User progress
  getUserStats(): Promise<{
    masteryScore: number;
    masteryGrowth: string;
    streak: number;
    streakDays: { date: string; completed: boolean }[];
    completedModules: number;
    totalModules: number;
    focusAreas: { name: string; percentage: number; color: string }[];
  }>;

  getUserSettings(): Promise<{
    name: string;
    email: string;
    preferences: {
      learningSpeed: number;
      dailyGoal: number;
      emailNotifications: boolean;
      pushNotifications: boolean;
    };
  }>;

  getLearningHistory(): Promise<{
    completedModules: {
      id: string;
      title: string;
      topics: string[];
      completedAt: string;
      score: number;
    }[];
    inProgressModules: {
      id: string;
      title: string;
      topics: string[];
      progress: number;
    }[];
    assessmentResults: {
      id: string;
      type: string;
      score: number;
      completedAt: string;
      strengths: string[];
      weaknesses: string[];
    }[];
  }>;

  // Recommendations
  getRecommendations(): Promise<Recommendation[]>;
  saveRecommendations(recommendations: Recommendation[]): Promise<void>;

  // Assessments
  getSuggestedAssessments(): Promise<Assessment[]>;
  saveSuggestedAssessments(assessments: Assessment[]): Promise<void>;
  getAssessmentResults(): Promise<{
    id: string;
    title: string;
    score: number;
    date: string;
    topics: { name: string; score: number }[];
  }[]>;
  startAssessment(assessmentType: string): Promise<Assessment>;
  submitAnswer(assessmentId: string, questionId: string, answer: string): Promise<{
    correct: boolean;
    feedback: string;
  }>;
  completeAssessment(assessmentId: string): Promise<{
    score: number;
    feedback: string;
  }>;

  // Skills
  getUserSkills(): Promise<{
    radar: {
      labels: string[];
      current: number[];
      average: number[];
    };
    breakdown: {
      skill: string;
      score: number;
    }[];
    recommendation: string;
  }>;
  saveUserSkills(skills: any): Promise<void>;

  // Analytics
  getUserAnalytics(timeRange: string): Promise<{
    activityData: any[];
    competencyData: any[];
    assessmentData: any[];
    skillData: any[];
    efficiency: {
      completionRate: number;
      avgLearningTime: number;
      knowledgeRetention: number;
    };
  }>;

  // Module interaction
  startModule(moduleId: string): Promise<{
    success: boolean;
    message: string;
  }>;
  completeModule(moduleId: string): Promise<{
    success: boolean;
    message: string;
  }>;

  // Chat messages
  getChatMessages(userId: number, conversationId: string): Promise<ChatMessage[]>;
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getConversations(userId: number): Promise<{id: string, lastMessage: string, timestamp: Date}[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private currentId: number;
  private currentUser: User | undefined;
  
  async setCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
  }
  
  private mockData: {
    learningPath: any[];
    curriculum: { modules: any[] };
    library: { resources: any[] };
    recommendations: any[];
    assessments: any[];
    userStats: any;
    userSkills: any;
    learningHistory: any;
    analytics: any;
    calendarEvents: CalendarEvent[];
  };

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.mockData = {
      learningPath: [
        {
          id: "path1",
          title: "Machine Learning Foundations",
          description: "Core concepts of machine learning and neural networks",
          status: "completed",
          completedOn: "2025-03-01",
          topics: ["Neural Networks", "Supervised Learning", "Model Evaluation"],
        },
        {
          id: "path2",
          title: "Philosophy of Mind",
          description: "Philosophical explorations of consciousness and cognition",
          status: "in-progress",
          progress: 65,
          topics: ["Consciousness", "Dualism", "Embodied Cognition"],
        },
        {
          id: "path3",
          title: "Probabilistic Reasoning",
          description: "Statistical approaches to causality and inference",
          status: "in-progress",
          progress: 30,
          topics: ["Bayesian Networks", "Causal Inference", "Probability Theory"],
        },
        {
          id: "path4",
          title: "Perception Systems",
          description: "How humans and machines perceive the world",
          status: "upcoming",
          progress: 0,
          topics: ["Visual Processing", "Auditory Systems", "Sensory Integration"],
        },
        {
          id: "path5",
          title: "Cognitive Systems Architecture",
          description: "Integrated frameworks for cognitive processing",
          status: "upcoming",
          progress: 0,
          topics: ["Memory Systems", "Attention Mechanisms", "Decision Making"],
        },
        {
          id: "path6",
          title: "Quantum Physics Fundamentals",
          description: "Core principles of quantum mechanics",
          status: "upcoming",
          progress: 0,
          topics: ["Quantum Entanglement", "Wave-Particle Duality", "Uncertainty Principle"],
        },
      ],
      curriculum: {
        modules: [
          {
            id: "mod1",
            title: "Introduction to Machine Learning",
            description: "Fundamental concepts of ML algorithms and applications",
            icon: "smart_toy",
            status: "completed",
            progress: 100,
            topics: ["Supervised Learning", "Neural Networks", "Model Evaluation"],
          },
          {
            id: "mod2",
            title: "Philosophy of Mind",
            description: "Explorations of consciousness and cognitive theories",
            icon: "psychology",
            status: "in-progress",
            progress: 65,
            topics: ["Consciousness", "Dualism", "Embodied Cognition"],
          },
          {
            id: "mod3",
            title: "Probabilistic Reasoning",
            description: "Statistical approaches to causality and inference",
            icon: "functions",
            status: "in-progress",
            progress: 30,
            topics: ["Bayesian Networks", "Causal Inference", "Probability Theory"],
          },
          {
            id: "mod4",
            title: "Perception Systems",
            description: "How humans and machines perceive and interpret the world",
            icon: "visibility",
            status: "upcoming",
            progress: 0,
            topics: ["Visual Processing", "Auditory Systems", "Sensory Integration"],
          },
          {
            id: "mod5",
            title: "Cognitive Systems Architecture",
            description: "Understanding integrated cognitive frameworks",
            icon: "psychology_alt",
            status: "upcoming",
            progress: 0,
            topics: ["Memory Systems", "Attention Mechanisms", "Decision Making"],
          },
          {
            id: "mod6",
            title: "Quantum Physics Fundamentals",
            description: "Core principles of quantum mechanics and their implications",
            icon: "scatter_plot",
            status: "upcoming",
            progress: 0,
            topics: ["Quantum Entanglement", "Wave-Particle Duality", "Uncertainty Principle"],
          },
        ],
      },
      library: {
        resources: [
          // Articles
          {
            id: "res1",
            title: "Deep Learning Architecture Explained",
            description: "Comprehensive guide to neural network architectures",
            type: "article",
            tags: ["Machine Learning", "Deep Learning", "Neural Networks"],
            duration: "20 mins",
          },
          {
            id: "res2",
            title: "Philosophical Implications of Consciousness",
            description: "Modern perspectives on the hard problem of consciousness",
            type: "article",
            tags: ["Philosophy", "Consciousness", "Mind"],
            duration: "25 mins",
          },
          {
            id: "res3",
            title: "Causal Inference in Machine Learning",
            description: "How causality affects model interpretability",
            type: "article",
            tags: ["Probabilistic Reasoning", "Causality", "Machine Learning"],
            duration: "18 mins",
          },
          
          // Videos
          {
            id: "res4",
            title: "Visual System Architecture",
            description: "From retina to visual cortex: How vision works",
            type: "video",
            tags: ["Perception", "Neuroscience", "Vision"],
            duration: "32 mins",
          },
          {
            id: "res5",
            title: "Quantum Computing Explained",
            description: "Fundamentals of quantum computing for beginners",
            type: "video",
            tags: ["Quantum Physics", "Computing", "Qubits"],
            duration: "45 mins",
          },
          
          // Interactive
          {
            id: "res6",
            title: "Probabilistic Models Simulator",
            description: "Interactive tool to explore Bayesian networks",
            type: "interactive",
            tags: ["Probabilistic Reasoning", "Bayesian Networks", "Statistics"],
            duration: "Self-paced",
          },
          
          // Podcasts/Audiobooks
          {
            id: "res7",
            title: "The Nature of Consciousness",
            description: "In-depth discussions with leading philosophers of mind",
            type: "podcast",
            tags: ["Philosophy", "Consciousness", "Mind"],
            duration: "5 episodes",
          },
          {
            id: "res8",
            title: "Quantum Reality",
            description: "Audiobook exploring quantum mechanics interpretations",
            type: "audiobook",
            tags: ["Quantum Physics", "Physics", "Reality"],
            duration: "8.5 hrs",
          },
          
          // Books
          {
            id: "res9",
            title: "Pattern Recognition and Machine Learning",
            description: "Comprehensive textbook on machine learning methods",
            type: "book",
            tags: ["Machine Learning", "Statistics", "Pattern Recognition"],
            duration: "738 pages",
          },
          {
            id: "res10",
            title: "The Mind's I: Fantasies and Reflections on Self & Soul",
            description: "Explorations of the nature of the self",
            type: "book",
            tags: ["Philosophy", "Consciousness", "Cognitive Science"],
            duration: "512 pages",
          },
        ],
      },
      recommendations: [],
      assessments: [],
      userStats: {
        masteryScore: 75,
        masteryGrowth: "+5% this week",
        streak: 7,
        streakDays: Array(7).fill(null).map((_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          completed: true
        })),
        completedModules: 8,
        totalModules: 12,
        focusAreas: [
          { name: "Machine Learning", percentage: 45, color: "#3B82F6" },
          { name: "Philosophy", percentage: 30, color: "#8B5CF6" },
          { name: "Probabilistic Reasoning", percentage: 25, color: "#10B981" },
        ],
      },
      userSkills: {
        radar: {
          labels: ["Machine Learning", "Philosophy", "Probabilistic Reasoning", "Perception", "Cognitive Systems"],
          current: [80, 65, 45, 70, 60],
          average: [65, 60, 55, 65, 55],
        },
        breakdown: [
          { skill: "Machine Learning", score: 80 },
          { skill: "Philosophy", score: 65 },
          { skill: "Probabilistic Reasoning", score: 45 },
          { skill: "Perception", score: 70 },
          { skill: "Cognitive Systems", score: 60 },
        ],
        recommendation: "Focus on improving your understanding of probabilistic reasoning to better understand causal inference techniques.",
      },
      learningHistory: {
        completedModules: [
          {
            id: "cm1",
            title: "React Basics",
            topics: ["Components", "Props", "State"],
            completedAt: "2025-02-28",
            score: 95,
          },
        ],
        inProgressModules: [
          {
            id: "im1",
            title: "Advanced React Patterns",
            topics: ["HOCs", "Render Props", "Custom Hooks"],
            progress: 60,
          },
        ],
        assessmentResults: [
          {
            id: "ar1",
            type: "Module Assessment",
            score: 85,
            completedAt: "2025-02-28",
            strengths: ["Component Design", "State Management"],
            weaknesses: ["Performance Optimization"],
          },
        ],
      },
      calendarEvents: [],
      analytics: {
        activityData: Array(30).fill(null).map((_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          minutes: Math.floor(Math.random() * 60 + 30),
        })),
        competencyData: Array(30).fill(null).map((_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          score: Math.min(100, 65 + Math.floor(Math.random() * 20)),
        })),
        assessmentData: [
          { name: "React Fundamentals", score: 85, average: 75 },
          { name: "TypeScript Basics", score: 78, average: 72 },
          { name: "Testing Principles", score: 65, average: 68 },
        ],
        skillData: [
          { subject: "React", score: 80, previousScore: 70 },
          { subject: "TypeScript", score: 65, previousScore: 55 },
          { subject: "Testing", score: 45, previousScore: 35 },
          { subject: "State Mgmt", score: 70, previousScore: 60 },
          { subject: "Performance", score: 60, previousScore: 50 },
        ],
        efficiency: {
          completionRate: 85,
          avgLearningTime: 45,
          knowledgeRetention: 88,
        },
      },
    };
  }

  async getCurrentUser(): Promise<User | undefined> {
    return this.currentUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser,
      id,
      level: "Beginner",
      interests: [],
      strengths: [],
      weaknesses: [],
      preferences: {
        learningSpeed: 3,
        dailyGoal: 30,
        emailNotifications: true,
        pushNotifications: true,
      }
    };
    this.users.set(id, user);
    this.currentUser = user;
    return user;
  }

  async updateUserProfile(profile: { name: string; email: string }): Promise<User> {
    if (!this.currentUser) throw new Error("No user logged in");
    this.currentUser = { ...this.currentUser, ...profile };
    this.users.set(this.currentUser.id, this.currentUser);
    return this.currentUser;
  }

  async updateUserPreferences(preferences: {
    learningSpeed: number;
    dailyGoal: number;
    emailNotifications: boolean;
    pushNotifications: boolean;
  }): Promise<User> {
    if (!this.currentUser) throw new Error("No user logged in");
    this.currentUser = { 
      ...this.currentUser, 
      preferences: { ...this.currentUser.preferences, ...preferences }
    };
    this.users.set(this.currentUser.id, this.currentUser);
    return this.currentUser;
  }

  async getLearningPath() {
    return this.mockData.learningPath;
  }

  async getCurriculum() {
    return this.mockData.curriculum;
  }

  async getLearningLibrary() {
    return this.mockData.library;
  }

  async getUserStats() {
    return this.mockData.userStats;
  }

  async getUserSettings() {
    if (!this.currentUser) throw new Error("No user logged in");
    return {
      name: this.currentUser.name,
      email: this.currentUser.email,
      preferences: this.currentUser.preferences as {
        learningSpeed: number;
        dailyGoal: number;
        emailNotifications: boolean;
        pushNotifications: boolean;
      },
    };
  }

  async getLearningHistory() {
    return this.mockData.learningHistory;
  }

  async getRecommendations() {
    return this.mockData.recommendations;
  }

  async saveRecommendations(recommendations: any[]) {
    this.mockData.recommendations = recommendations;
  }

  async getSuggestedAssessments() {
    return this.mockData.assessments;
  }

  async saveSuggestedAssessments(assessments: any[]) {
    this.mockData.assessments = assessments;
  }

  async getAssessmentResults() {
    return this.mockData.learningHistory.assessmentResults;
  }

  async getUserSkills() {
    return this.mockData.userSkills;
  }

  async saveUserSkills(skills: any) {
    this.mockData.userSkills = skills;
  }

  async getUserAnalytics(timeRange: string) {
    return this.mockData.analytics;
  }

  async startAssessment(assessmentType: string) {
    return {
      id: 1001, // Using a numeric ID to match the schema
      title: "Dynamic Assessment",
      description: "Adaptive assessment based on your skill level",
      type: assessmentType,
      difficulty: "medium",
      estimatedTime: "30 minutes",
    };
  }

  async submitAnswer(assessmentId: string, questionId: string, answer: string) {
    return {
      correct: Math.random() > 0.5,
      feedback: "Keep going! You're doing great.",
    };
  }

  async completeAssessment(assessmentId: string) {
    return {
      score: Math.floor(Math.random() * 40 + 60),
      feedback: "Great job! You've shown strong understanding in several areas.",
    };
  }

  async startModule(moduleId: string) {
    return {
      success: true,
      message: "Module started successfully",
    };
  }

  async completeModule(moduleId: string) {
    return {
      success: true,
      message: "Module completed successfully",
    };
  }
  
  // Calendar event methods
  async getCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    return this.mockData.calendarEvents.filter(event => event.userId === userId);
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    return this.mockData.calendarEvents.find(event => event.id === id);
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: this.mockData.calendarEvents.length + 1,
      googleEventId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.calendarEvents.push(newEvent);
    return newEvent;
  }

  async updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const index = this.mockData.calendarEvents.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Calendar event not found");
    
    const updatedEvent = {
      ...this.mockData.calendarEvents[index],
      ...event,
      updatedAt: new Date()
    };
    this.mockData.calendarEvents[index] = updatedEvent;
    return updatedEvent;
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    const index = this.mockData.calendarEvents.findIndex(e => e.id === id);
    if (index !== -1) {
      this.mockData.calendarEvents.splice(index, 1);
    }
  }

  async updateGoogleEventId(id: number, googleEventId: string): Promise<void> {
    const index = this.mockData.calendarEvents.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Calendar event not found");
    
    this.mockData.calendarEvents[index] = {
      ...this.mockData.calendarEvents[index],
      googleEventId,
      updatedAt: new Date()
    };
  }

  // Chat message methods
  async getChatMessages(userId: number, conversationId: string): Promise<ChatMessage[]> {
    // In memory implementation just returns an empty array
    return [];
  }
  
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    // In memory implementation just returns a mock message
    return {
      id: 1,
      userId: message.userId,
      role: message.role,
      content: message.content,
      timestamp: new Date(),
      conversationId: message.conversationId
    };
  }
  
  async getConversations(userId: number): Promise<{id: string, lastMessage: string, timestamp: Date}[]> {
    // In memory implementation just returns an empty array
    return [];
  }
  
  // User persona methods
  async getUserPersona(userId: number): Promise<UserPersona | undefined> {
    // Memory storage always returns undefined for new users
    return undefined;
  }
  
  async saveUserPersona(userId: number, persona: {
    contentFormat: string[];
    studyHabits: string[];
    currentWeaknesses: string[];
    learningStyle: string;
    rawAnalysis?: any;
  }): Promise<UserPersona> {
    // In memory implementation returns a mock persona
    return {
      id: 1,
      userId,
      contentFormat: persona.contentFormat,
      studyHabits: persona.studyHabits,
      currentWeaknesses: persona.currentWeaknesses,
      learningStyle: persona.learningStyle,
      lastAnalyzed: new Date(),
      rawAnalysis: persona.rawAnalysis || {}
    };
  }
}

// Database implementation
export class DatabaseStorage implements IStorage {
  private currentUser: User | undefined;

  // User management
  async getCurrentUser(): Promise<User | undefined> {
    return this.currentUser;
  }
  
  async setCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        level: "Beginner",
        interests: [],
        strengths: [],
        weaknesses: [],
        preferences: {
          learningSpeed: 3,
          dailyGoal: 30,
          emailNotifications: true,
          pushNotifications: true,
        }
      })
      .returning();
    
    this.currentUser = user;
    return user;
  }

  async updateUserProfile(profile: { name: string; email: string }): Promise<User> {
    if (!this.currentUser) throw new Error("No user logged in");
    
    const [updatedUser] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, this.currentUser.id))
      .returning();
    
    this.currentUser = updatedUser;
    return updatedUser;
  }

  async updateUserPreferences(preferences: {
    learningSpeed: number;
    dailyGoal: number;
    emailNotifications: boolean;
    pushNotifications: boolean;
  }): Promise<User> {
    if (!this.currentUser) throw new Error("No user logged in");
    
    const [updatedUser] = await db
      .update(users)
      .set({
        preferences: { 
          ...this.currentUser.preferences as any, 
          ...preferences 
        }
      })
      .where(eq(users.id, this.currentUser.id))
      .returning();
    
    this.currentUser = updatedUser;
    return updatedUser;
  }

  // Calendar events
  async getCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    return db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId));
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, id));
    return event;
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db
      .insert(calendarEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const [updatedEvent] = await db
      .update(calendarEvents)
      .set({
        ...event,
        updatedAt: new Date()
      })
      .where(eq(calendarEvents.id, id))
      .returning();
    
    if (!updatedEvent) throw new Error("Calendar event not found");
    return updatedEvent;
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.id, id));
  }

  async updateGoogleEventId(id: number, googleEventId: string): Promise<void> {
    await db
      .update(calendarEvents)
      .set({
        googleEventId,
        updatedAt: new Date()
      })
      .where(eq(calendarEvents.id, id));
  }

  // Chat messages
  async getChatMessages(userId: number, conversationId: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.timestamp));
  }
  
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [savedMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    
    return savedMessage;
  }
  
  async getConversations(userId: number): Promise<{id: string, lastMessage: string, timestamp: Date}[]> {
    // This is a complex query that would be better with SQL, but for now let's use a simpler approach
    const allMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.timestamp));
    
    // Group by conversationId and get the latest message
    const conversations = new Map<string, {id: string, lastMessage: string, timestamp: Date}>();
    
    for (const message of allMessages) {
      if (!conversations.has(message.conversationId)) {
        conversations.set(message.conversationId, {
          id: message.conversationId,
          lastMessage: message.content,
          timestamp: message.timestamp
        });
      }
    }
    
    return Array.from(conversations.values());
  }

  // Methods to be implemented as needed
  async getLearningPath() {
    // Would be implemented with database queries
    return [
      {
        id: "path1",
        title: "Machine Learning Foundations",
        description: "Learn the essential concepts of machine learning",
        status: 'completed' as const,
        completedOn: "2025-03-01",
        topics: ["Linear Regression", "Classification", "Neural Networks"],
      },
      {
        id: "path2",
        title: "Philosophy of Mind",
        description: "Explore philosophical concepts related to consciousness and cognition",
        status: 'in-progress' as const,
        progress: 65,
        topics: ["Consciousness", "Free Will", "Mind-Body Problem"],
      },
      {
        id: "path3",
        title: "Introduction to Causality",
        description: "Understanding causal inference and its applications",
        status: 'in-progress' as const,
        progress: 30,
        topics: ["Causal Graphs", "Interventions", "Counterfactuals"],
      },
      {
        id: "path4",
        title: "Quantum Physics Fundamentals",
        description: "Explore the fascinating world of quantum mechanics",
        status: 'upcoming' as const,
        topics: ["Wave Functions", "Uncertainty Principle", "Quantum Entanglement"],
      },
    ];
  }

  async getCurriculum() {
    // Would be implemented with database queries
    return {
      modules: [
        {
          id: 1,
          title: "Machine Learning Fundamentals",
          description: "Learn the core concepts of machine learning",
          icon: "brain",
          topics: ["Supervised Learning", "Neural Networks", "Model Evaluation"],
          difficulty: 2,
          estimatedTime: 120,
        },
        {
          id: 2,
          title: "Introduction to Philosophy of Mind",
          description: "Explore the philosophical concepts of consciousness",
          icon: "lightbulb",
          topics: ["Mind-Body Problem", "Consciousness", "Free Will"],
          difficulty: 3,
          estimatedTime: 90,
        },
        {
          id: 3,
          title: "Causal Inference",
          description: "Understanding causality and statistical inference",
          icon: "git-branch",
          topics: ["Causal Graphs", "Pearl's Causal Theory", "Interventions"],
          difficulty: 4,
          estimatedTime: 150,
        },
        {
          id: 4,
          title: "Quantum Mechanics Basics",
          description: "Introduction to the fundamental concepts of quantum physics",
          icon: "atom",
          topics: ["Wave Functions", "Uncertainty Principle", "Quantum Entanglement"],
          difficulty: 3,
          estimatedTime: 120,
        },
      ] as Module[],
    };
  }

  async getLearningLibrary() {
    // Would be implemented with database queries
    return {
      resources: [
        {
          id: 1,
          title: "Introduction to Reinforcement Learning",
          description: "Essential concepts of machine learning reinforcement techniques",
          type: "article",
          tags: ["Machine Learning", "AI", "Reinforcement Learning"],
          duration: "12 mins",
          url: "https://example.com/intro-reinforcement-learning",
        },
        {
          id: 2,
          title: "The Philosophy of Causality",
          description: "Explore the philosophical foundations of cause and effect",
          type: "article",
          tags: ["Philosophy", "Causality", "Metaphysics"],
          duration: "18 mins",
          url: "https://example.com/philosophy-causality",
        },
        {
          id: 3,
          title: "Quantum Entanglement Explained",
          description: "A simplified guide to understanding quantum entanglement",
          type: "article",
          tags: ["Quantum Physics", "Physics", "Entanglement"],
          duration: "15 mins",
          url: "https://example.com/quantum-entanglement",
        },
        {
          id: 4,
          title: "Making Sense of Podcast",
          description: "Sam Harris discusses causality with Judea Pearl",
          type: "podcast",
          tags: ["Causality", "Philosophy", "Statistics"],
          duration: "1 hr 45 mins",
          url: "https://example.com/making-sense-causality",
        },
        {
          id: 5,
          title: "Lex Fridman Podcast - Geoffrey Hinton",
          description: "Deep discussion on neural networks and the future of AI",
          type: "podcast",
          tags: ["Machine Learning", "AI", "Neural Networks"],
          duration: "2 hrs 20 mins",
          url: "https://example.com/lex-fridman-hinton",
        },
        {
          id: 6,
          title: "Sean Carroll's Mindscape: Quantum Mechanics",
          description: "Detailed exploration of quantum mechanics fundamentals",
          type: "podcast",
          tags: ["Quantum Physics", "Physics", "Science"],
          duration: "1 hr 30 mins",
          url: "https://example.com/mindscape-quantum",
        },
        {
          id: 7,
          title: "The Book of Why",
          description: "Judea Pearl's seminal work on causality and causal inference",
          type: "book",
          tags: ["Causality", "Statistics", "AI"],
          duration: "Est. reading: 8 hrs",
          url: "https://example.com/book-of-why",
        },
        {
          id: 8,
          title: "Deep Learning",
          description: "Comprehensive textbook by Goodfellow, Bengio, and Courville",
          type: "book",
          tags: ["Machine Learning", "Deep Learning", "AI"],
          duration: "Est. reading: 15 hrs",
          url: "https://example.com/deep-learning-book",
        },
        {
          id: 9,
          title: "Something Deeply Hidden",
          description: "Sean Carroll's exploration of quantum mechanics and the Many-Worlds theory",
          type: "book",
          tags: ["Quantum Physics", "Physics", "Cosmology"],
          duration: "Est. reading: 7 hrs",
          url: "https://example.com/deeply-hidden",
        }
      ] as Resource[],
    };
  }

  async getUserStats() {
    // Would be implemented with database queries
    return {
      masteryScore: 68,
      masteryGrowth: "+7% this week",
      streak: 9,
      streakDays: Array(7).fill(null).map((_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        completed: true
      })),
      completedModules: 6,
      totalModules: 15,
      focusAreas: [
        { name: "Machine Learning", percentage: 38, color: "#3B82F6" },
        { name: "Philosophy", percentage: 25, color: "#8B5CF6" },
        { name: "Quantum Physics", percentage: 15, color: "#10B981" },
        { name: "Causality", percentage: 12, color: "#F59E0B" },
        { name: "Statistics", percentage: 10, color: "#EC4899" },
      ],
    };
  }

  async getUserSettings() {
    if (!this.currentUser) throw new Error("No user logged in");
    return {
      name: this.currentUser.name,
      email: this.currentUser.email,
      preferences: this.currentUser.preferences as {
        learningSpeed: number;
        dailyGoal: number;
        emailNotifications: boolean;
        pushNotifications: boolean;
      },
    };
  }

  async getLearningHistory() {
    // Would be implemented with database queries
    return {
      completedModules: [
        {
          id: "cm1",
          title: "Intro to Neural Networks",
          topics: ["Perceptrons", "Activation Functions", "Backpropagation"],
          completedAt: "2025-02-28",
          score: 88,
        },
        {
          id: "cm2",
          title: "Philosophy of Consciousness",
          topics: ["Hard Problem", "Qualia", "Identity Theory"],
          completedAt: "2025-03-05",
          score: 92,
        },
      ],
      inProgressModules: [
        {
          id: "im1",
          title: "Causal Inference in ML",
          topics: ["Causal Graphs", "Interventions", "Do-calculus"],
          progress: 65,
        },
        {
          id: "im2",
          title: "Quantum Computing Basics",
          topics: ["Qubits", "Superposition", "Quantum Gates"],
          progress: 40,
        },
      ],
      assessmentResults: [
        {
          id: "ar1",
          type: "Machine Learning Assessment",
          score: 82,
          completedAt: "2025-02-28",
          strengths: ["Supervised Learning", "Model Evaluation"],
          weaknesses: ["Reinforcement Learning", "Neural Architecture Search"],
        },
        {
          id: "ar2",
          type: "Philosophy Quiz",
          score: 75,
          completedAt: "2025-03-07",
          strengths: ["Mind-Body Problem", "Free Will"],
          weaknesses: ["Epistemology", "Ethics"],
        },
      ],
    };
  }

  async getRecommendations() {
    // Would be implemented with database queries
    return [
      {
        id: "rec1",
        title: "Causality in Machine Learning",
        description: "Learn how causal inference can improve machine learning models",
        match: 95,
        icon: "git-branch",
        iconBg: "#4F46E5",
        topics: ["Causality", "Machine Learning", "Inference"],
        estimatedTime: "2 hours",
      },
      {
        id: "rec2",
        title: "Quantum Entanglement and Philosophy",
        description: "Explore the philosophical implications of quantum entanglement",
        match: 92,
        icon: "atom",
        iconBg: "#10B981",
        topics: ["Quantum Physics", "Philosophy", "Metaphysics"],
        estimatedTime: "1.5 hours",
      },
      {
        id: "rec3", 
        title: "Neural Networks and Decision Making",
        description: "Advanced concepts in neural architecture for decision systems",
        match: 88,
        icon: "cpu",
        iconBg: "#3B82F6",
        topics: ["Machine Learning", "Neural Networks", "Decision Theory"],
        estimatedTime: "2.5 hours",
      },
      {
        id: "rec4",
        title: "Statistical Methods for Causal Inference",
        description: "Practical statistical techniques for establishing causality",
        match: 85,
        icon: "bar-chart",
        iconBg: "#F59E0B",
        topics: ["Statistics", "Causality", "Data Analysis"],
        estimatedTime: "3 hours",
      },
    ] as Recommendation[];
  }

  async saveRecommendations(recommendations: Recommendation[]) {
    // Would be implemented with database queries
  }

  async getSuggestedAssessments() {
    // Would be implemented with database queries
    return [
      {
        id: "sa1",
        title: "Causal Inference Challenge",
        type: "challenge",
        typeLabel: "Challenge",
        description: "Test your understanding of advanced causal inference concepts",
        duration: "25 minutes",
        difficulty: "hard",
        estimatedTime: "25 minutes",
      },
      {
        id: "sa2",
        title: "Philosophy of Mind Review",
        type: "review",
        typeLabel: "Review",
        description: "Review and reinforce your knowledge of philosophy of mind concepts",
        duration: "15 minutes",
        difficulty: "medium",
        estimatedTime: "15 minutes",
      },
      {
        id: "sa3",
        title: "Machine Learning Skills Snapshot",
        type: "recommended",
        typeLabel: "Recommended",
        description: "A personalized assessment of your current machine learning knowledge",
        duration: "20 minutes",
        difficulty: "medium",
        estimatedTime: "20 minutes",
      },
    ] as Assessment[];
  }

  async saveSuggestedAssessments(assessments: Assessment[]) {
    // Would be implemented with database queries
  }

  async getAssessmentResults() {
    // Would be implemented with database queries
    return [
      {
        id: "ar1",
        title: "Machine Learning Fundamentals",
        score: 82,
        date: "2025-02-28",
        topics: [
          { name: "Supervised Learning", score: 88 },
          { name: "Neural Networks", score: 85 },
          { name: "Feature Engineering", score: 75 },
        ],
      },
      {
        id: "ar2",
        title: "Philosophy of Mind",
        score: 75,
        date: "2025-03-05",
        topics: [
          { name: "Consciousness", score: 82 },
          { name: "Free Will", score: 78 },
          { name: "Mind-Body Problem", score: 65 },
        ],
      },
      {
        id: "ar3",
        title: "Introduction to Quantum Physics",
        score: 65,
        date: "2025-03-10",
        topics: [
          { name: "Wave Functions", score: 72 },
          { name: "Uncertainty Principle", score: 68 },
          { name: "Quantum Entanglement", score: 58 },
        ],
      },
    ];
  }

  async getUserSkills() {
    // Would be implemented with database queries
    return {
      radar: {
        labels: ["Machine Learning", "Philosophy", "Causality", "Quantum Physics", "Statistics"],
        current: [75, 60, 40, 55, 70],
        average: [60, 50, 45, 50, 65],
      },
      breakdown: [
        { skill: "Machine Learning", score: 75 },
        { skill: "Philosophy", score: 60 },
        { skill: "Causality", score: 40 },
        { skill: "Quantum Physics", score: 55 },
        { skill: "Statistics", score: 70 },
      ],
      recommendation: "Focus on improving your understanding of causality and its application in both philosophy and quantum physics.",
    };
  }

  async saveUserSkills(skills: any) {
    // Would be implemented with database queries
  }

  async getUserAnalytics(timeRange: string) {
    // Would be implemented with database queries
    return {
      activityData: Array(30).fill(null).map((_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        minutes: Math.floor(Math.random() * 60 + 30),
      })),
      competencyData: Array(30).fill(null).map((_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        score: Math.min(100, 65 + Math.floor(Math.random() * 20)),
      })),
      assessmentData: [
        { name: "Machine Learning Foundations", score: 82, average: 70 },
        { name: "Philosophy of Mind", score: 75, average: 68 },
        { name: "Quantum Theory", score: 65, average: 62 },
      ],
      skillData: [
        { subject: "Machine Learning", score: 75, previousScore: 65 },
        { subject: "Philosophy", score: 60, previousScore: 50 },
        { subject: "Causality", score: 40, previousScore: 30 },
        { subject: "Quantum Physics", score: 55, previousScore: 45 },
        { subject: "Statistics", score: 70, previousScore: 60 },
      ],
      efficiency: {
        completionRate: 85,
        avgLearningTime: 52,
        knowledgeRetention: 78,
      },
    };
  }

  async startAssessment(assessmentType: string) {
    // Would be implemented with database queries
    return {
      id: 123,
      title: "Dynamic Assessment",
      description: "Adaptive assessment based on your skill level",
      type: assessmentType,
      difficulty: "medium",
      estimatedTime: "30 minutes",
    } as Assessment;
  }

  async submitAnswer(assessmentId: string, questionId: string, answer: string) {
    // Would be implemented with database queries
    return {
      correct: true,
      feedback: "Great job! Your answer is correct.",
    };
  }

  async completeAssessment(assessmentId: string) {
    // Would be implemented with database queries
    return {
      score: 85,
      feedback: "Great job! You've shown strong understanding in several areas.",
    };
  }

  async startModule(moduleId: string) {
    // Would be implemented with database queries
    return {
      success: true,
      message: "Module started successfully",
    };
  }

  async completeModule(moduleId: string) {
    // Would be implemented with database queries
    return {
      success: true,
      message: "Module completed successfully",
    };
  }
  
  // User persona methods
  async getUserPersona(userId: number): Promise<UserPersona | undefined> {
    const [persona] = await db
      .select()
      .from(userPersonas)
      .where(eq(userPersonas.userId, userId));
    
    return persona;
  }
  
  async saveUserPersona(userId: number, persona: {
    contentFormat: string[];
    studyHabits: string[];
    currentWeaknesses: string[];
    learningStyle: string;
    rawAnalysis?: any;
  }): Promise<UserPersona> {
    // Check if persona already exists
    const existingPersona = await this.getUserPersona(userId);
    
    if (existingPersona) {
      // Update existing persona
      const [updatedPersona] = await db
        .update(userPersonas)
        .set({
          contentFormat: persona.contentFormat,
          studyHabits: persona.studyHabits,
          currentWeaknesses: persona.currentWeaknesses,
          learningStyle: persona.learningStyle,
          lastAnalyzed: new Date(),
          rawAnalysis: persona.rawAnalysis || {}
        })
        .where(eq(userPersonas.id, existingPersona.id))
        .returning();
      
      return updatedPersona;
    } else {
      // Create new persona
      const [newPersona] = await db
        .insert(userPersonas)
        .values({
          userId,
          contentFormat: persona.contentFormat,
          studyHabits: persona.studyHabits,
          currentWeaknesses: persona.currentWeaknesses,
          learningStyle: persona.learningStyle,
          lastAnalyzed: new Date(),
          rawAnalysis: persona.rawAnalysis || {}
        })
        .returning();
      
      return newPersona;
    }
  }
}

// Comment out MemStorage and use DatabaseStorage instead
export const storage = new MemStorage();
// export const storage = new DatabaseStorage();
