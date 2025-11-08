import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GraphRepository } from '../../graph/graph.repository';
import { CloudEventSwapProposalDto } from '../dto/swap-proposal-event.dto';

@Controller()
export class SwapProposalConsumer {
  constructor(private readonly graphRepository: GraphRepository) {}

  @EventPattern('SwapProposalEvent')
  async handleSwapProposalEvent(@Payload() data: any) {
    console.log('Received SwapProposalEvent:', JSON.stringify(data, null, 2));

    try {
      // Handle both CloudEvent format and direct proposal data
      let proposalData, eventType;
      
      if (data.data && data.type) {
        // CloudEvent format
        proposalData = data.data;
        eventType = data.type;
      } else {
        // Direct proposal data
        proposalData = data;
        eventType = data.type || 'Swapped';
      }
      
      // Normalize status to uppercase for comparison (enum serialized as string)
      const normalizedStatus = typeof proposalData.status === 'string' 
        ? proposalData.status.toUpperCase() 
        : proposalData.status;
      
      if (eventType === 'Swapped' && normalizedStatus === 'ACCEPTED') {
        await this.graphRepository.createSwappedRelationship(
          proposalData.requestUserUid,
          proposalData.offerUserUid,
          {
            timestamp: new Date().toISOString(),
            success: true,
          },
        );
        console.log(
          `✓ Swap relationship created between ${proposalData.requestUserUid} and ${proposalData.offerUserUid}`,
        );
      }
    } catch (error) {
      console.error('Error processing SwapProposalEvent:', error);
    }
  }
}

