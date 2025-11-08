import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GraphRepository } from '../../graph/graph.repository';
import { CloudEventSkillDto } from '../dto/skill-event.dto';

@Controller()
export class SkillConsumer {
  constructor(private readonly graphRepository: GraphRepository) {}

  @EventPattern('SkillEvent')
  async handleSkillEvent(@Payload() data: any) {
    console.log('Received SkillEvent:', JSON.stringify(data, null, 2));

    try {
      // Handle both CloudEvent format and direct skill data
      let skillData, eventType;
      
      if (data.data && data.type) {
        // CloudEvent format
        skillData = data.data;
        eventType = data.type;
      } else {
        // Direct skill data
        skillData = data;
        eventType = data.type || 'Create';
      }
      
      if (eventType === 'Create' || eventType === 'Update') {
        await this.graphRepository.createOrUpdateSkill({
          id: skillData.id,
          label: skillData.label,
          description: skillData.description,
        });
        console.log(`✓ Skill ${skillData.label} synced to Neo4j`);
      }
    } catch (error) {
      console.error('Error processing SkillEvent:', error);
    }
  }
}

