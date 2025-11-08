import { Module } from '@nestjs/common';
import { GraphModule } from '../graph/graph.module';
import { SkillConsumer } from './consumers/skill.consumer';
import { FeedbackConsumer } from './consumers/feedback.consumer';
import { SwapProposalConsumer } from './consumers/swap-proposal.consumer';

@Module({
  imports: [GraphModule],
  controllers: [SkillConsumer, FeedbackConsumer, SwapProposalConsumer],
})
export class KafkaModule {}

