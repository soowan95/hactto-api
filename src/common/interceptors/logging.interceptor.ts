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
    let clientIp =
      httpRequest.headers['x-forwarded-for'] ||
      httpRequest.ip ||
      httpRequest.socket.remoteAddress;

    if (typeof clientIp === 'string') {
      if (clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
      }
      clientIp = clientIp.replace(/^IP:\s*/i, '');
      clientIp = clientIp.replace(/^::ffff:/, '');
      clientIp = clientIp.trim();
    }

    // Bypass SSE logging to avoid filling console logs
    if (
      httpRequest.headers['accept'] === 'text/event-stream' ||
      httpRequest.url.includes('/sse')
    ) {
      return next.handle();
    }

    this.logger.log(
      `[${clientIp}] request url: ${httpRequest.url}, method: ${httpRequest.method}, body: ${JSON.stringify(httpRequest.body, null, 2)}`,
    );

    const controllerName = context.getClass().name;
    const methodName = context.getHandler().name;

    const now: number = Date.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `[${controllerName}.${methodName}] response time: ${Date.now() - now}ms`,
          ),
        ),
      );
  }
}
