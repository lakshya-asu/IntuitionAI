import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  level: text("level").notNull().default("Beginner"),
  interests: text("interests", { mode: "json" }).$type<string[]>().notNull().default([]),
  strengths: text("strengths", { mode: "json" }).$type<string[]>().notNull().default([]),
  weaknesses: text("weaknesses", { mode: "json" }).$type<string[]>().notNull().default([]),
  preferences: text("preferences", { mode: "json" }).$type<{
    learningSpeed: number;
    dailyGoal: number;
    emailNotifications: boolean;
    pushNotifications: boolean;
  }>().notNull().default({
    learningSpeed: 3,
    dailyGoal: 30,
    emailNotifications: true,
    pushNotifications: true
  })
});

// Learning module schema
export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  topics: text("topics", { mode: "json" }).$type<string[]>().notNull(),
  difficulty: integer("difficulty").notNull(),
  estimatedTime: integer("estimatedTime").notNull(), // in minutes
  prerequisiteIds: text("prerequisiteIds", { mode: "json" }).$type<string[]>()
});

// User module progress schema
export const userModules = sqliteTable("user_modules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: text("module_id").notNull().references(() => modules.id),
  status: text("status").notNull().default("not-started"),
  progress: integer("progress").notNull().default(0),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  score: integer("score"),
});

// Learning resource schema
export const resources = sqliteTable("resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(), 
  type: text("type").notNull(), // article, video, course, exercise
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
  duration: text("duration").notNull(),
  url: text("url"),
});

// Assessment schema
export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // adaptive, quiz, practice
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  estimatedTime: text("estimatedTime").notNull(),
});

// User assessment schema
export const userAssessments = sqliteTable("user_assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  score: integer("score"),
  adaptive: integer("adaptive", { mode: "boolean" }).notNull().default(true),
  results: text("results", { mode: "json" }).notNull().default({}),
});

// User recommendations schema
export const recommendations = sqliteTable("recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  match: integer("match").notNull(),
  icon: text("icon").notNull(),
  iconBg: text("icon_bg").notNull(),
  topics: text("topics", { mode: "json" }).$type<string[]>().notNull(),
  estimatedTime: text("estimated_time").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// User skills schema
export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  skillName: text("skill_name").notNull(),
  score: integer("score").notNull(),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull(),
});

// Chatbot messages schema
export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  conversationId: text("conversation_id").notNull(),
});

// User Persona schema
export const userPersonas = sqliteTable("user_personas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  contentFormat: text("content_format", { mode: "json" }).$type<string[]>().notNull().default([]), // 'video', 'text', 'interactive'
  studyHabits: text("study_habits", { mode: "json" }).$type<string[]>().notNull().default([]), // 'morning learner', 'short attention span'
  currentWeaknesses: text("current_weaknesses", { mode: "json" }).$type<string[]>().notNull().default([]), // 'struggles with algebra'
  learningPreferences: text("learning_preferences").notNull().default("visual"), // 'visual', 'auditory', 'kinesthetic'
  lastAnalyzed: integer("last_analyzed", { mode: "timestamp" }).notNull(),
  rawAnalysis: text("raw_analysis", { mode: "json" }).notNull().default({})
});

// Personalized Syllabus schema
export const syllabi = sqliteTable("syllabi", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subject: text("subject").notNull(),
  difficulty: text("difficulty").notNull(),
  estimatedDuration: integer("estimated_duration").notNull(), // in weeks
  modules: text("modules", { mode: "json" }).$type<any[]>().notNull().default([]), // array of module objects
  prerequisites: text("prerequisites", { mode: "json" }).$type<string[]>().notNull().default([]),
  learningObjectives: text("learning_objectives", { mode: "json" }).$type<string[]>().notNull().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  status: text("status").notNull().default("draft") // draft, active, completed
});

// Learning Sessions schema
export const learningSessions = sqliteTable("learning_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  syllabusId: integer("syllabus_id").references(() => syllabi.id),
  moduleId: text("module_id").notNull(),
  resourceId: text("resource_id"),
  sessionType: text("session_type").notNull(), // 'study', 'practice', 'assessment', 'review'
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }),
  duration: integer("duration"), // in minutes
  progress: integer("progress").notNull().default(0), // percentage
  notes: text("notes"),
  performance: text("performance", { mode: "json" }).notNull().default({}), // scores, completion rates, etc.
  createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});

// Knowledge Bank schema
export const knowledgeBank = sqliteTable("knowledge_bank", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // 'text', 'video', 'interactive', 'audio'
  subject: text("subject").notNull(),
  topics: text("topics", { mode: "json" }).$type<string[]>().notNull(),
  difficulty: text("difficulty").notNull(),
  prerequisites: text("prerequisites", { mode: "json" }).$type<string[]>().notNull().default([]),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  sourceUrl: text("source_url"),
  metadata: text("metadata", { mode: "json" }).notNull().default({}),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

// Calendar Events schema
export const calendarEvents = sqliteTable("calendar_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  moduleId: text("module_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  googleEventId: text("google_event_id"),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Agent Interactions schema
export const agentInteractions = sqliteTable("agent_interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  agentType: text("agent_type").notNull(), // 'student_interaction', 'recommendation', 'evaluator', 'orchestrator'
  interactionType: text("interaction_type").notNull(), // 'query', 'recommendation', 'evaluation', 'orchestration'
  input: text("input", { mode: "json" }).notNull(),
  output: text("output", { mode: "json" }).notNull(),
  confidence: integer("confidence"), // 0-100
  processingTime: integer("processing_time"), // in milliseconds
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull()
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  interests: true,
  strengths: true,
  weaknesses: true,
  preferences: true
});

export const insertModuleSchema = createInsertSchema(modules);
export const insertResourceSchema = createInsertSchema(resources);
export const insertAssessmentSchema = createInsertSchema(assessments);

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true
});

export const insertUserPersonaSchema = createInsertSchema(userPersonas).omit({
  id: true,
  lastAnalyzed: true,
  rawAnalysis: true
});

export const insertSyllabusSchema = createInsertSchema(syllabi).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLearningSessionSchema = createInsertSchema(learningSessions).omit({
  id: true,
  createdAt: true
});

export const insertKnowledgeBankSchema = createInsertSchema(knowledgeBank).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  googleEventId: true
});

export const insertAgentInteractionSchema = createInsertSchema(agentInteractions).omit({
  id: true,
  timestamp: true
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertModule = typeof modules.$inferInsert;
export type Module = typeof modules.$inferSelect;

export type InsertResource = typeof resources.$inferInsert;
export type Resource = typeof resources.$inferSelect;

export type InsertAssessment = typeof assessments.$inferInsert;
export type Assessment = typeof assessments.$inferSelect;

export type UserModule = typeof userModules.$inferSelect;
export type UserAssessment = typeof userAssessments.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type UserPersona = typeof userPersonas.$inferSelect;
export type InsertUserPersona = z.infer<typeof insertUserPersonaSchema>;

export type Syllabus = typeof syllabi.$inferSelect;
export type InsertSyllabus = z.infer<typeof insertSyllabusSchema>;

export type LearningSession = typeof learningSessions.$inferSelect;
export type InsertLearningSession = z.infer<typeof insertLearningSessionSchema>;

export type KnowledgeBank = typeof knowledgeBank.$inferSelect;
export type InsertKnowledgeBank = z.infer<typeof insertKnowledgeBankSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type AgentInteraction = typeof agentInteractions.$inferSelect;
export type InsertAgentInteraction = z.infer<typeof insertAgentInteractionSchema>;