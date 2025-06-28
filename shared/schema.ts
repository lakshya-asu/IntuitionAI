import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  level: text("level").notNull().default("Beginner"),
  interests: text("interests").array().notNull().default([]),
  strengths: text("strengths").array().notNull().default([]),
  weaknesses: text("weaknesses").array().notNull().default([]),
  preferences: json("preferences").notNull().default({
    learningSpeed: 3,
    dailyGoal: 30,
    emailNotifications: true,
    pushNotifications: true
  })
});

// Learning module schema
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  topics: text("topics").array().notNull(),
  difficulty: integer("difficulty").notNull(),
  estimatedTime: integer("estimatedTime").notNull(), // in minutes
  prerequisiteIds: integer("prerequisiteIds").array(),
});

// User module progress schema
export const userModules = pgTable("user_modules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => modules.id),
  status: text("status").notNull().default("not-started"),
  progress: integer("progress").notNull().default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
});

// Learning resource schema
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(), 
  type: text("type").notNull(), // article, video, course, exercise
  tags: text("tags").array().notNull(),
  duration: text("duration").notNull(),
  url: text("url").notNull(),
});

// Assessment schema
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // adaptive, quiz, practice
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  estimatedTime: text("estimatedTime").notNull(),
});

// User assessment schema
export const userAssessments = pgTable("user_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  adaptive: boolean("adaptive").notNull().default(true),
  results: json("results").notNull().default({}),
});

// User recommendations schema
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  match: integer("match").notNull(),
  icon: text("icon").notNull(),
  iconBg: text("icon_bg").notNull(),
  topics: text("topics").array().notNull(),
  estimatedTime: text("estimated_time").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User skills schema
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  skillName: text("skill_name").notNull(),
  score: integer("score").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Chatbot messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  conversationId: text("conversation_id").notNull(),
});

// User Persona schema - Updated to use preferences instead of learning style
export const userPersonas = pgTable("user_personas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentFormat: text("content_format").array().notNull().default([]), // 'video', 'text', 'interactive'
  studyHabits: text("study_habits").array().notNull().default([]), // 'morning learner', 'short attention span'
  currentWeaknesses: text("current_weaknesses").array().notNull().default([]), // 'struggles with algebra'
  learningPreferences: text("learning_preferences").notNull().default("visual"), // 'visual', 'auditory', 'kinesthetic'
  lastAnalyzed: timestamp("last_analyzed").notNull().defaultNow(),
  rawAnalysis: json("raw_analysis").notNull().default({})
});

// Personalized Syllabus schema
export const syllabi = pgTable("syllabi", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subject: text("subject").notNull(),
  difficulty: text("difficulty").notNull(),
  estimatedDuration: integer("estimated_duration").notNull(), // in weeks
  modules: json("modules").notNull().default([]), // array of module objects
  prerequisites: text("prerequisites").array().notNull().default([]),
  learningObjectives: text("learning_objectives").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  status: text("status").notNull().default("draft") // draft, active, completed
});

// Learning Sessions schema - tracks actual learning activities
export const learningSessions = pgTable("learning_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  syllabusId: integer("syllabus_id").references(() => syllabi.id),
  moduleId: text("module_id").notNull(),
  resourceId: text("resource_id"),
  sessionType: text("session_type").notNull(), // 'study', 'practice', 'assessment', 'review'
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  progress: integer("progress").notNull().default(0), // percentage
  notes: text("notes"),
  performance: json("performance").notNull().default({}), // scores, completion rates, etc.
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Knowledge Bank schema - stores learning resources and content
export const knowledgeBank = pgTable("knowledge_bank", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // 'text', 'video', 'interactive', 'audio'
  subject: text("subject").notNull(),
  topics: text("topics").array().notNull(),
  difficulty: text("difficulty").notNull(),
  prerequisites: text("prerequisites").array().notNull().default([]),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  tags: text("tags").array().notNull().default([]),
  sourceUrl: text("source_url"),
  metadata: json("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Calendar Events schema
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  moduleId: text("module_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  googleEventId: text("google_event_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Interactions schema - tracks multi-agent system interactions
export const agentInteractions = pgTable("agent_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  agentType: text("agent_type").notNull(), // 'student_interaction', 'recommendation', 'evaluator', 'orchestrator'
  interactionType: text("interaction_type").notNull(), // 'query', 'recommendation', 'evaluation', 'orchestration'
  input: json("input").notNull(),
  output: json("output").notNull(),
  confidence: integer("confidence"), // 0-100
  processingTime: integer("processing_time"), // in milliseconds
  timestamp: timestamp("timestamp").notNull().defaultNow()
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  interests: true,
  strengths: true,
  weaknesses: true,
  preferences: true
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true
});

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

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
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