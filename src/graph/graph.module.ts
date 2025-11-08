import { Module } from '@nestjs/common';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { GraphRepository } from './graph.repository';

@Module({
  imports: [Neo4jModule],
  providers: [GraphRepository],
  exports: [GraphRepository],
})
export class GraphModule {}


