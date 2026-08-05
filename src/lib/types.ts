export type Role = "user" | "assistant";

export interface ToolCall {
  id: string;
  label: string;
  runningLabel: string;
  detail: string;
  status: "running" | "done";
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  /** Object URL for image previews; undefined for non-image files. */
  previewUrl?: string;
}

export interface Model {
  id: string;
  name: string;
  description: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  status?: "thinking" | "streaming" | "done" | "error";
  toolCalls?: ToolCall[];
  reasoning?: string;
  reasoningStatus?: "streaming" | "done";
  reasoningSeconds?: number;
}

export type DateGroup = "Today" | "Yesterday" | "Previous 7 Days";

export interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  group: DateGroup;
  messages: Message[];
}
