import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRecommendations, generateAdaptiveTesting, generateSkillAssessment, generateChatbotResponse } from "./openai-service";

// Define session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Auth middleware for protected routes
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Check if user ID exists in session
  if (!req.session.userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  
  // Set the current user in storage based on session
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    // Clear invalid session
    req.session.destroy(err => {
      if (err) console.error("Session destroy error:", err);
    });
    return res.status(401).json({ message: "User not authenticated" });
  }
  
  // Set current user in storage
  await storage.setCurrentUser(user);
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, email } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create new user
      const user = await storage.createUser({
        username,
        password, // Note: In a real app, you'd hash the password
        name,
        email
      });
      
      // Return the user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Get user
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) { // Note: In a real app, you'd compare hashed passwords
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Set as current user in storage
      await storage.setCurrentUser(user);
      
      // Return the user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  // User endpoints
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getCurrentUser();
      // User will always be available because of the requireAuth middleware
      
      // Return the user without sensitive information
      if (user) {
        const { password, ...userWithoutPassword } = user as any;
        res.json(userWithoutPassword);
      } else {
        // This shouldn't happen due to requireAuth, but just to be safe
        res.status(401).json({ message: "User not authenticated" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.get("/api/user/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  app.get("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getUserSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user settings" });
    }
  });

  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { name, email } = req.body;
      const updatedProfile = await storage.updateUserProfile({ name, email });
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/user/preferences", requireAuth, async (req, res) => {
    try {
      const { learningSpeed, dailyGoal, emailNotifications, pushNotifications } = req.body;
      const updatedPreferences = await storage.updateUserPreferences({
        learningSpeed,
        dailyGoal,
        emailNotifications,
        pushNotifications
      });
      res.json(updatedPreferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Learning path endpoints
  app.get("/api/learning-path", async (req, res) => {
    try {
      const learningPath = await storage.getLearningPath();
      res.json(learningPath);
    } catch (error) {
      res.status(500).json({ message: "Failed to get learning path" });
    }
  });

  // Curriculum endpoints
  app.get("/api/curriculum", async (req, res) => {
    try {
      const curriculum = await storage.getCurriculum();
      res.json(curriculum);
    } catch (error) {
      res.status(500).json({ message: "Failed to get curriculum" });
    }
  });

  // Learning library endpoints
  app.get("/api/learning-library", async (req, res) => {
    try {
      const library = await storage.getLearningLibrary();
      res.json(library);
    } catch (error) {
      res.status(500).json({ message: "Failed to get learning library" });
    }
  });

  // Recommendations endpoints
  app.get("/api/recommendations", requireAuth, async (req, res) => {
    try {
      // First try to get from storage
      const cachedRecommendations = await storage.getRecommendations();
      
      // If we don't have recommendations or they're stale, generate new ones
      if (!cachedRecommendations || cachedRecommendations.length === 0) {
        // Get user data needed for personalized recommendations
        const user = await storage.getCurrentUser();
        
        // User will always be available because of requireAuth middleware
        const userData = {
          id: user!.id,
          name: user!.name,
          level: user!.level,
          interests: user!.interests,
          strengths: user!.strengths,
          weaknesses: user!.weaknesses
        };
        
        const userStats = await storage.getUserStats();
        const learningHistory = await storage.getLearningHistory();
        
        // Generate personalized recommendations using OpenAI
        const newRecommendations = await generateRecommendations({
          userData,
          userStats,
          learningHistory
        });
        
        // Store the new recommendations
        await storage.saveRecommendations(newRecommendations);
        
        return res.json(newRecommendations);
      }
      
      res.json(cachedRecommendations);
    } catch (error) {
      console.error("Recommendation error:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Assessment endpoints
  app.get("/api/assessments/suggested", requireAuth, async (req, res) => {
    try {
      // Check if we have cached suggested assessments
      const cachedAssessments = await storage.getSuggestedAssessments();
      
      if (!cachedAssessments || cachedAssessments.length === 0) {
        // Get user data needed for personalized assessments
        const user = await storage.getCurrentUser();
        
        // User will always be available because of requireAuth middleware
        const userData = {
          id: user!.id,
          name: user!.name,
          level: user!.level,
          interests: user!.interests,
          strengths: user!.strengths,
          weaknesses: user!.weaknesses
        };
        
        const userStats = await storage.getUserStats();
        const learningHistory = await storage.getLearningHistory();
        
        // Generate personalized assessments using OpenAI
        const newAssessments = await generateAdaptiveTesting({
          userData,
          userStats,
          learningHistory
        });
        
        // Store the new assessments
        await storage.saveSuggestedAssessments(newAssessments);
        
        return res.json({ suggested: newAssessments });
      }
      
      res.json({ suggested: cachedAssessments });
    } catch (error) {
      console.error("Assessment error:", error);
      res.status(500).json({ message: "Failed to get suggested assessments" });
    }
  });

  // Skills endpoints
  app.get("/api/skills", requireAuth, async (req, res) => {
    try {
      // Check if we have cached skills data
      const cachedSkills = await storage.getUserSkills();
      
      if (!cachedSkills) {
        // Get user data needed for skill assessment
        const user = await storage.getCurrentUser();
        
        // User will always be available because of requireAuth middleware
        const userData = {
          id: user!.id,
          name: user!.name,
          level: user!.level,
          interests: user!.interests,
          strengths: user!.strengths,
          weaknesses: user!.weaknesses
        };
        
        const learningHistory = await storage.getLearningHistory();
        const assessmentResults = await storage.getAssessmentResults();
        
        // Generate skill assessment using OpenAI
        const skillAssessment = await generateSkillAssessment({
          userData,
          learningHistory,
          assessmentResults
        });
        
        // Store the skill assessment
        await storage.saveUserSkills(skillAssessment);
        
        return res.json(skillAssessment);
      }
      
      res.json(cachedSkills);
    } catch (error) {
      console.error("Skills error:", error);
      res.status(500).json({ message: "Failed to get skills data" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics", async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'month';
      const analytics = await storage.getUserAnalytics(timeRange as string);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics data" });
    }
  });

  // Module interaction endpoints
  app.post("/api/modules/:moduleId/start", requireAuth, async (req, res) => {
    try {
      const { moduleId } = req.params;
      const result = await storage.startModule(moduleId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to start module" });
    }
  });

  app.post("/api/modules/:moduleId/complete", requireAuth, async (req, res) => {
    try {
      const { moduleId } = req.params;
      const result = await storage.completeModule(moduleId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete module" });
    }
  });

  // Assessment interaction endpoints
  app.post("/api/assessments/start", requireAuth, async (req, res) => {
    try {
      const { assessmentType } = req.body;
      const assessment = await storage.startAssessment(assessmentType);
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to start assessment" });
    }
  });

  app.post("/api/assessments/:assessmentId/answer", requireAuth, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const { questionId, answer } = req.body;
      const result = await storage.submitAnswer(assessmentId, questionId, answer);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  app.post("/api/assessments/:assessmentId/complete", requireAuth, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const result = await storage.completeAssessment(assessmentId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete assessment" });
    }
  });

  // Chatbot endpoint
  app.post("/api/chatbot", requireAuth, async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ 
          message: "Invalid request. 'messages' array is required." 
        });
      }
      
      const response = await generateChatbotResponse(messages);
      res.json({ response });
    } catch (error: any) {
      console.error("Chatbot error:", error);
      res.status(500).json({ 
        message: "Failed to get chatbot response",
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
