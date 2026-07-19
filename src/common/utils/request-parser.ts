import { Request } from 'express';
import { ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class RequestParser {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getIpOrThrow() {
    let ip =
      (this.request.headers['x-forwarded-for'] as string) ||
      this.request.socket.remoteAddress;

    if (!ip) throw new ForbiddenException('IP 주소를 식별할 수 없습니다.');

    if (ip.includes(',')) ip = ip.split(',')[0].trim();

    ip = ip.replace(/^IP:\s*/i, '');
    ip = ip.replace(/^::ffff:/, '');
    ip = ip.trim();

    return ip;
  }

  getHeaders(path?: string) {
    if (path) return this.request.headers[path];
    return this.request.headers;
  }

  getCookies() {
    const cookieHeader = this.request.headers.cookie;
    if (cookieHeader) {
      return cookieHeader.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
        return cookies;
      }, {});
    }
    return {};
  }

  getUserId() {
    const req = this.request as any;
    if (req.user && req.user.sub) return req.user.sub;
    if (req.user && req.user.id) return req.user.id;

    const headerId =
      (this.request.headers['x-user-id'] as string) ||
      (this.request.query?.userId as string) ||
      (this.request.body?.userId as string);

    return headerId || undefined;
  }

  getMasterKey() {
    return (
      (this.request.headers['x-master-key'] as string) ||
      (this.request.query?.mk as string) ||
      (this.request.body?.mk as string)
    );
  }
}
