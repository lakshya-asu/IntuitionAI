import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRecommendations, generateAdaptiveTesting, generateSkillAssessment, generateChatbotResponse, analyzeUserPersona } from "./openai-service";
import type { ChatMessage, InsertCalendarEvent } from "../shared/schema";
import { insertCalendarEventSchema } from "../shared/schema";
import { 
  getAuthUrl,
  handleOAuthCallback,
  addEventToCalendar,
  updateEventInCalendar,
  deleteEventFromCalendar
} from "./google-calendar-service";

// Define session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Auth middleware for protected routes
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  console.log("Checking authentication, session data:", req.session);
  
  // Check if user ID exists in session
  if (!req.session.userId) {
    console.log("Auth failed: No userId in session");
    return res.status(401).json({ message: "User not authenticated" });
  }
  
  console.log("Found userId in session:", req.session.userId);
  
  // Set the current user in storage based on session
  const user = await storage.getUser(req.session.userId);
  console.log("User lookup result:", user ? "User found in storage" : "User not found in storage");
  
  if (!user) {
    console.log("Auth failed: User not found in storage with id:", req.session.userId);
    // Clear invalid session
    req.session.destroy(err => {
      if (err) console.error("Session destroy error:", err);
    });
    return res.status(401).json({ message: "User not authenticated" });
  }
  
  console.log("User authenticated successfully:", user.id);
  // Set current user in storage
  await storage.setCurrentUser(user);
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug endpoints (remove in production)
  app.get("/api/debug/session", (req, res) => {
    console.log("Debug session data:", req.session);
    res.json({ 
      session: req.session,
      sessionID: req.sessionID,
      hasUserId: !!req.session.userId,
      userId: req.session.userId
    });
  });
  
  app.get("/api/debug/users", async (req, res) => {
    const users = Array.from((storage as any).users?.values() || []);
    console.log("Debug users data:", users.length, "users found");
    res.json({ 
      userCount: users.length,
      userIds: users.map(user => ({ id: user.id, username: user.username }))
    });
  });
  
  app.post("/api/debug/create-test-user", async (req, res) => {
    try {
      const testUser = await storage.createUser({
        username: "testuser",
        password: "testpassword",
        name: "Test User",
        email: "test@example.com"
      });
      console.log("Test user created:", testUser);
      res.json({ success: true, user: testUser });
    } catch (error) {
      console.error("Failed to create test user:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });
  
  // Debug route for getting test user data without login (for testing only)
  app.get("/api/debug/test-user", async (req, res) => {
    try {
      let user = await storage.getUserByUsername("testuser");
      
      if (!user) {
        user = await storage.createUser({
          username: "testuser",
          password: "testpass123",
          name: "Test User",
          email: "test@example.com"
        });
        console.log("Created test user:", user.id);
      }
      
      // Return the user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Debug test user error:", error);
      res.status(500).json({ 
        message: "Failed to get test user data", 
        error: String(error) 
      });
    }
  });
  
  app.post("/api/debug/login-test-user", async (req, res) => {
    try {
      // Create a test user if it doesn't exist
      let user = await storage.getUserByUsername("testuser");
      
      if (!user) {
        user = await storage.createUser({
          username: "testuser",
          password: "testpass123",  // This would normally be hashed
          name: "Test User",
          email: "test@example.com"
        });
        console.log("Created test user:", user.id);
      }
      
      console.log("Debug login as test user:", user.id);
      
      // Set user ID in session
      req.session.userId = user.id;
      console.log("Debug login: Session ID set to", req.session.userId);
      
      // Explicitly save the session to ensure it persists
      req.session.save((err) => {
        if (err) {
          console.error("Debug login: Error saving session", err);
          return res.status(500).json({ 
            success: false, 
            message: "Failed to save session" 
          });
        }
        
        console.log("Debug login: Session saved successfully");
        
        // Set as current user in storage
        storage.setCurrentUser(user)
          .then(() => {
            console.log("Debug login: Current user set in storage");
            // Return user info without password
            const { password: _, ...userWithoutPassword } = user;
            res.json({ 
              success: true, 
              message: "Test user logged in successfully", 
              user: userWithoutPassword
            });
          })
          .catch(error => {
            console.error("Debug login: Error setting current user", error);
            res.status(500).json({ 
              success: false, 
              message: "Failed to set current user in storage" 
            });
          });
      });
    } catch (error) {
      console.error("Debug login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to login test user", 
        error: String(error) 
      });
    }
  });
  
  // Debug endpoint for generating and testing a user persona without needing chat history
  app.post("/api/debug/generate-test-persona", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // Sample chat history for generating a test persona
      const sampleMessages = [
        {
          role: "user",
          content: "I prefer watching video explanations for complex topics. Reading long texts makes me lose focus.",
          timestamp: new Date(Date.now() - 7 * 86400000)
        },
        {
          role: "assistant",
          content: "I understand you prefer visual learning. I'll focus on recommending video content for complex topics.",
          timestamp: new Date(Date.now() - 7 * 86400000 + 60000)
        },
        {
          role: "user",
          content: "I struggle with understanding causality concepts especially in statistics.",
          timestamp: new Date(Date.now() - 5 * 86400000)
        },
        {
          role: "assistant",
          content: "Many people find causality challenging. Let's break it down with some visual examples.",
          timestamp: new Date(Date.now() - 5 * 86400000 + 60000)
        },
        {
          role: "user",
          content: "I usually study in the evenings. And I like taking frequent short breaks.",
          timestamp: new Date(Date.now() - 3 * 86400000)
        },
        {
          role: "user",
          content: "The quantum physics videos are fascinating, but I need more interactive examples.",
          timestamp: new Date(Date.now() - 2 * 86400000)
        },
        {
          role: "assistant",
          content: "Interactive examples are great for understanding quantum concepts. I'll look for some simulations you can try.",
          timestamp: new Date(Date.now() - 2 * 86400000 + 60000)
        }
      ];
      
      console.log("Generating test persona for user:", userId);
      
      // Analyze simulated chat history with OpenAI
      const analysis = await analyzeUserPersona(sampleMessages);
      
      // Save the analyzed persona to the database
      const userPersona = await storage.saveUserPersona(userId, {
        contentFormat: analysis.contentFormat || [],
        studyHabits: analysis.studyHabits || [],
        currentWeaknesses: analysis.currentWeaknesses || [],
        learningStyle: analysis.learningStyle || "visual",
        rawAnalysis: analysis
      });
      
      res.json({ 
        success: true, 
        persona: userPersona,
        analysis: analysis.analysis
      });
    } catch (error: any) {
      console.error("Test persona generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate test user persona",
        error: error.message
      });
    }
  });
  
  // Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration attempt:", req.body);
      const { username, password, name, email } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      console.log("Existing user check:", existingUser ? "User exists" : "User does not exist");
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create new user
      console.log("Creating new user with data:", { username, name, email });
      const user = await storage.createUser({
        username,
        password, // Note: In a real app, you'd hash the password
        name,
        email
      });
      
      console.log("User created successfully:", user.id);
      
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
      console.log("Login attempt:", req.body);
      const { username, password } = req.body;
      
      // Get user
      const user = await storage.getUserByUsername(username);
      console.log("User lookup result:", user ? "User found" : "User not found");
      
      if (!user || user.password !== password) { // Note: In a real app, you'd compare hashed passwords
        console.log("Password check failed:", !user ? "User doesn't exist" : "Password mismatch");
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log("Login successful, setting session for user:", user.id);
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Set as current user in storage
      await storage.setCurrentUser(user);
      
      console.log("User session established:", req.session.userId);
      
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

  app.get("/api/user/stats", requireAuth, async (req, res) => {
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
  app.get("/api/learning-path", requireAuth, async (req, res) => {
    try {
      const learningPath = await storage.getLearningPath();
      res.json(learningPath);
    } catch (error) {
      res.status(500).json({ message: "Failed to get learning path" });
    }
  });

  // Curriculum endpoints
  app.get("/api/curriculum", requireAuth, async (req, res) => {
    try {
      const curriculum = await storage.getCurriculum();
      res.json(curriculum);
    } catch (error) {
      res.status(500).json({ message: "Failed to get curriculum" });
    }
  });

  // Learning library endpoints
  app.get("/api/learning-library", requireAuth, async (req, res) => {
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

  // Important: specific routes like "types" should come BEFORE param routes like ":id"
  app.get("/api/assessments/types", requireAuth, async (req, res) => {
    try {
      // This would normally fetch from the database
      // For the demo, we'll return a sample list of assessment types
      const assessmentTypes = [
        {
          id: "ml-basics",
          title: "Machine Learning Basics",
          description: "Tests fundamental understanding of machine learning principles and algorithms.",
          difficulty: "beginner",
          estimatedTime: "10 min",
          topics: ["Supervised Learning", "Algorithms", "Neural Networks"]
        },
        {
          id: "prob-reasoning",
          title: "Probabilistic Reasoning",
          description: "Tests advanced understanding of probability theory and Bayesian inference.",
          difficulty: "advanced",
          estimatedTime: "15 min",
          topics: ["Probability Theory", "Bayesian Statistics", "Random Variables"]
        },
        {
          id: "philosophy",
          title: "Philosophy of Mind",
          description: "Tests understanding of key philosophical concepts related to consciousness and cognition.",
          difficulty: "intermediate",
          estimatedTime: "12 min",
          topics: ["Consciousness", "Dualism", "Identity Theory"]
        },
        {
          id: "quantum-physics",
          title: "Quantum Physics Essentials",
          description: "Tests foundational knowledge of quantum physics principles and mathematics.",
          difficulty: "advanced",
          estimatedTime: "20 min",
          topics: ["Quantum Mechanics", "Wave Functions", "Uncertainty Principle"]
        },
        {
          id: "perception",
          title: "Perception Systems",
          description: "Tests understanding of human and machine perception mechanisms.",
          difficulty: "intermediate",
          estimatedTime: "15 min",
          topics: ["Visual Processing", "Pattern Recognition", "Sensory Systems"]
        },
        {
          id: "cognitive-systems",
          title: "Cognitive Systems",
          description: "Tests knowledge of cognitive architectures and information processing.",
          difficulty: "intermediate",
          estimatedTime: "15 min",
          topics: ["Memory Systems", "Decision Making", "Attention Mechanisms"]
        }
      ];
      
      res.json(assessmentTypes);
    } catch (error) {
      console.error("Assessment types fetch error:", error);
      res.status(500).json({ message: "Failed to get assessment types" });
    }
  });

  app.get("/api/assessments/:id", requireAuth, async (req, res) => {
    try {
      const assessmentId = req.params.id;
      
      // In a real system, we would select the right assessment based on ID
      // For now, we'll serve different assessments based on the ID
      let assessment;
      
      if (assessmentId === "ml-basics" || assessmentId === "assessment-001") {
        // Machine Learning assessment
        assessment = {
          id: assessmentId,
          title: "Machine Learning Basics Review",
          description: "This assessment covers fundamental concepts in machine learning theory and application.",
          questions: [
            {
              id: "q1",
              type: "mcq",
              text: "In gradient descent optimization for a neural network, which of the following expressions correctly represents the weight update rule for a single weight $w_{ij}$ using backpropagation where $\\eta$ is the learning rate, $E$ is the error function, and $\\frac{\\partial E}{\\partial w_{ij}}$ is the partial derivative of the error with respect to the weight?",
              options: [
                { id: "a", text: "$w_{ij}^{new} = w_{ij}^{old} - \\eta \\frac{\\partial E}{\\partial w_{ij}}$" },
                { id: "b", text: "$w_{ij}^{new} = w_{ij}^{old} + \\eta \\frac{\\partial E}{\\partial w_{ij}}$" },
                { id: "c", text: "$w_{ij}^{new} = w_{ij}^{old} - \\frac{\\partial E}{\\partial w_{ij}} \\cdot \\eta$" },
                { id: "d", text: "$w_{ij}^{new} = w_{ij}^{old} \\cdot (1 - \\eta \\frac{\\partial E}{\\partial w_{ij}})$" }
              ],
              correctAnswer: "a",
              explanation: "In gradient descent, we update weights by moving in the direction opposite to the gradient of the error function. The correct formula subtracts the gradient multiplied by the learning rate from the current weight value."
            },
            {
              id: "q2",
              type: "mcq",
              text: "What is the primary difference between supervised and unsupervised learning?",
              options: [
                { id: "a", text: "Supervised learning requires a GPU, while unsupervised learning works on CPU" },
                { id: "b", text: "Supervised learning uses labeled training data, while unsupervised learning does not" },
                { id: "c", text: "Supervised learning is always more accurate than unsupervised learning" },
                { id: "d", text: "Supervised learning works with image data, while unsupervised learning works with text data" }
              ],
              correctAnswer: "b",
              explanation: "Supervised learning uses labeled training data where the target outputs are known, while unsupervised learning works with unlabeled data and tries to find patterns or structure in the data without explicit guidance."
            },
            {
              id: "q3",
              type: "mcq",
              text: "If the accuracy of a machine learning model on the training set is 95% but only 70% on the test set, this is most likely an example of:",
              options: [
                { id: "a", text: "Underfitting" },
                { id: "b", text: "Overfitting" },
                { id: "c", text: "Regularization" },
                { id: "d", text: "Normalization" }
              ],
              correctAnswer: "b",
              explanation: "This scenario describes overfitting, where the model performs well on the training data but fails to generalize to unseen data. The large gap between training and test performance is a classic sign of overfitting."
            }
          ]
        };
      } else if (assessmentId === "prob-reasoning" || assessmentId === "assessment-002") {
        // Probabilistic Reasoning assessment
        assessment = {
          id: assessmentId,
          title: "Probabilistic Reasoning Challenge",
          description: "This advanced assessment tests your ability to apply probability theory to complex problems.",
          questions: [
            {
              id: "q1",
              type: "mcq",
              text: "Given a joint probability distribution $P(X,Y)$ and marginal distributions $P(X)$ and $P(Y)$, which of the following expressions correctly represents the conditional independence of random variables $X$ and $Y$ given a third variable $Z$?",
              options: [
                { id: "a", text: "$P(X,Y|Z) = P(X|Z)P(Y|Z)$" },
                { id: "b", text: "$P(X,Y|Z) = P(X|Y,Z)P(Y|Z)$" },
                { id: "c", text: "$P(X,Y|Z) = P(X|Z)P(Y)$" },
                { id: "d", text: "$P(X,Y|Z) = \\frac{P(X,Y,Z)}{P(Z)}$" }
              ],
              correctAnswer: "a",
              explanation: "Conditional independence means that knowing Z, the value of X provides no additional information about Y, and vice versa. Mathematically, this is expressed as P(X,Y|Z) = P(X|Z)P(Y|Z)."
            },
            {
              id: "q2",
              type: "mcq",
              text: "In Bayesian inference, which of the following best describes the relationship between the prior probability $P(\\theta)$, the likelihood $P(D|\\theta)$, and the posterior probability $P(\\theta|D)$?",
              options: [
                { id: "a", text: "$P(\\theta|D) = P(D|\\theta) \\cdot P(\\theta)$" },
                { id: "b", text: "$P(\\theta|D) = \\frac{P(D|\\theta) \\cdot P(\\theta)}{P(D)}$" },
                { id: "c", text: "$P(\\theta|D) = P(D|\\theta) + P(\\theta)$" },
                { id: "d", text: "$P(\\theta|D) = P(D|\\theta) - P(\\theta)$" }
              ],
              correctAnswer: "b",
              explanation: "Bayes' theorem states that the posterior probability is proportional to the likelihood multiplied by the prior probability, divided by the marginal likelihood (evidence): P(θ|D) = [P(D|θ) × P(θ)] / P(D)."
            },
            {
              id: "q3",
              type: "mcq",
              text: "Which of the following correctly represents the entropy $H(X)$ of a discrete random variable $X$ with probability mass function $p(x)$?",
              options: [
                { id: "a", text: "$H(X) = \\sum_x p(x) \\log p(x)$" },
                { id: "b", text: "$H(X) = -\\sum_x p(x) \\log p(x)$" },
                { id: "c", text: "$H(X) = \\sum_x \\log p(x)$" },
                { id: "d", text: "$H(X) = -\\sum_x \\log p(x)$" }
              ],
              correctAnswer: "b",
              explanation: "The entropy of a discrete random variable X is defined as the negative sum of the probability of each possible outcome multiplied by the log of the probability: H(X) = -∑x p(x) log p(x). This measures the average information or uncertainty associated with X."
            }
          ]
        };
      } else {
        // Default to ML assessment if ID not recognized
        assessment = {
          id: assessmentId,
          title: "Machine Learning Basics Review",
          description: "This assessment covers fundamental concepts in machine learning theory and application.",
          questions: [
            {
              id: "q1",
              type: "mcq",
              text: "In gradient descent optimization for a neural network, which of the following expressions correctly represents the weight update rule for a single weight $w_{ij}$ using backpropagation where $\\eta$ is the learning rate, $E$ is the error function, and $\\frac{\\partial E}{\\partial w_{ij}}$ is the partial derivative of the error with respect to the weight?",
              options: [
                { id: "a", text: "$w_{ij}^{new} = w_{ij}^{old} - \\eta \\frac{\\partial E}{\\partial w_{ij}}$" },
                { id: "b", text: "$w_{ij}^{new} = w_{ij}^{old} + \\eta \\frac{\\partial E}{\\partial w_{ij}}$" },
                { id: "c", text: "$w_{ij}^{new} = w_{ij}^{old} - \\frac{\\partial E}{\\partial w_{ij}} \\cdot \\eta$" },
                { id: "d", text: "$w_{ij}^{new} = w_{ij}^{old} \\cdot (1 - \\eta \\frac{\\partial E}{\\partial w_{ij}})$" }
              ],
              correctAnswer: "a"
            },
            {
              id: "q2",
              type: "mcq",
              text: "What is the primary difference between supervised and unsupervised learning?",
              options: [
                { id: "a", text: "Supervised learning requires a GPU, while unsupervised learning works on CPU" },
                { id: "b", text: "Supervised learning uses labeled training data, while unsupervised learning does not" },
                { id: "c", text: "Supervised learning is always more accurate than unsupervised learning" },
                { id: "d", text: "Supervised learning works with image data, while unsupervised learning works with text data" }
              ],
              correctAnswer: "b"
            },
            {
              id: "q3",
              type: "mcq",
              text: "If the accuracy of a machine learning model on the training set is 95% but only 70% on the test set, this is most likely an example of:",
              options: [
                { id: "a", text: "Underfitting" },
                { id: "b", text: "Overfitting" },
                { id: "c", text: "Regularization" },
                { id: "d", text: "Normalization" }
              ],
              correctAnswer: "b"
            }
          ]
        };
      }
      
      res.json(assessment);
    } catch (error) {
      console.error("Assessment fetch error:", error);
      res.status(500).json({ message: "Failed to get assessment" });
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
  app.get("/api/analytics", requireAuth, async (req, res) => {
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
      const userId = req.session.userId!;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ 
          message: "Invalid request. 'messages' array is required." 
        });
      }
      
      const response = await generateChatbotResponse(messages);
      
      // Store the message in the database
      const conversationId = req.body.conversationId || "default-conversation";
      await storage.saveChatMessage({
        userId,
        role: "user",
        content: messages[messages.length - 1].content,
        conversationId
      });
      
      // Store the assistant's response
      await storage.saveChatMessage({
        userId,
        role: "assistant",
        content: response,
        conversationId
      });
      
      res.json({ response });
    } catch (error: any) {
      console.error("Chatbot error:", error);
      res.status(500).json({ 
        message: "Failed to get chatbot response",
        error: error.message
      });
    }
  });
  
  // Get user persona
  app.get("/api/user/persona", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const persona = await storage.getUserPersona(userId);
      
      if (!persona) {
        return res.status(404).json({
          message: "User persona not found. Use the analyze-persona endpoint to create one."
        });
      }
      
      res.json(persona);
    } catch (error: any) {
      console.error("Get persona error:", error);
      res.status(500).json({ 
        message: "Failed to get user persona",
        error: error.message
      });
    }
  });
  
  // User Persona Retrieval - Analyze user chat history for persona creation
  app.post("/api/user/analyze-persona", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // Retrieve all chat messages for this user
      const conversations = await storage.getConversations(userId);
      let allMessages: ChatMessage[] = [];
      
      // Get messages from each conversation
      for (const conversation of conversations) {
        const messages = await storage.getChatMessages(userId, conversation.id);
        allMessages = [...allMessages, ...messages];
      }
      
      if (allMessages.length < 3) {
        return res.status(400).json({
          message: "Not enough chat history to analyze. Continue chatting to build your persona."
        });
      }
      
      // Format messages for OpenAI analysis
      const messagesForAnalysis = allMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      // Analyze user chat history with OpenAI
      const analysis = await analyzeUserPersona(messagesForAnalysis);
      
      // Save the analyzed persona to the database
      const userPersona = await storage.saveUserPersona(userId, {
        contentFormat: analysis.contentFormat || [],
        studyHabits: analysis.studyHabits || [],
        currentWeaknesses: analysis.currentWeaknesses || [],
        learningStyle: analysis.learningStyle || "visual",
        rawAnalysis: analysis
      });
      
      res.json({ 
        success: true, 
        persona: userPersona,
        analysis: analysis.analysis
      });
    } catch (error: any) {
      console.error("Persona analysis error:", error);
      res.status(500).json({ 
        message: "Failed to analyze user persona",
        error: error.message
      });
    }
  });

  // Calendar endpoints
  app.get("/api/calendar/auth-url", requireAuth, async (req, res) => {
    try {
      const authUrl = await getAuthUrl();
      res.json({ url: authUrl });
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      res.status(500).json({ message: "Failed to get Google Calendar authorization URL" });
    }
  });

  app.get("/api/calendar/oauth-callback", requireAuth, async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Authorization code is required" });
      }
      
      await handleOAuthCallback(code);
      res.json({ success: true });
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ message: "Failed to complete Google Calendar authorization" });
    }
  });

  app.get("/api/calendar/events", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const events = await storage.getCalendarEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Failed to get calendar events:", error);
      res.status(500).json({ message: "Failed to get calendar events" });
    }
  });

  app.post("/api/calendar/events", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const eventData = insertCalendarEventSchema.parse({
        ...req.body,
        userId: req.session.userId
      });

      // Create event in our database
      const event = await storage.createCalendarEvent(eventData);

      // If we have Google Calendar integration, sync the event
      try {
        const googleEventId = await addEventToCalendar({
          title: event.title,
          description: event.description || '',
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location
        });

        // Store the Google Calendar event ID
        await storage.updateGoogleEventId(event.id, googleEventId);
      } catch (syncError) {
        console.warn("Failed to sync with Google Calendar:", syncError);
        // Continue without Google Calendar sync
      }

      res.status(201).json(event);
    } catch (error) {
      console.error("Failed to create calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  app.put("/api/calendar/events/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const eventId = parseInt(id);
      
      // Get existing event
      const existingEvent = await storage.getCalendarEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Calendar event not found" });
      }

      // Update event in our database
      const updatedEvent = await storage.updateCalendarEvent(eventId, req.body);

      // If we have Google Calendar integration and the event has a Google ID, update it there too
      if (existingEvent.googleEventId) {
        try {
          await updateEventInCalendar(existingEvent.googleEventId, {
            title: updatedEvent.title,
            description: updatedEvent.description || '',
            startTime: updatedEvent.startTime,
            endTime: updatedEvent.endTime,
            location: updatedEvent.location
          });
        } catch (syncError) {
          console.warn("Failed to sync update with Google Calendar:", syncError);
          // Continue without Google Calendar sync
        }
      }

      res.json(updatedEvent);
    } catch (error) {
      console.error("Failed to update calendar event:", error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete("/api/calendar/events/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const eventId = parseInt(id);
      
      // Get existing event
      const existingEvent = await storage.getCalendarEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Calendar event not found" });
      }

      // Delete from our database
      await storage.deleteCalendarEvent(eventId);

      // If we have Google Calendar integration and the event has a Google ID, delete it there too
      if (existingEvent.googleEventId) {
        try {
          await deleteEventFromCalendar(existingEvent.googleEventId);
        } catch (syncError) {
          console.warn("Failed to sync deletion with Google Calendar:", syncError);
          // Continue without Google Calendar sync
        }
      }

      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
