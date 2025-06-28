import { 
  users, type User, type InsertUser, 
  type Module, type Resource, type Assessment,
  type UserModule, type UserAssessment, type Recommendation, type Skill, 
  type ChatMessage, type InsertChatMessage, type UserPersona,
  chatMessages, userPersonas, type CalendarEvent, type InsertCalendarEvent,
  type Syllabus, type LearningSession, type KnowledgeBank, type AgentInteraction,
  type InsertAgentInteraction
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
    learningPreferences: string;
    rawAnalysis?: any;
  }): Promise<UserPersona>;

  // Syllabus management
  getSyllabi(userId: number): Promise<Syllabus[]>;
  getSyllabus(id: number): Promise<Syllabus | undefined>;
  createSyllabus(syllabus: any): Promise<Syllabus>;
  updateSyllabus(id: number, updates: Partial<Syllabus>): Promise<Syllabus>;
  activateSyllabus(id: number): Promise<void>;

  // Learning sessions
  getRecentLearningSessions(userId: number, limit: number): Promise<LearningSession[]>;
  createLearningSession(session: any): Promise<LearningSession>;
  updateLearningSession(id: number, updates: any): Promise<LearningSession>;

  // Knowledge bank
  searchKnowledgeBank(query: string, filters?: any): Promise<KnowledgeBank[]>;
  getKnowledgeBankItem(id: number): Promise<KnowledgeBank | undefined>;

  // Agent interactions
  logAgentInteraction(interaction: InsertAgentInteraction): Promise<AgentInteraction>;
  getAgentInteractions(userId: number, agentType?: string): Promise<AgentInteraction[]>;

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
  private chatMessages: Map<string, ChatMessage[]>;
  private userPersonas: Map<number, UserPersona>;
  private syllabi: Map<number, Syllabus>;
  private learningSessions: Map<number, LearningSession[]>;
  private agentInteractions: Map<number, AgentInteraction[]>;
  
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
    this.chatMessages = new Map();
    this.userPersonas = new Map();
    this.syllabi = new Map();
    this.learningSessions = new Map();
    this.agentInteractions = new Map();
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
            title: "Machine Learning Foundations",
            topics: ["Neural Networks", "Supervised Learning", "Model Evaluation"],
            completedAt: "2025-02-28",
            score: 95,
          },
          {
            id: "cm2",
            title: "Philosophy of Mind: Introduction",
            topics: ["Consciousness", "Dualism", "Mind-Body Problem"],
            completedAt: "2025-03-05",
            score: 88,
          },
        ],
        inProgressModules: [
          {
            id: "im1",
            title: "Probabilistic Reasoning and Causal Inference",
            topics: ["Bayesian Networks", "Causal Inference", "Probability Theory"],
            progress: 65,
          },
          {
            id: "im2",
            title: "Philosophy of Mind: Advanced Topics",
            topics: ["Embodied Cognition", "Extended Mind", "Enactivism"],
            progress: 30,
          },
        ],
        assessmentResults: [
          {
            id: "ar1",
            type: "Machine Learning Assessment",
            score: 92,
            completedAt: "2025-02-28",
            strengths: ["Model Architecture", "Data Preprocessing"],
            weaknesses: ["Hyperparameter Tuning"],
          },
          {
            id: "ar2",
            type: "Philosophy of Mind Quiz",
            score: 85,
            completedAt: "2025-03-05",
            strengths: ["Dualism Concepts", "Historical Context"],
            weaknesses: ["Modern Interpretations"],
          },
          {
            id: "ar3",
            type: "Perception Systems Pretest",
            score: 72,
            completedAt: "2025-03-10",
            strengths: ["Visual Processing Understanding"],
            weaknesses: ["Cross-Modal Integration", "Signal Processing Fundamentals"],
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
          { name: "Machine Learning Foundations", score: 92, average: 78 },
          { name: "Philosophy of Mind", score: 85, average: 72 },
          { name: "Probabilistic Reasoning", score: 76, average: 68 },
          { name: "Perception Systems", score: 72, average: 70 },
          { name: "Cognitive Systems", score: 65, average: 62 },
        ],
        skillData: [
          { subject: "Machine Learning", score: 80, previousScore: 70 },
          { subject: "Philosophy", score: 65, previousScore: 55 },
          { subject: "Probabilistic Reasoning", score: 45, previousScore: 35 },
          { subject: "Perception", score: 70, previousScore: 60 },
          { subject: "Cognitive Systems", score: 60, previousScore: 50 },
          { subject: "Quantum Physics", score: 30, previousScore: 20 },
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

  // Syllabus management
  async getSyllabi(userId: number): Promise<Syllabus[]> {
    return Array.from(this.syllabi.values()).filter(s => s.userId === userId);
  }

  async getSyllabus(id: number): Promise<Syllabus | undefined> {
    return this.syllabi.get(id);
  }

  async createSyllabus(syllabus: any): Promise<Syllabus> {
    const id = this.syllabi.size + 1;
    const newSyllabus: Syllabus = {
      ...syllabus,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.syllabi.set(id, newSyllabus);
    return newSyllabus;
  }

  async updateSyllabus(id: number, updates: Partial<Syllabus>): Promise<Syllabus> {
    const syllabus = this.syllabi.get(id);
    if (!syllabus) throw new Error("Syllabus not found");
    
    const updated = { ...syllabus, ...updates, updatedAt: new Date() };
    this.syllabi.set(id, updated);
    return updated;
  }

  async activateSyllabus(id: number): Promise<void> {
    const syllabus = this.syllabi.get(id);
    if (!syllabus) throw new Error("Syllabus not found");
    
    // Deactivate other syllabi for this user
    for (const [syllabusId, s] of this.syllabi.entries()) {
      if (s.userId === syllabus.userId && s.status === 'active') {
        this.syllabi.set(syllabusId, { ...s, status: 'draft' });
      }
    }
    
    // Activate this syllabus
    this.syllabi.set(id, { ...syllabus, status: 'active' });
  }

  // Learning sessions
  async getRecentLearningSessions(userId: number, limit: number): Promise<LearningSession[]> {
    const sessions = this.learningSessions.get(userId) || [];
    return sessions.slice(-limit);
  }

  async createLearningSession(session: any): Promise<LearningSession> {
    const userId = session.userId;
    const sessions = this.learningSessions.get(userId) || [];
    const newSession: LearningSession = {
      ...session,
      id: sessions.length + 1,
      createdAt: new Date()
    };
    sessions.push(newSession);
    this.learningSessions.set(userId, sessions);
    return newSession;
  }

  async updateLearningSession(id: number, updates: any): Promise<LearningSession> {
    // Implementation would find and update the session
    throw new Error("Not implemented in memory storage");
  }

  // Knowledge bank
  async searchKnowledgeBank(query: string, filters?: any): Promise<KnowledgeBank[]> {
    // Mock implementation
    return [];
  }

  async getKnowledgeBankItem(id: number): Promise<KnowledgeBank | undefined> {
    // Mock implementation
    return undefined;
  }

  // Agent interactions
  async logAgentInteraction(interaction: InsertAgentInteraction): Promise<AgentInteraction> {
    const userId = interaction.userId;
    const interactions = this.agentInteractions.get(userId) || [];
    const newInteraction: AgentInteraction = {
      ...interaction,
      id: interactions.length + 1,
      timestamp: new Date()
    };
    interactions.push(newInteraction);
    this.agentInteractions.set(userId, interactions);
    return newInteraction;
  }

  async getAgentInteractions(userId: number, agentType?: string): Promise<AgentInteraction[]> {
    const interactions = this.agentInteractions.get(userId) || [];
    if (agentType) {
      return interactions.filter(i => i.agentType === agentType);
    }
    return interactions;
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
    const key = `${userId}-${conversationId}`;
    return this.chatMessages.get(key) || [];
  }
  
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const key = `${message.userId}-${message.conversationId}`;
    const messages = this.chatMessages.get(key) || [];
    
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      userId: message.userId,
      role: message.role,
      content: message.content,
      timestamp: new Date(),
      conversationId: message.conversationId
    };
    
    messages.push(newMessage);
    this.chatMessages.set(key, messages);
    
    return newMessage;
  }
  
  async getConversations(userId: number): Promise<{id: string, lastMessage: string, timestamp: Date}[]> {
    const conversations: {id: string, lastMessage: string, timestamp: Date}[] = [];
    
    for (const [key, messages] of this.chatMessages.entries()) {
      if (key.startsWith(`${userId}-`)) {
        const conversationId = key.split('-').slice(1).join('-');
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
          conversations.push({
            id: conversationId,
            lastMessage: lastMessage.content,
            timestamp: lastMessage.timestamp
          });
        }
      }
    }
    
    return conversations;
  }
  
  // User persona methods
  async getUserPersona(userId: number): Promise<UserPersona | undefined> {
    return this.userPersonas.get(userId);
  }
  
  async saveUserPersona(userId: number, persona: {
    contentFormat: string[];
    studyHabits: string[];
    currentWeaknesses: string[];
    learningPreferences: string;
    rawAnalysis?: any;
  }): Promise<UserPersona> {
    const newPersona: UserPersona = {
      id: this.userPersonas.size + 1,
      userId,
      contentFormat: persona.contentFormat,
      studyHabits: persona.studyHabits,
      currentWeaknesses: persona.currentWeaknesses,
      learningPreferences: persona.learningPreferences,
      lastAnalyzed: new Date(),
      rawAnalysis: persona.rawAnalysis || {}
    };
    
    this.userPersonas.set(userId, newPersona);
    return newPersona;
  }
}

