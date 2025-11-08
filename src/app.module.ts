import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Neo4jModule } from './neo4j/neo4j.module';
import { GraphModule } from './graph/graph.module';
import { KafkaModule } from './kafka/kafka.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { HttpModule } from './http/http.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    Neo4jModule,
    GraphModule,
    KafkaModule,
    RecommendationsModule,
    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
