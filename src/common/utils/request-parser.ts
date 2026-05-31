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

    if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');

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
    return this.request.query?.visitorId || this.request.body?.visitorId;
  }

  getMasterKey() {
    return this.request.query?.mk || this.request.body?.mk;
  }
}
