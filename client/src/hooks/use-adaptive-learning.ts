import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UseAdaptiveLearningOptions {
  userId?: number;
}

export function useAdaptiveLearning(options: UseAdaptiveLearningOptions = {}) {
  const { userId } = options;

  // Get personalized recommendations
  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ['/api/recommendations'],
    enabled: !!userId,
  });

  // Get adaptive assessments
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['/api/assessments/suggested'],
    enabled: !!userId,
  });

  // Get learning path
  const { data: learningPath, isLoading: isLoadingLearningPath } = useQuery({
    queryKey: ['/api/learning-path'],
    enabled: !!userId,
  });

  // Start a new assessment
  const startAssessment = useMutation({
    mutationFn: (assessmentType: string) => {
      return apiRequest('POST', '/api/assessments/start', { assessmentType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
    }
  });

  // Submit an assessment answer
  const submitAnswer = useMutation({
    mutationFn: ({ assessmentId, questionId, answer }: { assessmentId: string, questionId: string, answer: string }) => {
      return apiRequest('POST', `/api/assessments/${assessmentId}/answer`, { questionId, answer });
    }
  });

  // Complete an assessment
  const completeAssessment = useMutation({
    mutationFn: (assessmentId: string) => {
      return apiRequest('POST', `/api/assessments/${assessmentId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
    }
  });

  // Start a learning module
  const startModule = useMutation({
    mutationFn: (moduleId: string) => {
      return apiRequest('POST', `/api/modules/${moduleId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-path'] });
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum'] });
    }
  });

  // Complete a learning module
  const completeModule = useMutation({
    mutationFn: (moduleId: string) => {
      return apiRequest('POST', `/api/modules/${moduleId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-path'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum'] });
    }
  });

  // Update user preferences (learning speed, etc.)
  const updatePreferences = useMutation({
    mutationFn: (preferences: any) => {
      return apiRequest('PUT', '/api/user/preferences', preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
    }
  });

  return {
    recommendations,
    assessments,
    learningPath,
    isLoading: isLoadingRecommendations || isLoadingAssessments || isLoadingLearningPath,
    startAssessment,
    submitAnswer,
    completeAssessment,
    startModule,
    completeModule,
    updatePreferences,
  };
}
