import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

/**
 * Creates Kafka configuration using ConfigService
 * Reads KAFKA_BROKERS from environment variables (via .env file)
 * 
 * @param configService - ConfigService instance from NestJS
 * @returns KafkaOptions configuration object
 */
export function createKafkaConfig(configService: ConfigService): KafkaOptions {
  // Read Kafka brokers from environment variable
  const kafkaBrokers = configService.get<string>('KAFKA_BROKERS', 'broker:29092');
  const brokers = kafkaBrokers.split(',').map(broker => broker.trim());

  console.log('Connecting to Kafka brokers:', brokers);
  console.log('Consumer group ID: rec-service-lab-ap-group');
  console.log('Subscribing to topics: SkillEvent, FeedbackEvent, SwapProposalEvent');

  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'rec-service-lab-ap',
        brokers: brokers,
        retry: {
          retries: 8,
          initialRetryTime: 1000,
        },
        // Force connection to use the specified broker
        connectionTimeout: 10000,
        requestTimeout: 30000,
      },
      consumer: {
        groupId: 'rec-service-lab-ap-group',
        allowAutoTopicCreation: true,
        heartbeatInterval: 3000,
        sessionTimeout: 30000,
        // Force to use the broker we specify, not the advertised one
        maxInFlightRequests: 1,
        // Retry configuration
        retry: {
          retries: 8,
          initialRetryTime: 100,
          multiplier: 2,
          maxRetryTime: 30000,
        },
      },
      // Run options
      run: {
        autoCommit: true,
        autoCommitInterval: 5000,
      },
    },
  };
}

/**
 * Legacy export for backward compatibility
 * Uses process.env directly (fallback when ConfigService is not available)
 * @deprecated Use createKafkaConfig(ConfigService) instead
 */
export const kafkaConfig: KafkaOptions = (() => {
  const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
  const brokers = kafkaBrokers.split(',').map(broker => broker.trim());

  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'rec-service-lab-ap',
        brokers: brokers,
        retry: {
          retries: 8,
          initialRetryTime: 1000,
        },
        connectionTimeout: 3000,
        requestTimeout: 30000,
      },
      consumer: {
        groupId: 'rec-service-lab-ap-group',
        allowAutoTopicCreation: true,
        heartbeatInterval: 3000,
        sessionTimeout: 30000,
        maxInFlightRequests: 1,
      },
      run: {
        autoCommit: true,
        autoCommitInterval: 5000,
      },
    },
  };
})();

