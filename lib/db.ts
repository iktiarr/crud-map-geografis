import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_AD1Oa0sgyvtp@ep-still-paper-b3hcddot-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const sql = neon(connectionString);

let isInitialized = false;

export async function initDatabase() {
  if (isInitialized) return;
  try {
    // 1. Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

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

    isInitialized = true;
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

