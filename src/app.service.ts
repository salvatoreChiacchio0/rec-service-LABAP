import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SwapIt Recommendation Service is running! Use /recommendations/swaps/:userUid to get recommendations.';
  }
}
