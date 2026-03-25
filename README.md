<div align="center">
  <img src="./generated-icon.png" alt="IntuitionAI Logo" width="150"/>
  <h1>IntuitionAI</h1>
  <p><strong>Revolutionizing Education with Adaptive Learning Companions</strong></p>
  
  <br/>
  
  <a href="https://www.youtube.com/watch?v=Jxtuq2Zyqb4" target="_blank">
    <img src="https://img.youtube.com/vi/Jxtuq2Zyqb4/maxresdefault.jpg" alt="Watch the IntuitionAI Pitch Video" width="600" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5);"/>
  </a>
  
  <p><em>Click the image above to watch the pitch video on YouTube</em></p>
</div>

---

## 🛑 The Problem: Is "One-Size-Fits-All" Working?
Traditional classrooms move at one fixed speed. While some students are left struggling to keep up, others sit bored waiting to be challenged. Nearly 50% of students in large introductory college courses withdraw, struggle, or fail simply because the system isn't adaptive enough to meet them where they are in their progress.

Every student has a different learning style, attention span, and unique strengths. A static education system creates a mismatch that leaves massive human potential untapped.

## ✨ The Solution: IntuitionAI
**IntuitionAI is not just a study tool; it's a completely adaptive, multi-agent learning ecosystem.** 
We propose that every student should have their own dynamically adjusting syllabus and evaluation criteria designed exclusively with *them* in mind. By leveraging advanced AI, we build an intelligent companion that perceives how a student learns and continuously adapts the coursework to maximize their learning potential.

### 🧠 Core Philosophy
- **Dynamic Personas**: We track learning styles (visual, audio, hands-on), pace, strengths, and weaknesses to build a unique profile.
- **Adaptive Coursework**: As students engage with the material, the syllabus evolves. Difficulty levels automatically adjust to ensure the student is always in the optimal "growth zone".
- **Continuous Feedback Loop**: We move away from static, punishing exams. Instead, our Evaluation Agent intuitively measures retention and gently guides the student through harder or easier questions as needed.

---

## 🤖 The Multi-Agent Architecture
IntuitionAI is powered by a network of intelligent agents working in harmony behind the scenes:

1. **Student Interaction Agent**: The main frontend chatbot that communicates directly with the student, providing explanations and guidance.
2. **Recommendation Agent**: Analyzes the student's chats and behaviors to construct and update their deep `User Persona` database.
3. **Orchestrator Agent**: The brain of the operation. It pulls from the holistic `Knowledge Bank` and continuously weaves together a highly personalized syllabus and set of learning goals aligned with the student's persona.
4. **Evaluator Agent**: Triggered at key milestones. It subtly evaluates the student's knowledge against their goals, dynamically increasing or decreasing question difficulty. It then feeds this performance data back into the Persona, prompting the Orchestrator to readjust the syllabus.

---

## 🚀 Future Scope
- **Moving Beyond Traditional Testing**: Evolving the evaluation system to completely eliminate traditional "test anxiety" by assessing understanding through natural conversation and practical application.
- **Career & Academic Matching**: Using the deeply mapped Student Profiles to match learners with relevant future career paths, specialized jobs, or research professors that perfectly align with their cognitive strengths.

---

## 💻 Technical Stack
- **Frontend**: React, TailwindCSS, Vite (Designed to be sleek, fluid, and minimal but data-dense)
- **Backend**: Node.js, Express
- **Database**: Local SQLite, Drizzle ORM
- **AI Integration**: Anthropic Claude 3 Haiku API (`@anthropic-ai/sdk`)

## 🛠️ Local Development Setup

To run IntuitionAI locally, follow these steps:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize & Seed the Database**
   Generate the SQLite schema and seed it with initial modules and resources:
   ```bash
   npm run db:push
   npx tsx server/seed.ts
   ```

3. **Set your AI API Key**
   IntuitionAI requires an Anthropic Claude API key to power its agents:
   ```bash
   export CLAUDE_API_KEY="sk-your-claude-api-key"
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available on `http://localhost:5000`.
