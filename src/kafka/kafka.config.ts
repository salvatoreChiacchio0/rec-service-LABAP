import { KafkaOptions, Transport } from '@nestjs/microservices';

// Force the broker address - if in Docker, use host.docker.internal
const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
const brokers = kafkaBrokers.split(',').map(broker => broker.trim());

console.log('Connecting to Kafka brokers:', brokers);
console.log('Consumer group ID: rec-service-lab-ap-group');
console.log('Subscribing to topics: SkillEvent, FeedbackEvent, SwapProposalEvent');

export const kafkaConfig: KafkaOptions = {
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
      connectionTimeout: 3000,
      requestTimeout: 30000,
    },
    consumer: {
      groupId: 'rec-service-lab-ap-group',
      allowAutoTopicCreation: true,
      heartbeatInterval: 3000,
      sessionTimeout: 30000,
      // Force to use the broker we specify, not the advertised one
      maxInFlightRequests: 1,
    },
    // Run options
    run: {
      autoCommit: true,
      autoCommitInterval: 5000,
    },
  },
};

