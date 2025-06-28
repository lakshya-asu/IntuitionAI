import OpenAI from "openai";
import { storage } from "../storage";
import type { UserPersona, LearningSession } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" });

export interface RecommendationContext {
  userId: number;
  currentSyllabus?: any;
  recentSessions?: LearningSession[];
  performanceData?: any;
  timeConstraints?: {
    availableTime: number; // minutes per day
    deadline?: Date;
  };
}

export class RecommendationAgent {
  async generateRecommendations(
    context: RecommendationContext
  ): Promise<{
    resources: any[];
    activities: any[];
    schedule: any[];
    reasoning: string;
    confidence: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Get user data
      const userPersona = await storage.getUserPersona(context.userId);
      const userStats = await storage.getUserStats();
      const learningHistory = await storage.getLearningHistory();
      
      // Analyze current learning state
      const learningState = await this.analyzeLearningState(context, userPersona, learningHistory);
      
      // Generate personalized recommendations
      const recommendations = await this.generatePersonalizedRecommendations(
        learningState,
        userPersona,
        context
      );
      
      const processingTime = Date.now() - startTime;
      
      // Log the interaction
      await storage.logAgentInteraction({
        userId: context.userId,
        agentType: 'recommendation',
        interactionType: 'recommendation',
        input: { context: { currentSyllabus: !!context.currentSyllabus, sessionCount: context.recentSessions?.length } },
        output: recommendations,
        confidence: recommendations.confidence,
        processingTime
      });
      
      return recommendations;
    } catch (error) {
      console.error("Recommendation Agent error:", error);
      
      // Fallback recommendations
      return {
        resources: [],
        activities: [],
        schedule: [],
        reasoning: "Unable to generate personalized recommendations at this time.",
        confidence: 0
      };
    }
  }

  private async analyzeLearningState(
    context: RecommendationContext,
    userPersona?: UserPersona,
    learningHistory?: any
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    currentLevel: string;
    preferredFormats: string[];
    optimalSchedule: any;
    motivationFactors: string[];
  }> {
    const prompt = `
      Analyze the current learning state based on this data:
      
      User Persona: ${userPersona ? JSON.stringify(userPersona) : 'Not available'}
      Learning History: ${learningHistory ? JSON.stringify(learningHistory) : 'Not available'}
      Recent Sessions: ${context.recentSessions?.length || 0} sessions
      Time Constraints: ${context.timeConstraints?.availableTime || 'Unknown'} minutes/day
      
      Analyze and return:
      1. strengths - Current strong areas
      2. weaknesses - Areas needing improvement
      3. currentLevel - Overall proficiency level
      4. preferredFormats - Best content formats for this user
      5. optimalSchedule - Best times/patterns for learning
      6. motivationFactors - What keeps this user engaged
      
      Return as JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert learning analyst." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Learning state analysis error:", error);
      return {
        strengths: [],
        weaknesses: [],
        currentLevel: "intermediate",
        preferredFormats: ["video", "text"],
        optimalSchedule: {},
        motivationFactors: []
      };
    }
  }

  private async generatePersonalizedRecommendations(
    learningState: any,
    userPersona?: UserPersona,
    context?: RecommendationContext
  ): Promise<{
    resources: any[];
    activities: any[];
    schedule: any[];
    reasoning: string;
    confidence: number;
  }> {
    const prompt = `
      Generate personalized learning recommendations based on:
      
      Learning State: ${JSON.stringify(learningState)}
      User Preferences: ${userPersona ? JSON.stringify(userPersona) : 'Default'}
      Available Time: ${context?.timeConstraints?.availableTime || 30} minutes/day
      
      Generate:
      1. resources - 3-5 specific learning resources (with title, type, duration, reason)
      2. activities - 3-5 learning activities (with description, duration, difficulty)
      3. schedule - Optimal learning schedule for the next week
      4. reasoning - Explanation of why these recommendations fit the user
      5. confidence - How confident you are in these recommendations (0-100)
      
      Focus on:
      - User's preferred content formats
      - Addressing identified weaknesses
      - Building on strengths
      - Realistic time constraints
      - Maintaining engagement
      
      Return as JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert learning recommendation engine." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Recommendation generation error:", error);
      return {
        resources: [],
        activities: [],
        schedule: [],
        reasoning: "Unable to generate recommendations",
        confidence: 0
      };
    }
  }

  async recommendNextAction(
    userId: number,
    currentContext: string
  ): Promise<{
    action: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: number;
  }> {
    try {
      const userPersona = await storage.getUserPersona(userId);
      const recentSessions = await storage.getRecentLearningSessions(userId, 5);
      
      const prompt = `
        Based on the user's current context: "${currentContext}"
        User preferences: ${userPersona ? JSON.stringify(userPersona) : 'Unknown'}
        Recent sessions: ${recentSessions?.length || 0} sessions
        
        Recommend the single best next action for this user.
        
        Return JSON with:
        - action: Specific action to take
        - reasoning: Why this action is recommended
        - priority: high/medium/low
        - estimatedTime: Minutes needed
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a learning optimization expert." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Next action recommendation error:", error);
      return {
        action: "Continue with current learning module",
        reasoning: "Maintain learning momentum",
        priority: 'medium',
        estimatedTime: 30
      };
    }
  }
}

export const recommendationAgent = new RecommendationAgent();