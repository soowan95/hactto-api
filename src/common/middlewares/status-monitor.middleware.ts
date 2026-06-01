import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../helpers/redis/application/redis.service';

@Injectable()
export class StatusMonitorMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const masterKey = req.query.mk as string;

    if (!masterKey) {
      throw new ForbiddenException(
        'Access denied. Master key (mk) is required.',
      );
    }

    const justCreated: boolean = await this.redisService.isJustCreated();
    if (justCreated) {
      await this.redisService.addToSet('manager:k', masterKey);
      return next();
    }

    const isManagerOfRedis: boolean = await this.redisService.isMemberOfSet(
      'manager:k',
      masterKey,
    );

    if (!isManagerOfRedis) {
      throw new ForbiddenException('Access denied to managing redis.');
    }

    const originalSend = res.send;
    res.send = function (body: any) {
      if (typeof body === 'string') {
        body = body
          .replace(
            "Chart.defaults.global.elements.line.borderColor = 'rgba(0,0,0,0.9)';",
            "Chart.defaults.global.elements.line.borderColor = 'rgba(255, 255, 255, 0.85)';",
          )
          .replace(
            /options: defaultOptions,/g,
            'options: JSON.parse(JSON.stringify(defaultOptions)),',
          )
          .replace(
            'var defaultOptions = {',
            "var defaultOptions = { scales: { yAxes: [{ ticks: { beginAtZero: true, fontColor: 'rgba(255, 255, 255, 0.6)' }, gridLines: { color: 'rgba(255, 255, 255, 0.1)', zeroLineColor: 'rgba(255, 255, 255, 0.2)' } }], xAxes: [{ type: 'time', time: { unitStepSize: 30 }, ticks: { fontColor: 'rgba(255, 255, 255, 0.6)' }, gridLines: { display: true, color: 'rgba(255, 255, 255, 0.1)' } }] }, tooltips: { enabled: false }, responsive: true, maintainAspectRatio: false, animation: false }; var dummy = {",
          );
      }
      return originalSend.call(this, body);
    };

    next();
  }
}
