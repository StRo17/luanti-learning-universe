/**
 * LUANTI LEARNING UNIVERSE - CORE DATA MODEL
 * Status: Phase 4 (Full Stack)
 */

export type UUID = string;
export type ISODateString = string;

// ENUMS
export enum UserRole {
  GLOBAL_ADMIN = 'global_admin',
  SCHOOL_ADMIN = 'school_admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
  SERVICE_ACCOUNT = 'service_account',
}

export enum SubscriptionTier {
  FREE = 'free',
  SCHOOL = 'school',
  ENTERPRISE = 'enterprise',
}

export enum QuestSubject {
  MATH = 'math',
  SCIENCE = 'science',
  CODING = 'coding',
  LANGUAGE = 'language',
  ART = 'art',
}

export enum StepType {
  EXTERNAL = 'external_learning',
  CODING = 'coding',
  INGAME = 'ingame_task',
  QUIZ = 'quiz',
}

// CORE ENTITIES

export interface School {
  id: UUID;
  name: string;
  slug: string;
  subscription_tier: SubscriptionTier;
  date_created: ISODateString;
}

export interface LuantiWorld {
  id: UUID;
  school_id: School | UUID;
  name: string;
  world_port: number;
  container_id?: string;
  is_active: boolean;
}

export interface User {
  id: UUID;
  status: 'active' | 'invited' | 'archived';
  role: UserRole;
  school_id?: School | UUID;
  username: string;
  luanti_player_name?: string;
  xp_total: number;
  coins_balance: number;
  first_name?: string;
  email?: string;
}

export interface Quest {
  id: UUID;
  status: 'published' | 'draft' | 'archived';
  title: string;
  description: string;
  subject: QuestSubject;
  difficulty: number;
  min_level_required: number;
  // NEU: Diese Felder fehlten und verursachten Fehler #1
  date_created?: ISODateString;
  date_updated?: ISODateString;
}

export interface QuestStep {
  id: UUID;
  quest_id: Quest | UUID;
  sort_order: number;
  title: string;
  // FIX: Umbenannt von 'type' zu 'step_type', da Directus snake_case nutzt (Fehler #2,3,4)
  step_type: StepType; 
  content_data: Record<string, any>;
  completion_token_secret?: string;
}

export interface UserProgress {
  id: UUID;
  user_id: User | UUID;
  quest_step_id?: QuestStep | UUID;
  status: 'started' | 'completed' | 'failed';
  token_fragment?: string;
  date_created?: ISODateString;
  date_updated?: ISODateString;
}

// NEU: Token System
export interface ClaimableToken {
  id: UUID;
  token: string;
  quest_id: Quest | UUID;
  is_claimed: boolean;
  claimed_by?: User | UUID;
}