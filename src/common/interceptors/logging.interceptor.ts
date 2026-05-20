import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(LoggingInterceptor.name);
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const httpRequest: any = context.switchToHttp().getRequest();
    this.logger.log(
      `request url: ${httpRequest.url}, method: ${httpRequest.method}, body: ${JSON.stringify(httpRequest.body, null, 2)}`,
    );

    const now: number = Date.now();
    return next
      .handle()
      .pipe(tap(() => this.logger.log(`response time: ${Date.now() - now}ms`)));
  }
}
