import { db } from "./db.js";
import { modules, resources, assessments } from "../shared/schema.js";

async function seed() {
  console.log("Seeding database...");

  // Seed Modules
  const initialModules = [
    {
      id: "mod1",
      title: "Introduction to Machine Learning",
      description: "Fundamental concepts of ML algorithms and applications",
      icon: "smart_toy",
      topics: ["Supervised Learning", "Neural Networks", "Model Evaluation"],
      difficulty: 1,
      estimatedTime: 120,
      prerequisiteIds: []
    },
    {
      id: "mod2",
      title: "Philosophy of Mind",
      description: "Explorations of consciousness and cognitive theories",
      icon: "psychology",
      topics: ["Consciousness", "Dualism", "Embodied Cognition"],
      difficulty: 2,
      estimatedTime: 150,
      prerequisiteIds: []
    },
    {
      id: "mod3",
      title: "Probabilistic Reasoning",
      description: "Statistical approaches to causality and inference",
      icon: "functions",
      topics: ["Bayesian Networks", "Causal Inference", "Probability Theory"],
      difficulty: 3,
      estimatedTime: 180,
      prerequisiteIds: ["mod1"]
    },
    {
      id: "mod4",
      title: "Perception Systems",
      description: "How humans and machines perceive and interpret the world",
      icon: "visibility",
      topics: ["Visual Processing", "Auditory Systems", "Sensory Integration"],
      difficulty: 2,
      estimatedTime: 140,
      prerequisiteIds: []
    },
    {
      id: "mod5",
      title: "Cognitive Systems Architecture",
      description: "Understanding integrated cognitive frameworks",
      icon: "psychology_alt",
      topics: ["Memory Systems", "Attention Mechanisms", "Decision Making"],
      difficulty: 3,
      estimatedTime: 200,
      prerequisiteIds: ["mod2", "mod4"]
    },
    {
      id: "mod6",
      title: "Quantum Physics Fundamentals",
      description: "Core principles of quantum mechanics and their implications",
      icon: "scatter_plot",
      topics: ["Quantum Entanglement", "Wave-Particle Duality", "Uncertainty Principle"],
      difficulty: 4,
      estimatedTime: 240,
      prerequisiteIds: []
    }
  ];

  for (const mod of initialModules) {
    await db.insert(modules).values(mod).onConflictDoNothing();
  }
  console.log("Modules seeded.");

  // Seed Resources
  const initialResources = [
    {
      id: "res1",
      title: "Deep Learning Architecture Explained",
      description: "Comprehensive guide to neural network architectures",
      type: "article",
      tags: ["Machine Learning", "Deep Learning", "Neural Networks"],
      duration: "20 mins",
    },
    {
      id: "res2",
      title: "Philosophical Implications of Consciousness",
      description: "Modern perspectives on the hard problem of consciousness",
      type: "article",
      tags: ["Philosophy", "Consciousness", "Mind"],
      duration: "25 mins",
    },
    {
      id: "res3",
      title: "Causal Inference in Machine Learning",
      description: "How causality affects model interpretability",
      type: "article",
      tags: ["Probabilistic Reasoning", "Causality", "Machine Learning"],
      duration: "18 mins",
    },
    {
      id: "res4",
      title: "Visual System Architecture",
      description: "From retina to visual cortex: How vision works",
      type: "video",
      tags: ["Perception", "Neuroscience", "Vision"],
      duration: "32 mins",
    },
    {
      id: "res5",
      title: "Quantum Computing Explained",
      description: "Fundamentals of quantum computing for beginners",
      type: "video",
      tags: ["Quantum Physics", "Computing", "Qubits"],
      duration: "45 mins",
    }
  ];

  for (const res of initialResources) {
    await db.insert(resources).values(res).onConflictDoNothing();
  }
  console.log("Resources seeded.");

  console.log("Database seeded successfully.");
}

seed().catch(console.error);
