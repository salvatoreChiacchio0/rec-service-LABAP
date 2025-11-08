import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CloudEventInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToRpc();
    let data = ctx.getData();
    
    // If data is a string, try to parse it as JSON
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        console.warn('Failed to parse message as JSON:', error);
        return next.handle();
      }
    }
    
    // Handle CloudEvent format - extract data field if present
    // CloudEvent format: { specversion, id, source, subject, type, datacontenttype, time, data }
    if (data && typeof data === 'object' && data.data !== undefined && data.type !== undefined) {
      // This is a CloudEvent, the consumer will handle it
      // We just ensure it's properly structured
      ctx.getData = () => data;
    }
    
    return next.handle().pipe(
      tap(() => {
        // Log successful processing if needed
      })
    );
  }
}



