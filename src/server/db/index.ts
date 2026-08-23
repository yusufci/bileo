// Bileo Database Management Layer & Unified Dual-Mode Service Entrypoint
// Provides automated PostgreSQL connection probing with graceful In-Memory fallback.

import { IDatabaseService, DatabaseConfig } from './types';
import { PostgresDatabaseService } from './postgresService';
import { MemoryDatabaseService } from './memoryService';

export * from './types';
export * from './queryBuilder';
export * from './postgresService';
export * from './memoryService';
export * from './seedLoader';

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private service: IDatabaseService | null = null;
  private initPromise: Promise<IDatabaseService> | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initializes the database service based on environment and availability.
   * Auto-probes PostgreSQL and falls back seamlessly to MemoryDatabaseService if unavailable.
   */
  public async initialize(config: Partial<DatabaseConfig> = {}): Promise<IDatabaseService> {
    if (this.service) {
      return this.service;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const forceMemory =
        config.useMemoryDb ||
        process.env.USE_MEMORY_DB === 'true' ||
        process.env.NODE_ENV === 'test' ||
        (!config.connectionString && !process.env.DATABASE_URL && !config.host && !process.env.PGHOST);

      if (forceMemory) {
        const memService = new MemoryDatabaseService();
        await memService.initSchema();
        await memService.seedData();
        this.service = memService;
        return memService;
      }

      // Try connecting to PostgreSQL with a 2.5 second timeout
      try {
        const pgService = new PostgresDatabaseService(config);
        
        // Timeout probe
        const probePromise = pgService.healthCheck();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PostgreSQL connection timeout (2500ms)')), 2500)
        );

        const health = await Promise.race([probePromise, timeoutPromise]);

        if (health.status === 'healthy') {
          await pgService.initSchema();
          await pgService.seedData();
          this.service = pgService;
          return pgService;
        } else {
          throw new Error(health.error || 'PostgreSQL probe returned unhealthy');
        }
      } catch (err: any) {
        console.warn(`⚠️ PostgreSQL unavailable (${err.message}). Falling back to In-Memory Relational Engine.`);
        const fallbackService = new MemoryDatabaseService();
        await fallbackService.initSchema();
        await fallbackService.seedData();
        this.service = fallbackService;
        return fallbackService;
      }
    })();

    const result = await this.initPromise;
    this.initPromise = null;
    return result;
  }

  /**
   * Returns the current active database service. If not initialized, defaults to a ready-to-use MemoryDatabaseService.
   */
  public getService(): IDatabaseService {
    if (!this.service) {
      const memService = new MemoryDatabaseService();
      // Synchronously initialize empty schema
      this.service = memService;
      // Trigger background seed
      memService.seedData().catch((err) => console.error('Error seeding background memory db:', err));
    }
    return this.service;
  }

  /**
   * Alias for initialize/getService to retrieve or auto-initialize database service.
   */
  public async getDatabase(config: Partial<DatabaseConfig> = {}): Promise<IDatabaseService> {
    return await this.initialize(config);
  }

  /**
   * Closes the active database connection.
   */
  public async close(): Promise<void> {
    if (this.service) {
      await this.service.close();
      this.service = null;
    }
    this.initPromise = null;
  }
}

// Convenient export functions
export async function getDatabase(config?: Partial<DatabaseConfig>): Promise<IDatabaseService> {
  const manager = DatabaseManager.getInstance();
  return await manager.initialize(config);
}

export async function getDatabaseService(config?: Partial<DatabaseConfig>): Promise<IDatabaseService> {
  const manager = DatabaseManager.getInstance();
  return await manager.initialize(config);
}

export async function initDatabase(config?: Partial<DatabaseConfig>): Promise<IDatabaseService> {
  return await DatabaseManager.getInstance().initialize(config);
}

export async function closeDatabase(): Promise<void> {
  return await DatabaseManager.getInstance().close();
}

