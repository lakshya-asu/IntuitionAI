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
