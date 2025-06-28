import OpenAI from "openai";
import { storage } from "./storage";
import type { UserPersona, Syllabus } from "../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" });

export interface SyllabusGenerationRequest {
  userId: number;
  subject: string;
  goals: string[];
  timeframe: number; // weeks
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  preferences?: {
    contentTypes: string[];
    sessionLength: number; // minutes
    frequency: number; // sessions per week
  };
}

export class SyllabusGenerator {
  async generatePersonalizedSyllabus(
    request: SyllabusGenerationRequest
  ): Promise<{
    syllabus: any;
    reasoning: string;
    confidence: number;
  }> {
    try {
      // Get user persona and learning history
      const userPersona = await storage.getUserPersona(request.userId);
      const learningHistory = await storage.getLearningHistory();
      const userStats = await storage.getUserStats();
      
      // Analyze user's current knowledge level
      const knowledgeAssessment = await this.assessCurrentKnowledge(
        request,
        userPersona,
        learningHistory
      );
      
      // Generate curriculum structure
      const curriculumStructure = await this.generateCurriculumStructure(
        request,
        knowledgeAssessment,
        userPersona
      );
      
      // Create detailed syllabus
      const detailedSyllabus = await this.createDetailedSyllabus(
        request,
        curriculumStructure,
        userPersona
      );
      
      // Generate learning schedule
      const schedule = await this.generateLearningSchedule(
        request,
        detailedSyllabus,
        userPersona
      );
      
      const syllabus = {
        ...detailedSyllabus,
        schedule,
        generatedAt: new Date(),
        userId: request.userId
      };
      
      return {
        syllabus,
        reasoning: `Generated based on ${request.subject} goals, ${request.difficulty} level, and personalized to user's ${userPersona?.learningPreferences || 'general'} preferences.`,
        confidence: 85
      };
    } catch (error) {
      console.error("Syllabus generation error:", error);
      
      // Fallback syllabus
      return {
        syllabus: this.createFallbackSyllabus(request),
        reasoning: "Generated using default template due to processing error.",
        confidence: 30
      };
    }
  }

