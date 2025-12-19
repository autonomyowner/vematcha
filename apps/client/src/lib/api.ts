'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown
  ) {
    super(`API Error: ${status}`);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(response.status, data);
  }

  return response.json();
}

// API Types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  tier: 'FREE' | 'PRO';
  createdAt: string;
  updatedAt: string;
  usage: {
    analysesThisMonth: number;
    analysesRemaining: number | null;
  };
}

export interface Analysis {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  inputText: string;
  biases: Array<{ name: string; intensity: number; description: string }> | null;
  patterns: Array<{ name: string; percentage: number }> | null;
  insights: string[] | null;
  emotionalState: { primary: string; secondary?: string; intensity: string } | null;
  processingTime: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DashboardData {
  profile: {
    id: string;
    email: string;
    firstName: string | null;
    tier: 'FREE' | 'PRO';
    memberSince: string;
    completionPercentage: number;
  };
  usage: {
    analysesThisMonth: number;
    analysesRemaining: number | null;
    chatMessagesThisMonth: number;
    chatMessagesRemaining: number | null;
    totalAnalyses: number;
    totalConversationsWithAnalysis: number;
    lastAnalysisDate: string | null;
    lastChatAnalysisDate: string | null;
  };
  stats: {
    topBiases: Array<{ name: string; avgIntensity: number; count: number }>;
    patterns: Array<{ name: string; avgPercentage: number }>;
    emotionalTrends: Array<{ emotion: string; count: number; avgIntensity: number }>;
  };
  recentInsights: string[];
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  analysisLimit: number | null;
  features: Array<{ name: string; included: boolean }>;
  popular?: boolean;
}

// Chat Types
export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface AnalysisData {
  emotionalState: {
    primary: string;
    secondary?: string;
    intensity: 'low' | 'moderate' | 'high';
  };
  biases: Array<{
    name: string;
    confidence: number;
    description: string;
  }>;
  patterns: Array<{
    name: string;
    percentage: number;
  }>;
  insights: string[];
}

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  // Analysis data
  emotionalState?: AnalysisData['emotionalState'];
  biases?: AnalysisData['biases'];
  patterns?: AnalysisData['patterns'];
  insights?: string[];
  analysisUpdatedAt?: string;
}

export interface SendMessageResponse {
  conversationId: string;
  message: Message;
  analysis: AnalysisData | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// EMDR Flash Technique Types
export type EmdrPhase =
  | 'PREPARATION'
  | 'TRAUMA_RECALL'
  | 'BILATERAL_START'
  | 'POSITIVE_RESOURCE'
  | 'BILATERAL_POSITIVE'
  | 'INTEGRATION'
  | 'COMPLETED';

export const EMDR_PHASE_LABELS: Record<EmdrPhase, string> = {
  PREPARATION: 'Preparation',
  TRAUMA_RECALL: 'Recall',
  BILATERAL_START: 'Bilateral',
  POSITIVE_RESOURCE: 'Positive',
  BILATERAL_POSITIVE: 'Integration',
  INTEGRATION: 'Closing',
  COMPLETED: 'Complete',
};

export const EMDR_PHASES_ORDER: EmdrPhase[] = [
  'PREPARATION',
  'TRAUMA_RECALL',
  'BILATERAL_START',
  'POSITIVE_RESOURCE',
  'BILATERAL_POSITIVE',
  'INTEGRATION',
  'COMPLETED',
];

export interface EmdrSession {
  id: string;
  conversationId: string;
  currentPhase: EmdrPhase;
  blinkIntervalMin: number;
  blinkIntervalMax: number;
  blinksPerSet: number;
  tapIntervalMs: number;
  distressStart: number | null;
  distressEnd: number | null;
  setsCompleted: number;
  startedAt: string;
  completedAt: string | null;
}

export interface EmdrGuidance {
  shouldShowBilateral: boolean;
  shouldShowBlinks: boolean;
  blinkCount: number;
  suggestedNextPhase: EmdrPhase | null;
  groundingNeeded: boolean;
}

export interface EmdrMessageResponse {
  conversationId: string;
  message: {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    createdAt: string;
  };
  session: EmdrSession;
  guidance: EmdrGuidance;
}

// API Functions
export const api = {
  // User
  getMe: (token: string) =>
    apiClient<UserProfile>('/users/me', { token }),

  updateMe: (token: string, data: { firstName?: string }) =>
    apiClient<UserProfile>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  // Dashboard
  getDashboard: (token: string) =>
    apiClient<DashboardData>('/dashboard', { token }),

  // Analyses
  createAnalysis: (token: string, inputText: string) =>
    apiClient<Analysis>('/analyses', {
      method: 'POST',
      body: JSON.stringify({ inputText }),
      token,
    }),

  getAnalyses: (token: string, page = 1, limit = 10) =>
    apiClient<{ data: Analysis[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/analyses?page=${page}&limit=${limit}`,
      { token }
    ),

  getAnalysis: (token: string, id: string) =>
    apiClient<Analysis>(`/analyses/${id}`, { token }),

  // Plans
  getPlans: () =>
    apiClient<{ plans: Plan[]; currency: string; vatRate: number }>('/plans'),

  // Chat
  getConversations: (token: string, page = 1, limit = 20) =>
    apiClient<{
      conversations: Array<Conversation & { messages: Message[] }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/chat/conversations?page=${page}&limit=${limit}`, { token }),

  getConversation: (token: string, id: string) =>
    apiClient<Conversation & { messages: Message[] }>(`/chat/conversations/${id}`, { token }),

  createConversation: (token: string, title?: string) =>
    apiClient<Conversation>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
      token,
    }),

