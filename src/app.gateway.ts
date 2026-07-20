import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { SystemStatusService } from './common/utils/system-status/system-status.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // Adjust for production
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);
  private connectedClients = new Map<string, Socket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly systemStatusService: SystemStatusService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(server: Server) {
    this.systemStatusService.statusStream$.subscribe((status) => {
      if (this.server) {
        this.server.emit('system-status', status);
      }
    });
  }

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth.token || client.handshake.headers['authorization'];
    try {
      if (token) {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret',
        });
        client.data.user = payload;
        this.connectedClients.set(payload.sub, client);
        this.logger.log(`User connected via socket: ${payload.sub}`);
      } else {
        this.logger.log(`Anonymous user connected via socket: ${client.id}`);
      }
    } catch {
      this.logger.warn(`Invalid token during socket connection: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.connectedClients.delete(client.data.user.sub);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Example to send personal notification
  sendToUser(userId: string, event: string, data: any) {
    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit(event, data);
    }
  }
}
