import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || "sk-dummy-key",
});

const MODEL = "claude-3-haiku-20240307";

interface UserData {
  id: number;
  name: string;
  level: string;
  interests: string[];
  strengths: string[];
  weaknesses: string[];
}

interface UserStats {
  masteryScore: number;
  streak: number;
  completedModules: number;
  totalModules: number;
  focusAreas: { name: string; percentage: number }[];
}

interface LearningHistory {
  completedModules: {
    id: string;
    title: string;
    topics: string[];
    completedAt: string;
    score: number;
  }[];
  inProgressModules: {
    id: string;
    title: string;
    topics: string[];
    progress: number;
  }[];
  assessmentResults: {
    id: string;
    type: string;
    score: number;
    completedAt: string;
    strengths: string[];
    weaknesses: string[];
  }[];
}

interface AssessmentResult {
  id: string;
  title: string;
  score: number;
  date: string;
  topics: { name: string; score: number }[];
}

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : {};
}

// Generate personalized learning recommendations
export async function generateRecommendations({ 
  userData, 
  userStats, 
  learningHistory 
}: { 
  userData: UserData; 
  userStats: UserStats; 
  learningHistory: LearningHistory;
}) {
  try {
    const prompt = `
      Generate 3 personalized learning recommendations for a student based on their profile.
      Student profile:
      - Name: ${userData?.name || 'Anonymous'}
      - Level: ${userData?.level || 'Beginner'}
      - Interests: ${userData?.interests?.join(', ') || 'Not specified'}
      - Strengths: ${userData?.strengths?.join(', ') || 'Not specified'}
      - Weaknesses: ${userData?.weaknesses?.join(', ') || 'Not specified'}
      - Current mastery score: ${userStats?.masteryScore || 0}/100
      - Completed modules: ${userStats?.completedModules || 0} out of ${userStats?.totalModules || 1}
      - Focus areas: ${userStats?.focusAreas?.map(area => `${area.name} (${area.percentage}%)`).join(', ') || 'None'}
      
      Recent learning history:
      - Completed modules: ${learningHistory?.completedModules?.map(m => m.title).join(', ') || 'None'}
      - In-progress modules: ${learningHistory?.inProgressModules?.map(m => m.title).join(', ') || 'None'}
      - Recent assessment results: ${learningHistory?.assessmentResults?.map(a => `${a.type} (${a.score}%)`).join(', ') || 'None'}
      
      For each recommendation, provide:
      1. title - A concise title for the recommended learning resource
      2. description - A brief description explaining why this is recommended
      3. match - A match percentage between 80-99% showing how well this matches the student
      4. icon - A single material icon name representing the subject (e.g., "code", "science", "security")
      5. iconBg - A background color class for the icon (e.g., "bg-primary/10", "bg-secondary/10", "bg-accent/10")
      6. topics - 2-3 relevant topic tags
      7. estimatedTime - Estimated time to complete (e.g., "8 hours", "10 hours")
      
      Respond ONLY with a valid JSON object containing a "recommendations" array. No conversational text.
    `;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: "You are an educational AI that provides personalized learning recommendations. You must output ONLY valid JSON.",
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "{}";
    const result = extractJson(content);
    return result.recommendations || [];
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [
      {
        id: "rec1",
        title: "System Design Fundamentals",
        description: "Learn how to design scalable and reliable systems for various applications",
        match: 98,
        icon: "code",
        iconBg: "bg-secondary/10",
        topics: ["Architecture", "Scalability"],
        estimatedTime: "8 hours"
      },
      {
        id: "rec2",
        title: "Deep Learning Applications",
        description: "Explore practical applications of deep learning in various domains",
        match: 95,
        icon: "science",
        iconBg: "bg-primary/10",
        topics: ["Neural Networks", "TensorFlow"],
        estimatedTime: "12 hours"
      },
      {
        id: "rec3",
        title: "Cybersecurity Essentials",
        description: "Learn key principles of cybersecurity and threat prevention",
        match: 92,
        icon: "security",
        iconBg: "bg-accent/10",
        topics: ["Network Security", "Encryption"],
        estimatedTime: "10 hours"
      }
    ];
  }
}

