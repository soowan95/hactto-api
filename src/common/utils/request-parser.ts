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

  getVisitorId() {
    const headerId =
      (this.request.headers['x-visitor-id'] as string) ||
      (this.request.query?.visitorId as string) ||
      (this.request.body?.visitorId as string);

    if (headerId) return headerId;

    try {
      const ip = this.getIpOrThrow();
      if (ip) {
        const crypto = require('crypto');
        return crypto
          .createHash('sha256')
          .update(ip)
          .digest('hex')
          .substring(0, 16);
      }
    } catch {
      // Ignore
    }
    return undefined;
  }

  getMasterKey() {
    return (
      (this.request.headers['x-master-key'] as string) ||
      (this.request.query?.mk as string) ||
      (this.request.body?.mk as string)
    );
  }
}
