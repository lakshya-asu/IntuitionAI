import OpenAI from "openai";
import { storage } from "../storage";
import type { LearningSession, UserAssessment } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" });

export interface EvaluationContext {
  userId: number;
  sessionId?: number;
  assessmentId?: number;
  topic?: string;
  timeSpent?: number;
  responses?: any[];
}

export class EvaluatorAgent {
  async evaluatePerformance(
    context: EvaluationContext
  ): Promise<{
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextSteps: string[];
    confidence: number;
    detailedAnalysis: any;
  }> {
    const startTime = Date.now();
    
    try {
      // Get user's learning history and persona
      const userPersona = await storage.getUserPersona(context.userId);
      const learningHistory = await storage.getLearningHistory();
      const recentSessions = await storage.getRecentLearningSessions(context.userId, 10);
      
      // Analyze current performance
      const performanceAnalysis = await this.analyzePerformance(context, recentSessions);
      
      // Compare with historical data
      const progressAnalysis = await this.analyzeProgress(context, learningHistory);
      
      // Generate evaluation insights
      const evaluation = await this.generateEvaluation(
        performanceAnalysis,
        progressAnalysis,
        userPersona
      );
      
      const processingTime = Date.now() - startTime;
      
      // Log the evaluation
      await storage.logAgentInteraction({
        userId: context.userId,
        agentType: 'evaluator',
        interactionType: 'evaluation',
        input: { context },
        output: evaluation,
        confidence: evaluation.confidence,
        processingTime
      });
      
      return evaluation;
    } catch (error) {
      console.error("Evaluator Agent error:", error);
      
      return {
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        nextSteps: [],
        confidence: 0,
        detailedAnalysis: {}
      };
    }
  }

  private async analyzePerformance(
    context: EvaluationContext,
    recentSessions?: LearningSession[]
  ): Promise<{
    accuracy: number;
    speed: number;
    consistency: number;
    engagement: number;
    patterns: any;
  }> {
    const prompt = `
      Analyze learning performance based on:
      
      Current Context: ${JSON.stringify(context)}
      Recent Sessions: ${recentSessions?.length || 0} sessions
      Time Spent: ${context.timeSpent || 0} minutes
      Responses: ${context.responses?.length || 0} responses
      
      Calculate:
      1. accuracy - How correct were the responses? (0-100)
      2. speed - How efficiently did they work? (0-100)
      3. consistency - How consistent is performance? (0-100)
      4. engagement - How engaged were they? (0-100)
      5. patterns - Any notable patterns in performance
      
      Return as JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert learning performance analyst." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Performance analysis error:", error);
      return {
        accuracy: 0,
        speed: 0,
        consistency: 0,
        engagement: 0,
        patterns: {}
      };
    }
  }

  private async analyzeProgress(
    context: EvaluationContext,
    learningHistory?: any
  ): Promise<{
    improvement: number;
    trajectory: string;
    milestones: any[];
    challenges: string[];
  }> {
    const prompt = `
      Analyze learning progress over time:
      
      Current Performance Context: ${JSON.stringify(context)}
      Learning History: ${learningHistory ? JSON.stringify(learningHistory) : 'Limited data'}
      
      Determine:
      1. improvement - Overall improvement rate (-100 to 100)
      2. trajectory - Learning trajectory (accelerating, steady, declining)
      3. milestones - Key achievements and breakthroughs
      4. challenges - Persistent challenges or obstacles
      
      Return as JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert at analyzing learning progress patterns." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Progress analysis error:", error);
      return {
        improvement: 0,
        trajectory: "steady",
        milestones: [],
        challenges: []
      };
    }
  }

  private async generateEvaluation(
    performanceAnalysis: any,
    progressAnalysis: any,
    userPersona?: any
  ): Promise<{
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextSteps: string[];
    confidence: number;
    detailedAnalysis: any;
  }> {
    const prompt = `
      Generate comprehensive evaluation based on:
      
      Performance Analysis: ${JSON.stringify(performanceAnalysis)}
      Progress Analysis: ${JSON.stringify(progressAnalysis)}
      User Preferences: ${userPersona ? JSON.stringify(userPersona) : 'Unknown'}
      
      Provide:
      1. overallScore - Overall performance score (0-100)
      2. strengths - 3-5 key strengths demonstrated
      3. weaknesses - 3-5 areas needing improvement
      4. recommendations - 3-5 specific recommendations
      5. nextSteps - 3-5 concrete next steps
      6. confidence - Confidence in this evaluation (0-100)
      7. detailedAnalysis - Detailed breakdown of findings
      
      Make recommendations specific and actionable.
      
      Return as JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert learning evaluator providing comprehensive assessments." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Evaluation generation error:", error);
      return {
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        nextSteps: [],
        confidence: 0,
        detailedAnalysis: {}
      };
    }
  }

  async evaluateAdaptiveAssessment(
    userId: number,
    responses: any[],
    timeSpent: number
  ): Promise<{
    score: number;
    difficulty: string;
    nextQuestionLevel: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `
        Evaluate adaptive assessment performance:
        
        Responses: ${JSON.stringify(responses)}
        Time Spent: ${timeSpent} minutes
        
        Determine:
        1. score - Overall score (0-100)
        2. difficulty - Appropriate difficulty level
        3. nextQuestionLevel - Difficulty for next question
        4. strengths - Demonstrated strengths
        5. weaknesses - Areas needing work
        6. recommendations - Specific next steps
        
        Return as JSON.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an adaptive assessment evaluator." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Adaptive assessment evaluation error:", error);
      return {
        score: 0,
        difficulty: "medium",
        nextQuestionLevel: "medium",
        strengths: [],
        weaknesses: [],
        recommendations: []
      };
    }
  }
}

export const evaluatorAgent = new EvaluatorAgent();