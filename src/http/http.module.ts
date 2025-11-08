import { Module } from '@nestjs/common';
import { HttpModule as NestHttpModule } from '@nestjs/axios';
import { HttpClientService } from './http-client.service';

@Module({
  imports: [
    NestHttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpModule {}

