import { 
  users, type User, type InsertUser, 
  type Module, type Resource, type Assessment,
  type UserModule, type UserAssessment, type Recommendation, type Skill, 
  type ChatMessage, type InsertChatMessage, type UserPersona,
  chatMessages, userPersonas
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
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
  };

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.mockData = {
      learningPath: [
        {
          id: "path1",
          title: "Web Development Fundamentals",
          description: "Learn the basics of web development",
          status: "completed",
          completedOn: "2025-03-01",
          topics: ["HTML", "CSS", "JavaScript"],
        },
        {
          id: "path2",
          title: "Frontend Development",
          description: "Master modern frontend frameworks",
          status: "in-progress",
          progress: 45,
          topics: ["React", "TypeScript", "Redux"],
        },
      ],
      curriculum: {
        modules: [
          {
            id: "mod1",
            title: "Getting Started with React",
            description: "Learn the fundamentals of React",
            icon: "code",
            status: "completed",
            progress: 100,
            topics: ["JSX", "Components", "Props", "State"],
          },
        ],
      },
      library: {
        resources: [
          {
            id: "res1",
            title: "React Hooks Deep Dive",
            description: "Master React Hooks with practical examples",
            type: "article",
            tags: ["React", "Hooks", "Frontend"],
            duration: "15 mins",
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
          { name: "React", percentage: 45, color: "#3B82F6" },
          { name: "TypeScript", percentage: 30, color: "#8B5CF6" },
          { name: "Testing", percentage: 25, color: "#10B981" },
        ],
      },
      userSkills: {
        radar: {
          labels: ["React", "TypeScript", "Testing", "State Management", "Performance"],
          current: [80, 65, 45, 70, 60],
          average: [65, 60, 55, 65, 55],
        },
        breakdown: [
          { skill: "React", score: 80 },
          { skill: "TypeScript", score: 65 },
          { skill: "Testing", score: 45 },
          { skill: "State Management", score: 70 },
          { skill: "Performance", score: 60 },
        ],
        recommendation: "Focus on improving your testing skills to become a more well-rounded developer.",
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
    
    // Get the current preferences as a plain JavaScript object
    const currentPrefs = this.currentUser.preferences || {};
    
    this.currentUser = { 
      ...this.currentUser, 
      preferences: { ...currentPrefs, ...preferences }
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

  async startAssessment(assessmentType: string): Promise<Assessment> {
    return {
      id: 101,
      title: "Dynamic Assessment",
      description: "Adaptive assessment based on your skill level",
      type: assessmentType,
      difficulty: "medium",
      estimatedTime: "30 minutes",
    } as Assessment;
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
    
    // Get the current preferences as a plain JavaScript object
    const currentPrefs = this.currentUser.preferences || {};
    
    const [updatedUser] = await db
      .update(users)
      .set({
        preferences: { 
          ...currentPrefs, 
          ...preferences 
        }
      })
      .where(eq(users.id, this.currentUser.id))
      .returning();
    
    this.currentUser = updatedUser;
    return updatedUser;
  }

  // Chat messages
  async getChatMessages(userId: number, conversationId: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.userId, userId),
          eq(chatMessages.conversationId, conversationId)
        )
      )
      .orderBy(chatMessages.timestamp);
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
        title: "Web Development Fundamentals",
        description: "Learn the basics of web development",
        status: 'completed' as const,
        completedOn: "2025-03-01",
        topics: ["HTML", "CSS", "JavaScript"],
      },
      {
        id: "path2",
        title: "Frontend Development",
        description: "Master modern frontend frameworks",
        status: 'in-progress' as const,
        progress: 45,
        topics: ["React", "TypeScript", "Redux"],
      },
    ];
  }

  async getCurriculum() {
    // Would be implemented with database queries
    return {
      modules: [
        {
          id: 1,
          title: "Getting Started with React",
          description: "Learn the fundamentals of React",
          icon: "code",
          topics: ["JSX", "Components", "Props", "State"],
          difficulty: 1,
          estimatedTime: 60,
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
          title: "React Hooks Deep Dive",
          description: "Master React Hooks with practical examples",
          type: "article",
          tags: ["React", "Hooks", "Frontend"],
          duration: "15 mins",
          url: "https://example.com/react-hooks",
        },
      ] as Resource[],
    };
  }

  async getUserStats() {
    // Would be implemented with database queries
    return {
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
        { name: "React", percentage: 45, color: "#3B82F6" },
        { name: "TypeScript", percentage: 30, color: "#8B5CF6" },
        { name: "Testing", percentage: 25, color: "#10B981" },
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
    };
  }

  async getRecommendations() {
    // Would be implemented with database queries
    return [] as Recommendation[];
  }

  async saveRecommendations(recommendations: Recommendation[]) {
    // Would be implemented with database queries
  }

  async getSuggestedAssessments() {
    // Would be implemented with database queries
    return [] as Assessment[];
  }

  async saveSuggestedAssessments(assessments: Assessment[]) {
    // Would be implemented with database queries
  }

  async getAssessmentResults() {
    // Would be implemented with database queries
    return [
      {
        id: "ar1",
        title: "React Fundamentals",
        score: 85,
        date: "2025-02-28",
        topics: [
          { name: "Components", score: 90 },
          { name: "Hooks", score: 80 },
          { name: "State Management", score: 85 },
        ],
      },
    ];
  }

  async getUserSkills() {
    // Would be implemented with database queries
    return {
      radar: {
        labels: ["React", "TypeScript", "Testing", "State Management", "Performance"],
        current: [80, 65, 45, 70, 60],
        average: [65, 60, 55, 65, 55],
      },
      breakdown: [
        { skill: "React", score: 80 },
        { skill: "TypeScript", score: 65 },
        { skill: "Testing", score: 45 },
        { skill: "State Management", score: 70 },
        { skill: "Performance", score: 60 },
      ],
      recommendation: "Focus on improving your testing skills to become a more well-rounded developer.",
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
    };
  }

  async startAssessment(assessmentType: string): Promise<Assessment> {
    // Would be implemented with database queries to create a real assessment
    // For now, we're returning a mock assessment that matches the database schema
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

// Using DatabaseStorage for persistent storage
// export const storage = new MemStorage();
export const storage = new DatabaseStorage();