// Generate adaptive testing recommendations
export async function generateAdaptiveTesting({ 
  userData, 
  userStats, 
  learningHistory 
}: { 
  userData: UserData; 
  userStats: UserStats; 
  learningHistory: LearningHistory;
}) {
  try {
    const prompt = `
      Generate 2 personalized assessment recommendations for a student based on their profile.
      Student profile:
      - Name: ${userData?.name || 'Anonymous'}
      - Level: ${userData?.level || 'Beginner'}
      - Strengths: ${userData?.strengths?.join(', ') || 'Not specified'}
      - Weaknesses: ${userData?.weaknesses?.join(', ') || 'Not specified'}
      - Current mastery score: ${userStats?.masteryScore || 0}/100
      - Focus areas: ${userStats?.focusAreas?.map(area => `${area.name} (${area.percentage}%)`).join(', ') || 'Not specified'}
      
      Recent learning activity:
      - Completed modules: ${learningHistory?.completedModules?.map(m => m.title).join(', ') || 'None'}
      - In-progress modules: ${learningHistory?.inProgressModules?.map(m => m.title).join(', ') || 'None'}
      
      For each assessment recommendation, provide:
      1. id - A unique identifier
      2. title - The subject area for assessment
      3. type - Either "recommended", "review", or "challenge"
      4. typeLabel - A user-friendly label for the type ("Recommended", "Review Needed", or "Challenge")
      5. description - Reason for this assessment recommendation
      6. duration - Estimated duration (e.g., "20 minutes")
      
      Respond ONLY with a valid JSON object containing an "assessments" array. No conversational text.
    `;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: "You are an educational AI that provides adaptive assessment recommendations. You must output ONLY valid JSON.",
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "{}";
    const result = extractJson(content);
    return result.assessments || [];
  } catch (error) {
    console.error("Error generating adaptive testing recommendations:", error);
    return [
      {
        id: "assessment1",
        title: "Data Structures",
        type: "recommended",
        typeLabel: "Recommended",
        description: "Based on your recent learning activity",
        duration: "20 minutes"
      },
      {
        id: "assessment2",
        title: "Algorithms",
        type: "review",
        typeLabel: "Review Needed",
        description: "Based on your previous assessment results",
        duration: "25 minutes"
      }
    ];
  }
}

// Chatbot service using Claude
export async function generateChatbotResponse(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<{ text: string, toolCalls?: any[] }> {
  try {
    const systemPrompt = messages.find(m => m.role === 'system')?.content || `You are an AI learning assistant for IntuitionAI, an adaptive learning platform. 
          Your purpose is to help users navigate their personalized learning journey, suggest resources, 
          answer questions about educational content, and provide guidance on their learning path.
          Keep responses helpful, encouraging, and focused on the user's educational goals.
          When the user asks to learn a new subject, create a curriculum, or generate a syllabus, ALWAYS use the 'create_syllabus' tool to fulfill their request.
          Always maintain a supportive, patient tone. Your goal is to empower the user in their learning journey.`;

    const validMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    if (validMessages.length === 0) {
      validMessages.push({ role: 'user', content: "Hello!" });
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      system: systemPrompt,
      messages: validMessages,
      max_tokens: 500,
      temperature: 0.7,
      tools: [
        {
          name: "create_syllabus",
          description: "Generate a personalized learning syllabus for the user based on their stated goals and subject. Call this when the user explicitly asks to learn a new topic, build a curriculum, or create a syllabus.",
          input_schema: {
            type: "object",
            properties: {
              subject: { type: "string", description: "The core subject to learn (e.g., 'Machine Learning')" },
              goals: { 
                type: "array", 
                items: { type: "string" }, 
                description: "A list of 2-4 specific learning goals based on the user's request" 
              },
              timeframe: { type: "integer", description: "The expected timeframe in weeks (default to 4 if unspecified)" },
              difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"], description: "The difficulty level based on user's current knowledge (default 'beginner')" }
            },
            required: ["subject", "goals"]
          }
        }
      ]
    });

    let textResponse = "";
    const toolCalls = [];

    for (const block of response.content) {
      if (block.type === "text") {
        textResponse += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          name: block.name,
          input: block.input
        });
        if (!textResponse) {
          textResponse = `I'll be happy to help you with that! I'm creating a comprehensive ${block.input.timeframe || 4}-week syllabus for ${block.input.subject} right now.`;
        }
      }
    }

    if (!textResponse && toolCalls.length === 0) {
      textResponse = "I'm sorry, I couldn't generate a response.";
    }

    return { text: textResponse, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    throw error;
  }
}

