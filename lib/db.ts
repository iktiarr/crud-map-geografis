import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || "";

export const sql = neon(connectionString);

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Timeout wrapper untuk query database agar API tidak hanging/timeout berlebihan
 */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 4000,
  fallbackValue?: T
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Database query timeout setelah ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    if (fallbackValue !== undefined) {
      console.warn("DB Timeout / Connection notice, menggunakan fallback data:", err);
      return fallbackValue;
    }
    throw err;
  }
}

export async function initDatabase() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Jalankan inisialisasi dengan timeout 4500ms agar tidak memblokir serverless worker
      await withDbTimeout(
        (async () => {
          // 1. Users table
          await sql`
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              username VARCHAR(100) UNIQUE NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              role VARCHAR(50) DEFAULT 'user',
              phone VARCHAR(50),
              address TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `;

          try {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';`;
          } catch {
            // column role already exists
          }

          // 1.1 System Settings Table (Dynamic App & API Configuration)
          try {
            await sql`
              CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `;
          } catch (settErr) {
            console.warn("Notice creating system_settings table:", settErr);
          }

          // 1.1b AI Configurations Table (Multiple Keys & Models)
          try {
            await sql`
              CREATE TABLE IF NOT EXISTS ai_configurations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                api_key TEXT NOT NULL,
                model VARCHAR(150) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `;
            // Pastikan semua konfigurasi yang ada aktif di pool
            await sql`UPDATE ai_configurations SET is_active = true WHERE is_active IS NULL OR is_active = false;`;
          } catch (aiConfErr) {
            console.warn("Notice creating/updating ai_configurations table:", aiConfErr);
          }

          // 1.2 Seed Default Admin Account if not exists
          try {
            const adminEmail = "globalmapsstudio.iktiarramadani@web.com";
            const existingAdmin = await sql`
              SELECT id FROM users WHERE email = ${adminEmail} OR username = 'globalmapsstudio' LIMIT 1;
            `;
            if (existingAdmin.length === 0) {
              const bcrypt = await import("bcryptjs");
              const hashedPassword = await bcrypt.default.hash("globalmapsstudio", 10);
              await sql`
                INSERT INTO users (name, username, email, password, role, phone, address)
                VALUES (
                  'Admin Global Maps',
                  'globalmapsstudio',
                  ${adminEmail},
                  ${hashedPassword},
                  'admin',
                  '08123456789',
                  'Pusat Layanan Global Maps'
                );
              `;
              console.log("✅ Akun Admin bawaan berhasil dibuat: globalmapsstudio.iktiarramadani@web.com");
            }
          } catch (adminErr) {
            console.warn("Notice seeding admin account:", adminErr);
          }

    // 2. PostGIS Extension
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS postgis;`;
    } catch (postgisErr) {
      console.warn("PostGIS extension notice:", postgisErr);
    }

    // 3. Modul 2 - Dedicated Spatial CRUD table
    await sql`
      CREATE TABLE IF NOT EXISTS spatial_crud_features (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        group_name VARCHAR(100) DEFAULT 'Utama',
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) DEFAULT 'Umum',
        description TEXT,
        color VARCHAR(50) DEFAULT '#678a40',
        geojson JSONB NOT NULL,
        properties JSONB DEFAULT '{}'::jsonb,
        geom GEOMETRY(Geometry, 4326),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await sql`ALTER TABLE spatial_crud_features ADD COLUMN IF NOT EXISTS group_name VARCHAR(100) DEFAULT 'Utama';`;
      await sql`CREATE INDEX IF NOT EXISTS idx_spatial_crud_group ON spatial_crud_features(group_name);`;
    } catch (colErr) {
      console.warn("Notice adding group_name column:", colErr);
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_spatial_crud_geom ON spatial_crud_features USING GIST(geom);`;
    } catch {
      // index already exists or ignore
    }

    // 4. Spatial Groups Table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS spatial_groups (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
    } catch (grpErr) {
      console.warn("Notice creating spatial_groups table:", grpErr);
    }

    // 5. Modul 5 - Dedicated Traversed Roads Table (Pemetaan Jalan yang Pernah Dilalui)
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS traversed_roads (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          folder_name VARCHAR(100) DEFAULT 'Utama',
          origin_name VARCHAR(255) NOT NULL,
          origin_lat DOUBLE PRECISION NOT NULL,
          origin_lng DOUBLE PRECISION NOT NULL,
          destination_name VARCHAR(255) NOT NULL,
          destination_lat DOUBLE PRECISION NOT NULL,
          destination_lng DOUBLE PRECISION NOT NULL,
          waypoints JSONB DEFAULT '[]'::jsonb,
          distance_km DOUBLE PRECISION NOT NULL,
          duration_min DOUBLE PRECISION DEFAULT 0,
          color VARCHAR(50) DEFAULT '#2563eb',
          weight INTEGER DEFAULT 6,
          opacity DOUBLE PRECISION DEFAULT 0.9,
          line_style VARCHAR(50) DEFAULT 'solid',
          travel_mode VARCHAR(50) DEFAULT 'driving',
          category VARCHAR(100) DEFAULT 'Jalan Terhubung',
          description TEXT,
          geojson JSONB NOT NULL,
          geom GEOMETRY(LineString, 4326),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      try {
        await sql`ALTER TABLE traversed_roads ADD COLUMN IF NOT EXISTS folder_name VARCHAR(100) DEFAULT 'Utama';`;
        await sql`ALTER TABLE traversed_roads ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]'::jsonb;`;
        await sql`ALTER TABLE traversed_roads ADD COLUMN IF NOT EXISTS marker_style VARCHAR(50) DEFAULT 'numbers';`;
        await sql`ALTER TABLE traversed_roads ADD COLUMN IF NOT EXISTS connection_mode VARCHAR(50) DEFAULT 'sequential';`;
        await sql`CREATE INDEX IF NOT EXISTS idx_traversed_roads_folder ON traversed_roads(folder_name);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_traversed_roads_geom ON traversed_roads USING GIST(geom);`;
      } catch (idxErr) {
        console.warn("Notice updating columns/index for traversed_roads:", idxErr);
      }

      // 6. Modul 5 - Folders Table
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS traversed_road_folders (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            color VARCHAR(50) DEFAULT '#2563eb',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
      } catch (fldErr) {
        console.warn("Notice creating traversed_road_folders table:", fldErr);
      }
    } catch (routeErr) {
      console.warn("Notice creating traversed_roads table:", routeErr);
    }
        })(),
        4500
      );

      isInitialized = true;
    } catch (error) {
      console.warn("Database initialization deferred/notice:", error);
    } finally {
      // Tandai initialized agar tidak menunda request berikutnya
      isInitialized = true;
    }
  })();

  return initPromise;
}

