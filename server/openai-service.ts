import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" });

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
      - Completed modules: ${userStats.completedModules} out of ${userStats.totalModules}
      - Focus areas: ${userStats.focusAreas.map(area => `${area.name} (${area.percentage}%)`).join(', ')}
      
      Recent learning history:
      - Completed modules: ${learningHistory.completedModules.map(m => m.title).join(', ')}
      - In-progress modules: ${learningHistory.inProgressModules.map(m => m.title).join(', ')}
      - Recent assessment results: ${learningHistory.assessmentResults.map(a => `${a.type} (${a.score}%)`).join(', ')}
      
      For each recommendation, provide:
      1. title - A concise title for the recommended learning resource
      2. description - A brief description explaining why this is recommended
      3. match - A match percentage between 80-99% showing how well this matches the student
      4. icon - A single material icon name representing the subject (e.g., "code", "science", "security")
      5. iconBg - A background color class for the icon (e.g., "bg-primary/10", "bg-secondary/10", "bg-accent/10")
      6. topics - 2-3 relevant topic tags
      7. estimatedTime - Estimated time to complete (e.g., "8 hours", "10 hours")
      
      Provide the response as a JSON array with these fields. Keep recommendations realistic and educational.
    `;

    // Call OpenAI API for recommendations
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an educational AI that provides personalized learning recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.recommendations || [];
  } catch (error) {
    console.error("Error generating recommendations:", error);
    
    // Fallback recommendations if OpenAI API call fails
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
      
      Provide the response as a JSON array with these fields.
    `;

    // Call OpenAI API for adaptive testing suggestions
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an educational AI that provides adaptive assessment recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.assessments || [];
  } catch (error) {
    console.error("Error generating adaptive testing recommendations:", error);
    
    // Fallback assessment suggestions if OpenAI API call fails
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

// Generate skill assessment and recommendations
// Chatbot service using GPT-4o
export async function generateChatbotResponse(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI learning assistant for IntuitionAI, an adaptive learning platform. 
          Your purpose is to help users navigate their personalized learning journey, suggest resources, 
          answer questions about educational content, and provide guidance on their learning path.
          Keep responses helpful, encouraging, and focused on the user's educational goals.
          When appropriate, suggest assessments, learning modules, or resources that might benefit them.
          Always maintain a supportive, patient tone. Your goal is to empower the user in their learning journey.`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
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
      
      Format the response as JSON with these fields.
    `;

    // Call OpenAI API for skill assessment
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an educational AI that provides detailed skill assessments." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error generating skill assessment:", error);
    
    // Fallback skill assessment if OpenAI API call fails
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
