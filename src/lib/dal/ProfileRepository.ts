// Ziratstan.kz - Data Access Layer (Repository Pattern)
// Соответствует Закону РК о персональных данных.
// Разделение Гео-данных (Firebase/Public) и ПДн (Postgres/KZ)

export interface UserProfile {
  geo_id: string; // Foreign key to public Geo Database
  fullName: string;
  pinHash: string; // Hashed with bcrypt/pbkdf2
  documentUrl?: string; // e.g. S3 link mapping
}

export interface IProfileRepository {
  getProfileByGeoId(geoId: string): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<boolean>;
}

/**
 * Current implementation using Supabase for fast iteration
 * Should be protected by RLS (Row Level Security).
 */
export class SupabaseProfileRepository implements IProfileRepository {
  // Mocked initialization. In real code: import { createClient } from '@supabase/supabase-js'
  // private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  async getProfileByGeoId(geoId: string): Promise<UserProfile | null> {
    // const { data, error } = await this.supabase.from('personal_profiles').select('*').eq('geo_id', geoId).single();
    // if (error) return null;
    // return data as UserProfile;
    console.log(`[Supabase DAL] Fetching profile for geo: ${geoId}`);
    return null;
  }

  async saveProfile(profile: UserProfile): Promise<boolean> {
    // const { error } = await this.supabase.from('personal_profiles').upsert(profile);
    // return !error;
    console.log(`[Supabase DAL] Saving secure profile for geo: ${profile.geo_id}`);
    return true;
  }
}

/**
 * Compliance implementation (Data Residency)
 * Uses local Kazakhstan PostgreSQL databases (Transtelecom/Katelco).
 */
export class KZPostgresProfileRepository implements IProfileRepository {
  async getProfileByGeoId(geoId: string): Promise<UserProfile | null> {
    console.log(`[KZ Local DAL] Прямой SQL запрос к ДЦ Астана: SELECT * FROM profiles WHERE geo_id = ${geoId}`);
    // e.g., const res = await sql`SELECT * FROM profiles WHERE geo_id = ${geoId}`;
    // return res.rows[0];
    return null;
  }

  async saveProfile(profile: UserProfile): Promise<boolean> {
    console.log(`[KZ Local DAL] Saving data natively without border crossing.`);
    return true;
  }
}

/**
 * Database Factory
 * Automatically switches to Local KZ DB when compliance mode is activated in backend.
 */
export const dbFactory = (): IProfileRepository => {
  return process.env.DATA_RESIDENCY_MODE === 'LOCAL_KZ' 
    ? new KZPostgresProfileRepository() 
    : new SupabaseProfileRepository();
};
