import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRecommendations, generateAdaptiveTesting, generateSkillAssessment, generateChatbotResponse } from "./openai-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // User endpoints
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      res.json(user);
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

  app.get("/api/user/settings", async (req, res) => {
    try {
      const settings = await storage.getUserSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user settings" });
    }
  });

  app.put("/api/user/profile", async (req, res) => {
    try {
      const { name, email } = req.body;
      const updatedProfile = await storage.updateUserProfile({ name, email });
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/user/preferences", async (req, res) => {
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
  app.get("/api/recommendations", async (req, res) => {
    try {
      // First try to get from storage
      const cachedRecommendations = await storage.getRecommendations();
      
      // If we don't have recommendations or they're stale, generate new ones
      if (!cachedRecommendations || cachedRecommendations.length === 0) {
        // Get user data needed for personalized recommendations
        const user = await storage.getCurrentUser();
        
        if (!user) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const userData = {
          id: user.id,
          name: user.name,
          level: user.level,
          interests: user.interests,
          strengths: user.strengths,
          weaknesses: user.weaknesses
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
  app.get("/api/assessments/suggested", async (req, res) => {
    try {
      // Check if we have cached suggested assessments
      const cachedAssessments = await storage.getSuggestedAssessments();
      
      if (!cachedAssessments || cachedAssessments.length === 0) {
        // Get user data needed for personalized assessments
        const user = await storage.getCurrentUser();
        
        if (!user) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const userData = {
          id: user.id,
          name: user.name,
          level: user.level,
          interests: user.interests,
          strengths: user.strengths,
          weaknesses: user.weaknesses
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
  app.get("/api/skills", async (req, res) => {
    try {
      // Check if we have cached skills data
      const cachedSkills = await storage.getUserSkills();
      
      if (!cachedSkills) {
        // Get user data needed for skill assessment
        const user = await storage.getCurrentUser();
        
        if (!user) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const userData = {
          id: user.id,
          name: user.name,
          level: user.level,
          interests: user.interests,
          strengths: user.strengths,
          weaknesses: user.weaknesses
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
  app.post("/api/modules/:moduleId/start", async (req, res) => {
    try {
      const { moduleId } = req.params;
      const result = await storage.startModule(moduleId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to start module" });
    }
  });

  app.post("/api/modules/:moduleId/complete", async (req, res) => {
    try {
      const { moduleId } = req.params;
      const result = await storage.completeModule(moduleId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete module" });
    }
  });

  // Assessment interaction endpoints
  app.post("/api/assessments/start", async (req, res) => {
    try {
      const { assessmentType } = req.body;
      const assessment = await storage.startAssessment(assessmentType);
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to start assessment" });
    }
  });

  app.post("/api/assessments/:assessmentId/answer", async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const { questionId, answer } = req.body;
      const result = await storage.submitAnswer(assessmentId, questionId, answer);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  app.post("/api/assessments/:assessmentId/complete", async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const result = await storage.completeAssessment(assessmentId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete assessment" });
    }
  });

  // Chatbot endpoint
  app.post("/api/chatbot", async (req, res) => {
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
