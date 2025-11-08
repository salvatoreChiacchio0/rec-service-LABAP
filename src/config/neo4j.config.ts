import { Neo4jConfig } from '../neo4j/neo4j-config.interface';

export const neo4jConfig: Neo4jConfig = {
  scheme: process.env.NEO4J_SCHEME || 'bolt',
  host: process.env.NEO4J_HOST || 'localhost',
  port: parseInt(process.env.NEO4J_PORT || '7687'),
  username: process.env.NEO4J_USERNAME || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'neo4j',
};


