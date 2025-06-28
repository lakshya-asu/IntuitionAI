import { studentInteractionAgent } from "./student-interaction-agent";
import { recommendationAgent } from "./recommendation-agent";
import { evaluatorAgent } from "./evaluator-agent";
import { storage } from "../storage";
import type { ChatMessage } from "../../shared/schema";

export interface OrchestrationContext {
  userId: number;
  currentActivity?: string;
  sessionType?: 'study' | 'practice' | 'assessment' | 'review';
  timeAvailable?: number;
  userIntent?: string;
  priority?: 'learning' | 'assessment' | 'review' | 'planning';
}

export class OrchestratorAgent {
  async orchestrateInteraction(
    userId: number,
    userInput: string,
    context: OrchestrationContext
  ): Promise<{
    response: string;
    actions: any[];
    recommendations: any[];
    nextSteps: string[];
    agentsInvolved: string[];
    confidence: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Determine which agents to involve based on context and input
      const agentPlan = await this.planAgentInvolvement(userInput, context);
      
      // Execute agent interactions in optimal order
      const results = await this.executeAgentPlan(userId, userInput, context, agentPlan);
      
      // Synthesize results from multiple agents
      const orchestratedResponse = await this.synthesizeResults(results, context);
      
      const processingTime = Date.now() - startTime;
      
      // Log orchestration
      await storage.logAgentInteraction({
        userId,
        agentType: 'orchestrator',
        interactionType: 'orchestration',
        input: { userInput, context },
        output: orchestratedResponse,
        confidence: orchestratedResponse.confidence,
        processingTime
      });
      
      return orchestratedResponse;
    } catch (error) {
      console.error("Orchestrator Agent error:", error);
      
      // Fallback to simple student interaction
      const fallbackResponse = await studentInteractionAgent.processInteraction(
        userId,
        userInput,
        { userId, conversationHistory: [] }
      );
      
      return {
        response: fallbackResponse.response,
        actions: [],
        recommendations: [],
        nextSteps: [],
        agentsInvolved: ['student_interaction'],
        confidence: fallbackResponse.confidence
      };
    }
  }

  private async planAgentInvolvement(
    userInput: string,
    context: OrchestrationContext
  ): Promise<{
    agents: string[];
    sequence: string[];
    reasoning: string;
  }> {
    // Analyze user input to determine which agents should be involved
    const inputAnalysis = await this.analyzeUserInput(userInput, context);
    
    const agents: string[] = [];
    const sequence: string[] = [];
    
    // Always include student interaction agent
    agents.push('student_interaction');
    sequence.push('student_interaction');
    
    // Add other agents based on context and input
    if (inputAnalysis.needsRecommendations || context.priority === 'planning') {
      agents.push('recommendation');
      sequence.push('recommendation');
    }
    
    if (inputAnalysis.needsEvaluation || context.sessionType === 'assessment') {
      agents.push('evaluator');
      sequence.push('evaluator');
    }
    
    return {
      agents,
      sequence,
      reasoning: `Based on input analysis: ${JSON.stringify(inputAnalysis)}`
    };
  }

  private async analyzeUserInput(
    userInput: string,
    context: OrchestrationContext
  ): Promise<{
    intent: string;
    needsRecommendations: boolean;
    needsEvaluation: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
    urgency: 'low' | 'medium' | 'high';
  }> {
    // Simple heuristic-based analysis (could be enhanced with ML)
    const input = userInput.toLowerCase();
    
    const needsRecommendations = 
      input.includes('recommend') ||
      input.includes('suggest') ||
      input.includes('what should i') ||
      input.includes('help me choose') ||
      context.priority === 'planning';
    
    const needsEvaluation = 
      input.includes('how am i doing') ||
      input.includes('assess') ||
      input.includes('evaluate') ||
      input.includes('progress') ||
      context.sessionType === 'assessment';
    
    let intent = 'question';
    if (input.includes('practice')) intent = 'practice';
    else if (input.includes('test') || input.includes('quiz')) intent = 'assessment';
    else if (input.includes('review')) intent = 'review';
    else if (input.includes('learn')) intent = 'learning';
    
    const complexity = input.length > 100 ? 'complex' : 
                      input.length > 50 ? 'moderate' : 'simple';
    
    const urgency = input.includes('urgent') || input.includes('quickly') ? 'high' :
                   input.includes('when you can') ? 'low' : 'medium';
    
    return {
      intent,
      needsRecommendations,
      needsEvaluation,
      complexity,
      urgency
    };
  }

  private async executeAgentPlan(
    userId: number,
    userInput: string,
    context: OrchestrationContext,
    plan: any
  ): Promise<{
    studentInteraction?: any;
    recommendations?: any;
    evaluation?: any;
  }> {
    const results: any = {};
    
    // Execute agents in planned sequence
    for (const agentType of plan.sequence) {
      switch (agentType) {
        case 'student_interaction':
          const conversationHistory = await storage.getChatMessages(userId, 'default-conversation');
          results.studentInteraction = await studentInteractionAgent.processInteraction(
            userId,
            userInput,
            { userId, conversationHistory }
          );
          break;
          
        case 'recommendation':
          const recentSessions = await storage.getRecentLearningSessions(userId, 5);
          results.recommendations = await recommendationAgent.generateRecommendations({
            userId,
            recentSessions,
            timeConstraints: { availableTime: context.timeAvailable || 30 }
          });
          break;
          
        case 'evaluator':
          results.evaluation = await evaluatorAgent.evaluatePerformance({
            userId,
            topic: context.currentActivity,
            timeSpent: context.timeAvailable
          });
          break;
      }
    }
    
    return results;
  }

  private async synthesizeResults(
    results: any,
    context: OrchestrationContext
  ): Promise<{
    response: string;
    actions: any[];
    recommendations: any[];
    nextSteps: string[];
    agentsInvolved: string[];
    confidence: number;
  }> {
    // Start with student interaction response
    let response = results.studentInteraction?.response || "I'm here to help with your learning.";
    const actions: any[] = [];
    const recommendations: any[] = [];
    const nextSteps: string[] = [];
    const agentsInvolved: string[] = [];
    
    // Incorporate student interaction results
    if (results.studentInteraction) {
      agentsInvolved.push('student_interaction');
      if (results.studentInteraction.suggestedActions) {
        actions.push(...results.studentInteraction.suggestedActions.map((action: string) => ({
          type: 'action',
          description: action,
          source: 'student_interaction'
        })));
      }
    }
    
    // Incorporate recommendation results
    if (results.recommendations) {
      agentsInvolved.push('recommendation');
      
      // Add recommendations to response if relevant
      if (results.recommendations.resources?.length > 0) {
        response += "\n\nBased on your learning profile, I recommend these resources:";
        results.recommendations.resources.slice(0, 2).forEach((resource: any, index: number) => {
          response += `\n${index + 1}. ${resource.title} - ${resource.reason || 'Matches your preferences'}`;
        });
      }
      
      recommendations.push(...(results.recommendations.resources || []));
      nextSteps.push(...(results.recommendations.activities?.map((activity: any) => activity.description) || []));
    }
    
    // Incorporate evaluation results
    if (results.evaluation) {
      agentsInvolved.push('evaluator');
      
      // Add evaluation insights to response if relevant
      if (results.evaluation.strengths?.length > 0) {
        response += `\n\nYour strengths include: ${results.evaluation.strengths.slice(0, 2).join(', ')}.`;
      }
      
      if (results.evaluation.recommendations?.length > 0) {
        response += `\n\nTo improve further: ${results.evaluation.recommendations[0]}`;
      }
      
      nextSteps.push(...(results.evaluation.nextSteps || []));
    }
    
    // Calculate overall confidence
    const confidences = [
      results.studentInteraction?.confidence || 0,
      results.recommendations?.confidence || 0,
      results.evaluation?.confidence || 0
    ].filter(c => c > 0);
    
    const confidence = confidences.length > 0 
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : 50;
    
    return {
      response,
      actions,
      recommendations,
      nextSteps: [...new Set(nextSteps)], // Remove duplicates
      agentsInvolved,
      confidence
    };
  }

  async planLearningSession(
    userId: number,
    timeAvailable: number,
    goals?: string[]
  ): Promise<{
    sessionPlan: any;
    resources: any[];
    schedule: any[];
    expectedOutcomes: string[];
  }> {
    try {
      // Get recommendations for the session
      const recommendations = await recommendationAgent.generateRecommendations({
        userId,
        timeConstraints: { availableTime: timeAvailable }
      });
      
      // Get current evaluation to inform planning
      const evaluation = await evaluatorAgent.evaluatePerformance({
        userId,
        timeSpent: timeAvailable
      });
      
      // Create optimized session plan
      const sessionPlan = {
        duration: timeAvailable,
        activities: recommendations.activities?.slice(0, 3) || [],
        focus: evaluation.weaknesses?.slice(0, 2) || [],
        goals: goals || ['Continue learning progress']
      };
      
      return {
        sessionPlan,
        resources: recommendations.resources || [],
        schedule: recommendations.schedule || [],
        expectedOutcomes: evaluation.nextSteps?.slice(0, 3) || []
      };
    } catch (error) {
      console.error("Learning session planning error:", error);
      return {
        sessionPlan: { duration: timeAvailable, activities: [], focus: [], goals: [] },
        resources: [],
        schedule: [],
        expectedOutcomes: []
      };
    }
  }
}

export const orchestratorAgent = new OrchestratorAgent();