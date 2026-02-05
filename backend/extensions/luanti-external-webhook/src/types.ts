import type { Knex } from 'knex';

export type UUID = string;
export type ISODateString = string;

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
  date_completed: ISODateString;
}

export interface UserProgress {
  id?: UUID;
  user_id: UUID;
  quest_step_id: UUID;
  status: 'completed' | 'failed';
  date_created: ISODateString;
}

export interface ServiceConfig {
  schema: any;
  knex: Knex;
}

export interface ItemsService {
  createOne(item: Record<string, any>): Promise<any>;
  readOne(id: string): Promise<any>;
  readByQuery(query: QueryOptions): Promise<any[]>;
}

export interface QueryOptions {
  filter?: Record<string, any>;
  limit?: number;
}