// Database implementation (only used if DATABASE_URL is available)
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
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not available");
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
    if (!db) throw new Error("Database not available");
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
    if (!db) throw new Error("Database not available");
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

  // For brevity, I'll implement the rest of the methods to throw errors when database is not available
  // In a real implementation, you'd want to implement all methods properly

  async getSyllabi(userId: number): Promise<Syllabus[]> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async getSyllabus(id: number): Promise<Syllabus | undefined> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async createSyllabus(syllabus: any): Promise<Syllabus> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async updateSyllabus(id: number, updates: Partial<Syllabus>): Promise<Syllabus> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async activateSyllabus(id: number): Promise<void> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async getRecentLearningSessions(userId: number, limit: number): Promise<LearningSession[]> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async createLearningSession(session: any): Promise<LearningSession> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async updateLearningSession(id: number, updates: any): Promise<LearningSession> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async searchKnowledgeBank(query: string, filters?: any): Promise<KnowledgeBank[]> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async getKnowledgeBankItem(id: number): Promise<KnowledgeBank | undefined> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async logAgentInteraction(interaction: InsertAgentInteraction): Promise<AgentInteraction> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async getAgentInteractions(userId: number, agentType?: string): Promise<AgentInteraction[]> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async getCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async updateGoogleEventId(id: number, googleEventId: string): Promise<void> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async getChatMessages(userId: number, conversationId: string): Promise<ChatMessage[]> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }
  
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }
  
  async getConversations(userId: number): Promise<{id: string, lastMessage: string, timestamp: Date}[]> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  async getUserPersona(userId: number): Promise<UserPersona | undefined> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }
  
  async saveUserPersona(userId: number, persona: {
    contentFormat: string[];
    studyHabits: string[];
    currentWeaknesses: string[];
    learningPreferences: string;
    rawAnalysis?: any;
  }): Promise<UserPersona> {
    throw new Error("Database storage not fully implemented for Bolt environment");
  }

  // Implement other required methods with similar error throwing
  async getLearningPath() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getCurriculum() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getLearningLibrary() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getUserStats() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getUserSettings() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getLearningHistory() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getRecommendations() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async saveRecommendations(recommendations: any[]) { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getSuggestedAssessments() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async saveSuggestedAssessments(assessments: any[]) { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getAssessmentResults() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getUserSkills() { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async saveUserSkills(skills: any) { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async getUserAnalytics(timeRange: string) { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async startAssessment(assessmentType: string) { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async submitAnswer(assessmentId: string, questionId: string, answer: string) { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async completeAssessment(assessmentId: string) { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async startModule(moduleId: string) { throw new Error("Database storage not fully implemented for Bolt environment"); }
  async completeModule(moduleId: string) { throw new Error("Database storage not fully implemented for Bolt environment"); }
}

// Use MemStorage for Bolt environment, DatabaseStorage only if DATABASE_URL is available
export const storage = db ? new DatabaseStorage() : new MemStorage();