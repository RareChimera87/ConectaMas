// types.ts
export interface CreateConversationRequest {
  student_id: string;
  title?: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  message: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  student_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  created_at: string;
}