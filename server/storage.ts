import { 
  users, type User, type InsertUser, 
  modules, type Module, resources, type Resource, assessments, type Assessment,
  userModules, type UserModule, userAssessments, type UserAssessment, recommendations, type Recommendation, skills, type Skill, 
  chatMessages, type ChatMessage, type InsertChatMessage, userPersonas, type UserPersona,
  calendarEvents, type CalendarEvent, type InsertCalendarEvent,
  syllabi, type Syllabus, learningSessions, type LearningSession, knowledgeBank, type KnowledgeBank, agentInteractions, type AgentInteraction,
  type InsertAgentInteraction
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, asc, and, ilike, sql } from "drizzle-orm";

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
  updateUserPreferences(preferences: any): Promise<User>;
  
  // User persona management
  getUserPersona(userId: number): Promise<UserPersona | undefined>;
  saveUserPersona(userId: number, persona: any): Promise<UserPersona>;

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
  getLearningPath(): Promise<any[]>;
  getCurriculum(): Promise<{ modules: Module[] }>;
  getLearningLibrary(): Promise<{ resources: Resource[] }>;

  // User progress
  getUserStats(): Promise<any>;
  getUserSettings(): Promise<any>;
  getLearningHistory(): Promise<any>;

  // Recommendations
  getRecommendations(): Promise<Recommendation[]>;
  saveRecommendations(recs: any[]): Promise<void>;

  // Assessments
  getSuggestedAssessments(): Promise<Assessment[]>;
  saveSuggestedAssessments(assessments: Assessment[]): Promise<void>;
  getAssessmentResults(): Promise<any[]>;
  startAssessment(assessmentType: string): Promise<Assessment>;
  submitAnswer(assessmentId: string, questionId: string, answer: string): Promise<any>;
  completeAssessment(assessmentId: string): Promise<any>;

  // Skills
  getUserSkills(): Promise<any>;
  saveUserSkills(skills: any): Promise<void>;

  // Analytics
  getUserAnalytics(timeRange: string): Promise<any>;

  // Module interaction
  startModule(moduleId: string): Promise<any>;
  completeModule(moduleId: string): Promise<any>;

  // Chat messages
  getChatMessages(userId: number, conversationId: string): Promise<ChatMessage[]>;
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getConversations(userId: number): Promise<{id: string, lastMessage: string, timestamp: Date}[]>;
}