/**
 * Mengambil nilai konfigurasi sistem dari database
 */
export async function getSystemSetting(key: string, defaultValue = ""): Promise<string> {
  try {
    await initDatabase();
    const rows = await sql`SELECT value FROM system_settings WHERE key = ${key} LIMIT 1;`;
    if (rows && rows.length > 0 && rows[0].value) {
      return rows[0].value;
    }
  } catch (err) {
    console.warn(`Gagal mengambil setting '${key}' dari DB:`, err);
  }
  return defaultValue;
}

/**
 * Menyimpan / memperbarui nilai konfigurasi sistem di database
 */
export async function setSystemSetting(key: string, value: string): Promise<boolean> {
  try {
    await initDatabase();
    await sql`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (err) {
    console.error(`Gagal menyimpan setting '${key}' ke DB:`, err);
    return false;
  }
}

/**
 * Mengambil API Key OpenRouter aktif:
 * Prioritas 1: Database (dari pengaturan admin)
 * Prioritas 2: Environment Variable (.env)
 */
export async function getEffectiveOpenRouterKey(): Promise<string> {
  const dbKey = await getSystemSetting("openrouter_api_key", "");
  if (dbKey && dbKey.trim() !== "") {
    return dbKey.trim();
  }
  return (process.env.API_KEY_OPENROUTERAI || "").trim();
}

/**
 * Mengambil Model AI OpenRouter aktif:
 * Prioritas 1: Database (dari pengaturan admin)
 * Prioritas 2: Environment Variable (.env OPENROUTER_MODEL)
 * Default Fallback: "apodex/apodex-1.1-mini"
 */
export async function getEffectiveOpenRouterModel(): Promise<string> {
  const dbModel = await getSystemSetting("openrouter_model", "");
  if (dbModel && dbModel.trim() !== "") {
    return dbModel.trim();
  }
  const envModel = (process.env.OPENROUTER_MODEL || "").trim();
  if (envModel) return envModel;
  return "apodex/apodex-1.1-mini";
}

/**
 * Mengambil Pool Konfigurasi AI Aktif (Diacak / Randomized Load Balancing)
 * Mengembalikan array konfigurasi yang aktif dalam urutan acak
 */
export async function getRandomAiConfigPool(): Promise<Array<{ id?: number; apiKey: string; model: string; name: string }>> {
  try {
    await initDatabase();
    const activeRows = await sql`
      SELECT id, name, api_key, model 
      FROM ai_configurations 
      WHERE is_active = true 
      ORDER BY RANDOM();
    `;

    if (activeRows && activeRows.length > 0) {
      return activeRows.map((r) => ({
        id: r.id,
        apiKey: (r.api_key || "").trim(),
        model: (r.model || "").trim() || "apodex/apodex-1.1-mini",
        name: r.name || "Konfigurasi Database",
      })).filter((item) => item.apiKey.length > 0);
    }

    // Jika tidak ada yang is_active = true, ambil semua yang ada di database secara acak
    const allRows = await sql`
      SELECT id, name, api_key, model 
      FROM ai_configurations 
      ORDER BY RANDOM();
    `;

    if (allRows && allRows.length > 0) {
      return allRows.map((r) => ({
        id: r.id,
        apiKey: (r.api_key || "").trim(),
        model: (r.model || "").trim() || "apodex/apodex-1.1-mini",
        name: r.name || "Konfigurasi Database",
      })).filter((item) => item.apiKey.length > 0);
    }
  } catch (err) {
    console.warn("Notice reading ai_configurations pool:", err);
  }

  // Fallback ke .env
  const fallbackKey = await getEffectiveOpenRouterKey();
  const fallbackModel = await getEffectiveOpenRouterModel();
  return [
    {
      apiKey: fallbackKey,
      model: fallbackModel || "apodex/apodex-1.1-mini",
      name: "Default Server (.env)",
    },
  ];
}

/**
 * Mengambil satu Konfigurasi AI Aktif Acak
 */
export async function getEffectiveAiConfig(): Promise<{ apiKey: string; model: string; name: string }> {
  const pool = await getRandomAiConfigPool();
  if (pool.length > 0) {
    return pool[0];
  }
  return {
    apiKey: (process.env.API_KEY_OPENROUTERAI || "").trim(),
    model: (process.env.OPENROUTER_MODEL || "").trim() || "apodex/apodex-1.1-mini",
    name: "Default Server (.env)",
  };
}

