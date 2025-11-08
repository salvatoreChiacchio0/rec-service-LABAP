import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { neo4jConfig } from '../config/neo4j.config';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;

  async onModuleInit() {
    this.driver = neo4j.driver(
      `${neo4jConfig.scheme}://${neo4jConfig.host}:${neo4jConfig.port}`,
      neo4j.auth.basic(neo4jConfig.username, neo4jConfig.password),
    );

    // Verify connection
    try {
      await this.driver.verifyConnectivity();
      console.log('Connected to Neo4j');
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  getDriver(): Driver {
    return this.driver;
  }

  getSession(database?: string): Session {
    return this.driver.session({
      database: database || neo4jConfig.database,
    });
  }

  async runQuery(query: string, params?: Record<string, any>) {
    const session = this.getSession();
    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }
}