export class DatabaseStorage implements IStorage {
  private currentUser: User | undefined;

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
    const [user] = await db.insert(users).values({
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
    }).returning();
    this.currentUser = user;
    return user;
  }

  async updateUserProfile(profile: { name: string; email: string }): Promise<User> {
    if (!this.currentUser) throw new Error("No user logged in");
    const [updatedUser] = await db.update(users).set(profile).where(eq(users.id, this.currentUser.id)).returning();
    this.currentUser = updatedUser;
    return updatedUser;
  }

  async updateUserPreferences(preferences: any): Promise<User> {
    if (!this.currentUser) throw new Error("No user logged in");
    const [updatedUser] = await db.update(users).set({
      preferences: { ...this.currentUser.preferences as any, ...preferences }
    }).where(eq(users.id, this.currentUser.id)).returning();
    this.currentUser = updatedUser;
    return updatedUser;
  }

  async getLearningPath(): Promise<any[]> {
    if (!this.currentUser) return [];
    
    // Check for an active syllabus
    const activeSyllabuses = await db.select().from(syllabi).where(and(eq(syllabi.userId, this.currentUser.id), eq(syllabi.isActive, true))).limit(1);
    
    let pathModules: any[] = [];
    if (activeSyllabuses.length > 0) {
      const activeSyllabus = activeSyllabuses[0];
      pathModules = activeSyllabus.modules.map((mod: any, index: number) => ({
        id: mod.id || `syl-${activeSyllabus.id}-mod-${index}`,
        title: mod.title,
        description: mod.description,
        topics: mod.topics || [],
        links: mod.links || [],
      }));
    } else {
      // Fallback
      pathModules = await db.select().from(modules);
    }
    
    const userProgress = await db.select().from(userModules).where(eq(userModules.userId, this.currentUser.id));
    
    return pathModules.map(m => {
      const prog = userProgress.find(p => p.moduleId === m.id);
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        status: prog ? prog.status : "upcoming",
        progress: prog ? prog.progress : 0,
        completedOn: prog && prog.completedAt ? new Date(prog.completedAt).toISOString().split('T')[0] : undefined,
        topics: m.topics || [],
        links: m.links || [],
      };
    });
  }

  async getCurriculum(): Promise<{ modules: Module[] }> {
    const allModules = await db.select().from(modules);
    return { modules: allModules as Module[] };
  }

  async getLearningLibrary(): Promise<{ resources: Resource[] }> {
    const allResources = await db.select().from(resources);
    return { resources: allResources as Resource[] };
  }

  async getUserStats(): Promise<any> {
    if (!this.currentUser) throw new Error("No user logged in");
    const uMods = await db.select().from(userModules).where(eq(userModules.userId, this.currentUser.id));
    const allMods = await db.select().from(modules);
    const uSkills = await db.select().from(skills).where(eq(skills.userId, this.currentUser.id));
    
    const completed = uMods.filter(m => m.status === 'completed').length;
    let mastery = uSkills.length > 0 ? (uSkills.reduce((a, b) => a + b.score, 0) / uSkills.length) : 0;
    
    return {
      masteryScore: Math.round(mastery),
      masteryGrowth: "+2% this week",
      streak: 1, // simplified
      streakDays: [],
      completedModules: completed,
      totalModules: allMods.length || 1,
      focusAreas: uSkills.map(s => ({ name: s.skillName, percentage: s.score, color: "#3B82F6" })).slice(0,3),
    };
  }

  async getUserSettings(): Promise<any> {
    if (!this.currentUser) throw new Error("No user logged in");
    return {
      name: this.currentUser.name,
      email: this.currentUser.email,
      preferences: this.currentUser.preferences,
    };
  }

  async getLearningHistory(): Promise<any> {
    if (!this.currentUser) return { completedModules: [], inProgressModules: [], assessmentResults: [] };
    const uMods = await db.select().from(userModules).where(eq(userModules.userId, this.currentUser.id));
    const allMods = await db.select().from(modules);
    
    const completed = uMods.filter(m => m.status === 'completed').map(m => {
      const mod = allMods.find(x => x.id === m.moduleId);
      return {
        id: m.moduleId,
        title: mod ? mod.title : m.moduleId,
        topics: mod ? mod.topics : [],
        completedAt: m.completedAt ? new Date(m.completedAt).toISOString() : "",
        score: m.score || 100,
      };
    });
    
    const uAssess = await db.select().from(userAssessments).where(eq(userAssessments.userId, this.currentUser.id));
    const allAssess = await db.select().from(assessments);
    
    const results = uAssess.map(a => {
      const asmt = allAssess.find(x => x.id === a.assessmentId);
      return {
        id: a.assessmentId,
        type: asmt ? asmt.title : a.assessmentId,
        score: a.score || 0,
        completedAt: a.completedAt ? new Date(a.completedAt).toISOString() : "",
        strengths: ["Learned topics"],
        weaknesses: ["Areas to improve"]
      };
    });
    
    return {
      completedModules: completed,
      inProgressModules: [],
      assessmentResults: results
    };
  }

  async getRecommendations(): Promise<Recommendation[]> {
    if (!this.currentUser) return [];
    return db.select().from(recommendations).where(eq(recommendations.userId, this.currentUser.id));
  }

  async saveRecommendations(recs: any[]): Promise<void> {
    if (!this.currentUser) return;
    await db.delete(recommendations).where(eq(recommendations.userId, this.currentUser.id));
    if (recs.length > 0) {
      await db.insert(recommendations).values(recs.map(r => ({
        userId: this.currentUser!.id,
        title: r.title,
        description: r.description,
        match: r.match,
        icon: r.icon,
        iconBg: r.iconBg,
        topics: r.topics,
        estimatedTime: r.estimatedTime,
        createdAt: new Date(),
      })));
    }
  }

  async getSuggestedAssessments(): Promise<Assessment[]> {
    return db.select().from(assessments).limit(3);
  }

  async saveSuggestedAssessments(assess: Assessment[]): Promise<void> {
    // Already hardcoded, we won't mutate the fixed assessments list for suggested
  }

  async getAssessmentResults(): Promise<any[]> {
    if (!this.currentUser) return [];
    const hist = await this.getLearningHistory();
    return hist.assessmentResults;
  }

  async getUserSkills(): Promise<any> {
    if (!this.currentUser) return null;
    const uSkills = await db.select().from(skills).where(eq(skills.userId, this.currentUser.id));
    if (uSkills.length === 0) return null;
    
    return {
      radar: {
        labels: uSkills.map(s => s.skillName),
        current: uSkills.map(s => s.score),
        average: uSkills.map(s => Math.max(0, s.score - 10))
      },
      breakdown: uSkills.map(s => ({ skill: s.skillName, score: s.score })),
      recommendation: "Keep improving your skills."
    };
  }

  async saveUserSkills(skillData: any): Promise<void> {
    if (!this.currentUser || !skillData?.breakdown) return;
    
    for (const b of skillData.breakdown) {
      const existing = await db.select().from(skills).where(and(eq(skills.userId, this.currentUser.id), eq(skills.skillName, b.skill)));
      if (existing.length > 0) {
        await db.update(skills).set({ score: b.score, lastUpdated: new Date() }).where(eq(skills.id, existing[0].id));
      } else {
        await db.insert(skills).values({
          userId: this.currentUser.id,
          skillName: b.skill,
          score: b.score,
          lastUpdated: new Date()
        });
      }
    }
  }

  async getUserAnalytics(timeRange: string): Promise<any> {
    return {
      activityData: [],
      competencyData: [],
      assessmentData: [],
      skillData: [],
      efficiency: { completionRate: 0, avgLearningTime: 0, knowledgeRetention: 0 }
    };
  }

  async startAssessment(assessmentType: string): Promise<Assessment> {
    const records = await db.select().from(assessments).where(eq(assessments.type, assessmentType)).limit(1);
    if (records.length > 0) return records[0] as Assessment;
    return { id: "a1", type: assessmentType, title: "Dynamic Assessment", description: "Test", difficulty: "medium", estimatedTime: "10 mins" } as Assessment;
  }

  async submitAnswer(assessmentId: string, questionId: string, answer: string): Promise<any> {
    return { correct: true, feedback: "Good." };
  }

  async completeAssessment(assessmentId: string): Promise<any> {
    if (!this.currentUser) return { score: 100, feedback: "Great!" };
    await db.insert(userAssessments).values({
      userId: this.currentUser.id,
      assessmentId,
      startedAt: new Date(Date.now() - 600000),
      completedAt: new Date(),
      score: 85,
      adaptive: true,
      results: {}
    });
    return { score: 85, feedback: "Great!" };
  }

  async startModule(moduleId: string): Promise<any> {
    if (!this.currentUser) return { success: false, message: "No user" };
    await db.insert(userModules).values({
      userId: this.currentUser.id,
      moduleId,
      status: "in-progress",
      startedAt: new Date(),
    });
    return { success: true, message: "Started" };
  }

  async completeModule(moduleId: string): Promise<any> {
    if (!this.currentUser) return { success: false, message: "No user" };
    // update status
    await db.update(userModules)
      .set({ status: "completed", completedAt: new Date(), score: 100, progress: 100 })
      .where(and(eq(userModules.userId, this.currentUser.id), eq(userModules.moduleId, moduleId)));
    return { success: true, message: "Completed" };
  }

  // Syllabi
  async getSyllabi(userId: number): Promise<Syllabus[]> { return db.select().from(syllabi).where(eq(syllabi.userId, userId)); }
  async getSyllabus(id: number): Promise<Syllabus | undefined> { const s = await db.select().from(syllabi).where(eq(syllabi.id, id)); return s[0]; }
  async createSyllabus(syl: any): Promise<Syllabus> { const [s] = await db.insert(syllabi).values({...syl, createdAt: new Date(), updatedAt: new Date()}).returning(); return s; }
  async updateSyllabus(id: number, updates: Partial<Syllabus>): Promise<Syllabus> { const [s] = await db.update(syllabi).set({...updates, updatedAt: new Date()}).where(eq(syllabi.id, id)).returning(); return s; }
  async activateSyllabus(id: number): Promise<void> { 
    if (!this.currentUser) return;
    await db.update(syllabi).set({isActive: false, status: 'draft'}).where(eq(syllabi.userId, this.currentUser.id));
    await db.update(syllabi).set({isActive: true, status: 'active'}).where(eq(syllabi.id, id)); 
  }
  
  // Calendars
  async getCalendarEvents(userId: number): Promise<CalendarEvent[]> { return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)); }
  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> { const c = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)); return c[0]; }
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> { const [c] = await db.insert(calendarEvents).values({...event, createdAt: new Date(), updatedAt: new Date()}).returning(); return c; }
  async updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> { const [c] = await db.update(calendarEvents).set({...event, updatedAt: new Date()}).where(eq(calendarEvents.id, id)).returning(); return c; }
  async deleteCalendarEvent(id: number): Promise<void> { await db.delete(calendarEvents).where(eq(calendarEvents.id, id)); }
  async updateGoogleEventId(id: number, gid: string): Promise<void> { await db.update(calendarEvents).set({ googleEventId: gid }).where(eq(calendarEvents.id, id)); }

  // Chat
  async getChatMessages(userId: number, conversationId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(and(eq(chatMessages.userId, userId), eq(chatMessages.conversationId, conversationId))).orderBy(asc(chatMessages.timestamp));
  }
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [c] = await db.insert(chatMessages).values({...message, timestamp: new Date()}).returning(); return c as ChatMessage;
  }
  async getConversations(userId: number): Promise<any[]> {
    return []; // simplified
  }

  // Persona
  async getUserPersona(userId: number): Promise<UserPersona | undefined> { const p = await db.select().from(userPersonas).where(eq(userPersonas.userId, userId)); return p[0]; }
  async saveUserPersona(userId: number, p: any): Promise<UserPersona> { 
    await db.delete(userPersonas).where(eq(userPersonas.userId, userId));
    const [ret] = await db.insert(userPersonas).values({...p, userId, lastAnalyzed: new Date()}).returning();
    return ret;
  }

  // LearningSessions
  async getRecentLearningSessions(userId: number, limit: number): Promise<LearningSession[]> { return db.select().from(learningSessions).where(eq(learningSessions.userId, userId)).limit(limit); }
  async createLearningSession(session: any): Promise<LearningSession> { const [s] = await db.insert(learningSessions).values({...session, createdAt: new Date()}).returning(); return s; }
  async updateLearningSession(id: number, updates: any): Promise<LearningSession> { const [s] = await db.update(learningSessions).set(updates).where(eq(learningSessions.id, id)).returning(); return s; }

  // KnowledgeBank
  async searchKnowledgeBank(q: string, filters?: any): Promise<KnowledgeBank[]> { return db.select().from(knowledgeBank).limit(10); } // Simplified
  async getKnowledgeBankItem(id: number): Promise<KnowledgeBank | undefined> { const k = await db.select().from(knowledgeBank).where(eq(knowledgeBank.id, id)); return k[0]; }

  // AgentInteractions
  async logAgentInteraction(i: InsertAgentInteraction): Promise<AgentInteraction> { const [ret] = await db.insert(agentInteractions).values({...i, timestamp: new Date()}).returning(); return ret; }
  async getAgentInteractions(userId: number, t?: string): Promise<AgentInteraction[]> { 
    if (t) return db.select().from(agentInteractions).where(and(eq(agentInteractions.userId, userId), eq(agentInteractions.agentType, t)));
    return db.select().from(agentInteractions).where(eq(agentInteractions.userId, userId));
  }
}

export const storage = new DatabaseStorage();