import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { kafkaConfig } from './kafka/kafka.config';
import { CloudEventInterceptor } from './kafka/interceptors/cloud-event.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Recommendation Service API')
    .setDescription(
      'API for getting user swap recommendations based on graph analysis. ' +
      'This service uses Neo4j graph database to perform level 2 graph traversal ' +
      'and provides recommendations of users to swap with.',
    )
    .setVersion('1.0')
    .addTag('recommendations', 'Swap recommendation endpoints')
    .addTag('graph', 'Neo4j graph statistics endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Recommendation Service API',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // Connect Kafka microservice
  const microservice = app.connectMicroservice<MicroserviceOptions>(kafkaConfig);
  
  // Register global interceptor for CloudEvent processing
  microservice.useGlobalInterceptors(new CloudEventInterceptor());

  await app.startAllMicroservices();
  
  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  
  console.log('===========================================');
  console.log('Recommendation Service started!');
  console.log(`Listening on: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api`);
  console.log('Kafka consumer listening to topics:');
  console.log('  - SkillEvent');
  console.log('  - FeedbackEvent');
  console.log('  - SwapProposalEvent');
  console.log('===========================================');
}
bootstrap();