export async function generateSkillAssessment({ 
  userData, 
  learningHistory, 
  assessmentResults 
}: { 
  userData: UserData; 
  learningHistory: LearningHistory; 
  assessmentResults: AssessmentResult[];
}) {
  try {
    const prompt = `
      Generate a comprehensive skill proficiency assessment for a student based on their learning history and assessment results.
      
      Student profile:
      - Name: ${userData?.name || 'Anonymous'}
      - Level: ${userData?.level || 'Beginner'}
      - Strengths: ${userData?.strengths?.join(', ') || 'Not specified'}
      - Weaknesses: ${userData?.weaknesses?.join(', ') || 'Not specified'}
      
      Learning history:
      - Completed modules: ${learningHistory?.completedModules?.map(m => `${m.title} (${m.score}%)`).join(', ') || 'None'}
      - Recent assessments: ${assessmentResults?.map(a => `${a.title} (${a.score}%)`).join(', ') || 'None'}
      
      Provide a skill assessment with the following:
      
      1. radar - Data for a radar chart showing skill proficiency:
         - labels: Array of 5 skill areas relevant to the student's profile
         - current: Array of 5 scores (0-100) representing current proficiency
         - average: Array of 5 scores (0-100) representing average learner proficiency
      
      2. breakdown - Detailed breakdown of each skill:
         - Array of objects with "skill" name and "score" (0-100)
      
      3. recommendation - A personalized recommendation for improving skills
      
      Respond ONLY with a valid JSON object matching this schema. No conversational text.
    `;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: "You are an educational AI that provides detailed skill assessments. You must output ONLY valid JSON.",
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "{}";
    return extractJson(content);
  } catch (error) {
    console.error("Error generating skill assessment:", error);
    return {
      radar: {
        labels: ["Algorithms", "Data Structures", "Machine Learning", "System Design", "Database Systems"],
        current: [85, 72, 90, 65, 78],
        average: [65, 68, 60, 70, 60]
      },
      breakdown: [
        { skill: "Algorithms", score: 85 },
        { skill: "Data Structures", score: 72 },
        { skill: "Machine Learning", score: 90 },
        { skill: "System Design", score: 65 },
        { skill: "Database Systems", score: 78 }
      ],
      recommendation: "Focus on improving System Design skills to enhance your overall profile."
    };
  }
}

// User Persona Retrieval
export async function analyzeUserPersona(chatMessages: {
  role: string;
  content: string;
  timestamp: Date;
}[]) {
  try {
    const conversationHistory = chatMessages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const prompt = `
      Analyze the following conversation history between a user and the learning assistant.
      Extract user preferences, learning patterns, and cognitive profile.
      
      Conversation history:
      ${conversationHistory}
      
      Based on this conversation, provide:
      
      1. contentFormat - An array of the user's preferred content formats (options: "video", "text", "interactive", "audio"). Limit to 1-3 formats.
      2. studyHabits - An array describing study habits. Limit to 2-4 habits.
      3. currentWeaknesses - An array identifying specific areas the user struggles with. Limit to 1-3 weaknesses.
      4. learningPreferences - The primary learning preference: "visual", "auditory", "reading/writing", or "kinesthetic".
      5. analysis - A brief paragraph summarizing key insights about this user's learning preferences.
      
      Respond ONLY with a valid JSON object matching this schema. No conversational text.
    `;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: "You are an educational AI that specializes in analyzing conversation data to extract learning preferences. You must output ONLY valid JSON.",
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "{}";
    return extractJson(content);
  } catch (error) {
    console.error("Error analyzing user persona:", error);
    throw error;
  }
}