  private async assessCurrentKnowledge(
    request: SyllabusGenerationRequest,
    userPersona?: UserPersona,
    learningHistory?: any
  ): Promise<{
    currentLevel: string;
    knownConcepts: string[];
    gaps: string[];
    prerequisites: string[];
  }> {
    const prompt = `
      Assess current knowledge level for syllabus generation:
      
      Subject: ${request.subject}
      Target Difficulty: ${request.difficulty}
      User Goals: ${request.goals.join(', ')}
      Learning History: ${learningHistory ? JSON.stringify(learningHistory) : 'No history'}
      User Preferences: ${userPersona ? JSON.stringify(userPersona) : 'Unknown'}
      
      Determine:
      1. currentLevel - Estimated current proficiency level
      2. knownConcepts - Concepts likely already known
      3. gaps - Knowledge gaps to address
      4. prerequisites - Prerequisites needed before starting
      
      Return as JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert educational assessor." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Knowledge assessment error:", error);
      return {
        currentLevel: request.difficulty,
        knownConcepts: [],
        gaps: [],
        prerequisites: []
      };
    }
  }

  private async generateCurriculumStructure(
    request: SyllabusGenerationRequest,
    knowledgeAssessment: any,
    userPersona?: UserPersona
  ): Promise<{
    modules: any[];
    learningPath: string[];
    milestones: any[];
    assessments: any[];
  }> {
    const prompt = `
      Generate curriculum structure for:
      
      Subject: ${request.subject}
      Goals: ${request.goals.join(', ')}
      Timeframe: ${request.timeframe} weeks
      Difficulty: ${request.difficulty}
      Current Level: ${knowledgeAssessment.currentLevel}
      Known Concepts: ${knowledgeAssessment.knownConcepts.join(', ')}
      Knowledge Gaps: ${knowledgeAssessment.gaps.join(', ')}
      User Preferences: ${userPersona?.contentFormat?.join(', ') || 'Mixed'}
      
      Create:
      1. modules - 6-12 learning modules with titles, descriptions, and topics
      2. learningPath - Optimal sequence of modules
      3. milestones - Key checkpoints and achievements
      4. assessments - Assessment points throughout the curriculum
      
      Ensure progression is logical and builds on previous knowledge.
      
      Return as JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert curriculum designer." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Curriculum structure generation error:", error);
      return {
        modules: [],
        learningPath: [],
        milestones: [],
        assessments: []
      };
    }
  }

  private async createDetailedSyllabus(
    request: SyllabusGenerationRequest,
    structure: any,
    userPersona?: UserPersona
  ): Promise<any> {
    const prompt = `
      Create detailed syllabus based on:
      
      Subject: ${request.subject}
      Goals: ${request.goals.join(', ')}
      Timeframe: ${request.timeframe} weeks
      Structure: ${JSON.stringify(structure)}
      User Preferences: ${userPersona ? JSON.stringify(userPersona) : 'Default'}
      
      For each module, include:
      - Learning objectives
      - Key concepts
      - Recommended resources (matching user's preferred formats)
      - Practice activities
      - Time allocation
      - Prerequisites
      - Assessment criteria
      
      Return comprehensive syllabus as JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert syllabus designer creating detailed learning plans." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Detailed syllabus creation error:", error);
      return this.createFallbackSyllabus(request);
    }
  }

  private async generateLearningSchedule(
    request: SyllabusGenerationRequest,
    syllabus: any,
    userPersona?: UserPersona
  ): Promise<any[]> {
    const prompt = `
      Generate learning schedule for:
      
      Timeframe: ${request.timeframe} weeks
      Session Length: ${request.preferences?.sessionLength || 30} minutes
      Frequency: ${request.preferences?.frequency || 3} sessions per week
      Modules: ${syllabus.modules?.length || 0} modules
      User Study Habits: ${userPersona?.studyHabits?.join(', ') || 'Flexible'}
      
      Create weekly schedule with:
      - Module assignments
      - Study sessions
      - Practice time
      - Assessment dates
      - Review periods
      
      Return as array of weekly schedules in JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert learning schedule optimizer." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.schedule || [];
    } catch (error) {
      console.error("Schedule generation error:", error);
      return [];
    }
  }

  private createFallbackSyllabus(request: SyllabusGenerationRequest): any {
    return {
      title: `${request.subject} Learning Plan`,
      description: `A ${request.difficulty} level course in ${request.subject}`,
      subject: request.subject,
      difficulty: request.difficulty,
      estimatedDuration: request.timeframe,
      modules: [
        {
          id: 1,
          title: `Introduction to ${request.subject}`,
          description: "Foundational concepts and overview",
          topics: ["Basics", "Overview", "Key Concepts"],
          estimatedTime: Math.floor(request.timeframe / 4)
        }
      ],
      learningObjectives: request.goals,
      prerequisites: [],
      status: "draft"
    };
  }

  async adaptSyllabus(
    syllabusId: number,
    userId: number,
    performanceData: any,
    newGoals?: string[]
  ): Promise<{
    updatedSyllabus: any;
    changes: string[];
    reasoning: string;
  }> {
    try {
      const currentSyllabus = await storage.getSyllabus(syllabusId);
      const userPersona = await storage.getUserPersona(userId);
      const recentSessions = await storage.getRecentLearningSessions(userId, 10);
      
      const prompt = `
        Adapt existing syllabus based on performance:
        
        Current Syllabus: ${JSON.stringify(currentSyllabus)}
        Performance Data: ${JSON.stringify(performanceData)}
        Recent Sessions: ${recentSessions?.length || 0} sessions
        New Goals: ${newGoals?.join(', ') || 'No changes'}
        User Preferences: ${userPersona ? JSON.stringify(userPersona) : 'Unknown'}
        
        Suggest adaptations:
        1. Module adjustments (difficulty, content, pacing)
        2. Resource changes
        3. Schedule modifications
        4. Additional support areas
        
        Return updated syllabus and list of changes as JSON.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert at adapting learning plans based on student performance." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        updatedSyllabus: result.syllabus || currentSyllabus,
        changes: result.changes || [],
        reasoning: result.reasoning || "Adapted based on performance data"
      };
    } catch (error) {
      console.error("Syllabus adaptation error:", error);
      
      const currentSyllabus = await storage.getSyllabus(syllabusId);
      return {
        updatedSyllabus: currentSyllabus,
        changes: [],
        reasoning: "No adaptations made due to processing error"
      };
    }
  }
}

export const syllabusGenerator = new SyllabusGenerator();