import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { GraphModule } from '../graph/graph.module';
import { HttpModule } from '../http/http.module';

@Module({
  imports: [GraphModule, HttpModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}