  deleteConversation: (token: string, id: string) =>
    apiClient<{ success: boolean }>(`/chat/conversations/${id}`, {
      method: 'DELETE',
      token,
    }),

  updateConversation: (token: string, id: string, title: string) =>
    apiClient<Conversation>(`/chat/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
      token,
    }),

  sendMessage: (token: string, message: string, conversationId?: string) =>
    apiClient<SendMessageResponse>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
      token,
    }),

  // EMDR Flash Technique
  startEmdrSession: (token: string) =>
    apiClient<EmdrMessageResponse>('/chat/emdr/start', {
      method: 'POST',
      token,
    }),

  sendEmdrMessage: (token: string, conversationId: string, message: string) =>
    apiClient<EmdrMessageResponse>('/chat/emdr/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message }),
      token,
    }),

  getEmdrSession: (token: string, conversationId: string) =>
    apiClient<{
      session: EmdrSession;
      conversation: {
        id: string;
        title: string;
        messages: Message[];
        createdAt: string;
      };
    }>(`/chat/emdr/${conversationId}`, { token }),

  updateEmdrPhase: (token: string, conversationId: string, phase: EmdrPhase, distressLevel?: number) =>
    apiClient<EmdrSession>(`/chat/emdr/${conversationId}/phase`, {
      method: 'PATCH',
      body: JSON.stringify({ phase, distressLevel }),
      token,
    }),

  completeEmdrSession: (token: string, conversationId: string, distressEnd: number) =>
    apiClient<EmdrSession>(`/chat/emdr/${conversationId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ distressEnd }),
      token,
    }),

  // Text-to-Speech (ElevenLabs)
  textToSpeech: async (token: string, text: string): Promise<ArrayBuffer> => {
    const response = await fetch(`${API_URL}/tts/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.json().catch(() => ({})));
    }

    return response.arrayBuffer();
  },

  getTtsStatus: (token: string) =>
    apiClient<{ configured: boolean; cacheSize: number }>('/tts/status', { token }),

  preloadTtsPhrases: (token: string) =>
    apiClient<{ success: boolean; cacheSize: number }>('/tts/preload', {
      method: 'POST',
      token,
    }),

  // Voice Therapy Sessions
  startVoiceSession: (token: string, data: { sessionType: 'general-therapy' | 'flash-technique' | 'crisis-support'; createNewConversation?: boolean; conversationId?: string }) =>
    apiClient<{
      sessionId: string;
      webCallUrl: string;
      vapiPublicKey: string;
      callId: string;
      conversationId?: string;
    }>('/voice/start', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getVoiceSession: (token: string, sessionId: string) =>
    apiClient<any>(`/voice/sessions/${sessionId}`, { token }),

  endVoiceSession: (token: string, sessionId: string) =>
    apiClient<{ session: any; transcript: string; duration: number }>(`/voice/sessions/${sessionId}/end`, {
      method: 'PATCH',
      token,
    }),

  getVoiceSessionHistory: (token: string, page = 1, limit = 20) =>
    apiClient<{
      sessions: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/voice/sessions?page=${page}&limit=${limit}`, { token }),
};
