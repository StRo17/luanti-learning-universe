/**
 * LUANTI LEARNING UNIVERSE - CORE DATA MODEL
 * Status: Phase 1 (Backend Definition)
 */

export type UUID = string;
export type ISODateString = string;

// ---------------------------------------------------------------------------
// ENUMS (Dropdowns in Directus)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// CORE ENTITIES
// ---------------------------------------------------------------------------

export interface School {
  id: UUID;
  name: string;
  slug: string; // URL-safe identifier (e.g. "goethe-gymnasium")
  subscription_tier: SubscriptionTier;
  date_created: ISODateString;
}

export interface LuantiWorld {
  id: UUID;
  school_id: School | UUID; // Relation
  name: string;
  world_port: number; // e.g. 30001
  container_id?: string; // Docker Container ID (Internal)
  is_active: boolean;
}

export interface User {
  id: UUID;
  status: 'active' | 'invited' | 'archived';
  role: UserRole; // Mapped to Directus Roles
  school_id?: School | UUID;
  username: string; // Unique per school
  luanti_player_name?: string;
  xp_total: number;
  coins_balance: number;
}

export interface Quest {
  id: UUID;
  status: 'published' | 'draft' | 'archived';
  title: string;
  description: string; // Markdown/WYSIWYG
  subject: QuestSubject;
  difficulty: number; // 1-10
  min_level_required: number;
}

export interface QuestStep {
  id: UUID;
  quest_id: Quest | UUID;
  sort_order: number; // 1, 2, 3...
  title: string;
  type: StepType;
  content_data: Record<string, any>; // JSON config for the step
  completion_token_secret?: string; // Internal verification secret
}