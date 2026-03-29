import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage.js";
import type { UserPersona, Syllabus } from "../shared/schema.js";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY || "sk-dummy-key" });

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : {};
}

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

      // Web Search Enrichment (Phase 11)
      if (detailedSyllabus && Array.isArray(detailedSyllabus.modules)) {
        try {
          const { search, SafeSearchType } = await import('duck-duck-scrape');
          for (const mod of detailedSyllabus.modules) {
             const query = `${request.subject} ${mod.title || ''} free course tutorial video`;
             const searchResults = await search(query, { safeSearch: SafeSearchType.OFF });
             
             if (searchResults && searchResults.results && searchResults.results.length > 0) {
               mod.links = searchResults.results.slice(0, 3).map((r: any) => ({
                 title: r.title,
                 url: r.url,
                 description: r.description
               }));
             }
          }
        } catch (e) {
          console.error("Agentic Web Search Failed:", e);
        }
      }
      
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
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        system: "You are an expert educational assessor." + " You must output ONLY valid JSON.",
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0].type === "text" ? response.content[0].text : "{}";
      return extractJson(content);
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
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        system: "You are an expert curriculum designer." + " You must output ONLY valid JSON.",
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0].type === "text" ? response.content[0].text : "{}";
      return extractJson(content);
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
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        system: "You are an expert syllabus designer creating detailed learning plans." + " You must output ONLY valid JSON.",
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0].type === "text" ? response.content[0].text : "{}";
      return extractJson(content);
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
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        system: "You are an expert learning schedule optimizer." + " You must output ONLY valid JSON.",
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0].type === "text" ? response.content[0].text : "{}";
      const result = extractJson(content);
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

      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        system: "You are an expert at adapting learning plans based on student performance." + " You must output ONLY valid JSON.",
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0].type === "text" ? response.content[0].text : "{}";
      const result = extractJson(content);
      
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