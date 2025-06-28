import OpenAI from "openai";
import { storage } from "../storage";
import type { ChatMessage, InsertAgentInteraction } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" });

export interface StudentInteractionContext {
  userId: number;
  conversationHistory: ChatMessage[];
  currentTopic?: string;
  learningGoals?: string[];
  recentActivity?: any[];
}

export class StudentInteractionAgent {
  async processInteraction(
    userId: number,
    message: string,
    context: StudentInteractionContext
  ): Promise<{
    response: string;
    extractedPreferences?: any;
    suggestedActions?: string[];
    confidence: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Get user persona for context
      const userPersona = await storage.getUserPersona(userId);
      const userStats = await storage.getUserStats();
      
      // Analyze the message for learning preferences and intent
      const analysis = await this.analyzeMessage(message, context, userPersona);
      
      // Generate contextual response
      const response = await this.generateResponse(message, context, analysis);
      
      // Extract any new preferences or insights
      const extractedPreferences = await this.extractPreferences(message, context);
      
      // Suggest follow-up actions
      const suggestedActions = await this.suggestActions(analysis, context);
      
      const processingTime = Date.now() - startTime;
      
      // Log the interaction
      await storage.logAgentInteraction({
        userId,
        agentType: 'student_interaction',
        interactionType: 'query',
        input: { message, context: { currentTopic: context.currentTopic } },
        output: { response, extractedPreferences, suggestedActions },
        confidence: analysis.confidence,
        processingTime
      });
      
      return {
        response,
        extractedPreferences,
        suggestedActions,
        confidence: analysis.confidence
      };
    } catch (error) {
      console.error("Student Interaction Agent error:", error);
      
      // Fallback response
      return {
        response: "I understand you're looking for help with your learning. Could you tell me more about what specific topic or concept you'd like to explore?",
        confidence: 50
      };
    }
  }

  private async analyzeMessage(
    message: string,
    context: StudentInteractionContext,
    userPersona?: any
  ): Promise<{
    intent: string;
    topic?: string;
    difficulty?: string;
    preferences?: any;
    confidence: number;
  }> {
    const prompt = `
      Analyze this student message for learning intent, topic, and preferences.
      
      Message: "${message}"
      
      Context:
      - Current topic: ${context.currentTopic || 'None'}
      - Learning goals: ${context.learningGoals?.join(', ') || 'None specified'}
      - User preferences: ${userPersona ? JSON.stringify(userPersona) : 'Unknown'}
      
      Identify:
      1. intent - What does the student want? (question, clarification, practice, assessment, etc.)
      2. topic - What subject/topic are they asking about?
      3. difficulty - What level of complexity? (beginner, intermediate, advanced)
      4. preferences - Any learning preferences mentioned? (format, pace, style)
      5. confidence - How confident are you in this analysis? (0-100)
      
      Respond in JSON format.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert at analyzing student learning interactions." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Message analysis error:", error);
      return {
        intent: "question",
        confidence: 30
      };
    }
  }

  private async generateResponse(
    message: string,
    context: StudentInteractionContext,
    analysis: any
  ): Promise<string> {
    const prompt = `
      You are an intelligent learning assistant. Generate a helpful, encouraging response to this student.
      
      Student message: "${message}"
      
      Analysis:
      - Intent: ${analysis.intent}
      - Topic: ${analysis.topic || 'General'}
      - Difficulty: ${analysis.difficulty || 'Unknown'}
      
      Context:
      - Current topic: ${context.currentTopic || 'None'}
      - Learning goals: ${context.learningGoals?.join(', ') || 'None specified'}
      
      Guidelines:
      - Be encouraging and supportive
      - Provide specific, actionable guidance
      - Ask clarifying questions when needed
      - Suggest resources or next steps
      - Keep responses concise but helpful
      - Adapt to the student's apparent level and preferences
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a supportive, intelligent learning assistant focused on helping students achieve their learning goals." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || "I'm here to help with your learning. Could you tell me more about what you'd like to explore?";
    } catch (error) {
      console.error("Response generation error:", error);
      return "I'm here to help with your learning. Could you tell me more about what you'd like to explore?";
    }
  }

  private async extractPreferences(
    message: string,
    context: StudentInteractionContext
  ): Promise<any> {
    const prompt = `
      Extract any learning preferences mentioned in this message:
      "${message}"
      
      Look for mentions of:
      - Content format preferences (video, text, interactive, audio)
      - Study habits (time of day, session length, break frequency)
      - Difficulty preferences (challenging, step-by-step, review)
      - Interaction preferences (examples, practice, theory)
      
      Return as JSON with extracted preferences, or empty object if none found.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Extract learning preferences from student messages." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Preference extraction error:", error);
      return {};
    }
  }

  private async suggestActions(
    analysis: any,
    context: StudentInteractionContext
  ): Promise<string[]> {
    const actions: string[] = [];
    
    // Suggest actions based on intent and context
    switch (analysis.intent) {
      case 'question':
        actions.push('Provide detailed explanation');
        if (analysis.topic) {
          actions.push(`Find resources about ${analysis.topic}`);
          actions.push(`Suggest practice exercises for ${analysis.topic}`);
        }
        break;
        
      case 'practice':
        actions.push('Generate practice problems');
        actions.push('Create interactive exercises');
        break;
        
      case 'assessment':
        actions.push('Recommend assessment');
        actions.push('Schedule evaluation session');
        break;
        
      case 'clarification':
        actions.push('Provide examples');
        actions.push('Break down concept into steps');
        break;
        
      default:
        actions.push('Continue conversation');
        actions.push('Ask clarifying questions');
    }
    
    return actions;
  }
}

export const studentInteractionAgent = new StudentInteractionAgent();