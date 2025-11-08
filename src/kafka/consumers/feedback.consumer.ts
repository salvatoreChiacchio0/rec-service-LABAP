import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GraphRepository } from '../../graph/graph.repository';
import { CloudEventFeedbackDto } from '../dto/feedback-event.dto';

@Controller()
export class FeedbackConsumer {
  constructor(private readonly graphRepository: GraphRepository) {}

  @EventPattern('FeedbackEvent')
  async handleFeedbackEvent(@Payload() data: any) {
    console.log('Received FeedbackEvent:', JSON.stringify(data, null, 2));

    try {
      // Handle both CloudEvent format and direct feedback data
      let feedbackData, eventType;
      
      if (data.data && data.type) {
        // CloudEvent format
        feedbackData = data.data;
        eventType = data.type;
      } else {
        // Direct feedback data
        feedbackData = data;
        eventType = data.type || 'Rate';
      }
      
      if (eventType === 'Rate') {
        await this.graphRepository.createRatesRelationship(
          feedbackData.reviewerUid,
          feedbackData.reviewedUid,
          {
            rating: feedbackData.rating,
            review: feedbackData.review,
          },
        );
        console.log(
          `✓ Rating created between ${feedbackData.reviewerUid} and ${feedbackData.reviewedUid}`,
        );
      }
    } catch (error) {
      console.error('Error processing FeedbackEvent:', error);
    }
  }
}

