export type UUID = string;

export interface User {
  id: UUID;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  school_id?: UUID;
  xp: number;
  xp_total: number;
  coins_balance: number;  // Hinzugefügt
  level: number;
}

export interface Quest {
  id: UUID;
  title: string;
  description: string;
  content?: string;
  image?: string;
  xp_reward: number;
  required_level: number;
  status: 'draft' | 'published';
}

export interface QuestStep {
  id: UUID;
  quest_id: UUID;
  title: string;
  description: string;
  content?: string;
  order: number;
  xp_reward: number;
  external_id?: string;
  provider_id?: UUID;
}

export interface UserProgress {
  id: UUID;
  user_id: UUID;
  quest_step_id: UUID;
  status: 'completed' | 'failed';
  date_created: string;
  token_fragment?: string;
}

export interface School {
  id: UUID;
  name: string;
  luanti_world_id?: UUID;
}

export interface LuantiWorld {
  id: UUID;
  name: string;
  server_address: string;
  server_port: number;
}

export interface ClaimableToken {
  id: UUID;
  token: string;
  user_id?: UUID;
  claimed: boolean;
  date_claimed?: string;
  token_fragment?: string;
}

export interface ExternalProvider {
  id: UUID;
  name: string;
  api_key: string;
  webhook_secret: string;
  base_url: string;
  status: 'active' | 'inactive';
}

export interface ExternalProgress {
  id: UUID;
  user_id: UUID;
  provider_id: UUID;
  external_user_id: string;
  external_level_id: string;
  status: 'completed' | 'failed';
  date_completed: string;
}