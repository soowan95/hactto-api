import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../../src/modules/user/application/payment.service';
import { PAYMENT_REPOSITORY_TOKEN } from '../../src/modules/user/domain/ports/payment.port';
import { PortoneClient } from '../../src/modules/user/infrastructure/clients/portone.client';
import { HonService } from '../../src/modules/user/application/hon.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock Prisma client
jest.mock('../../src/libs/prisma', () => ({
  prisma: {
    inquiry: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    subscription: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  },
}));

import { prisma } from '../../src/libs/prisma';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockRepository: any;
  let mockPortoneClient: any;
  let mockHonService: any;

  beforeEach(async () => {
    mockRepository = {
      saveEvent: jest.fn().mockResolvedValue(undefined),
      saveProjection: jest.fn().mockResolvedValue(undefined),
      getProjectionByOrderId: jest.fn(),
      getEvents: jest.fn().mockResolvedValue([]),
    };

    mockPortoneClient = {
      confirmPayment: jest.fn(),
      payWithBillingKey: jest.fn(),
      cancelPayment: jest.fn(),
    };

    mockHonService = {
      chargeHon: jest.fn().mockResolvedValue(undefined),
      startSubscription: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PAYMENT_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: PortoneClient,
          useValue: mockPortoneClient,
        },
        {
          provide: HonService,
          useValue: mockHonService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
  });

  describe('readyPayment', () => {
    it('should throw BadRequestException if there is an active refund inquiry', async () => {
      (prisma.inquiry.findFirst as jest.Mock).mockResolvedValue({
        id: 'inq-123',
      });

      await expect(
        service.readyPayment('visitor-1', 1000, 'order-1', 'order-name'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create and return a payment aggregate if valid', async () => {
      (prisma.inquiry.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const aggregate = await service.readyPayment(
        'visitor-1',
        1000,
        'order-1',
        'order-name',
      );

      expect(aggregate).toBeDefined();
      expect(aggregate.toProjection().amount).toBe(1000);
      expect(mockRepository.saveEvent).toHaveBeenCalled();
      expect(mockRepository.saveProjection).toHaveBeenCalled();
    });
  });

  describe('confirmPayment', () => {
    it('should throw NotFoundException if payment projection is not found', async () => {
      mockRepository.getProjectionByOrderId.mockResolvedValue(null);

      await expect(
        service.confirmPayment('order-1', 'payment-key', 1000),
      ).rejects.toThrow(NotFoundException);
    });

    it('should confirm payment, call portone, approve aggregate and charge Hon', async () => {
      const projection = {
        paymentId: 'payment-1',
        visitorId: 'visitor-1',
        amount: 1000,
        orderId: 'order-1',
        orderName: 'order-name',
        status: 'READY',
      };
      mockRepository.getProjectionByOrderId.mockResolvedValue(projection);

      // Rebuild aggregate from initial ready event
      const initialEvents = [
        {
          paymentId: 'payment-1',
          eventType: 'PaymentRequested',
          payload: {
            visitorId: 'visitor-1',
            amount: 1000,
            orderId: 'order-1',
            orderName: 'order-name',
          },
          version: 1,
          timestamp: new Date(),
        },
      ];
      mockRepository.getEvents.mockResolvedValue(initialEvents);

      mockPortoneClient.confirmPayment.mockResolvedValue({
        success: true,
        approvedAt: new Date(),
      });

      const result = await service.confirmPayment(
        'order-1',
        'payment-key',
        1000,
      );

      expect(result.toProjection().status).toBe('PAID');
      expect(mockPortoneClient.confirmPayment).toHaveBeenCalledWith(
        'payment-key',
        'order-1',
        1000,
      );
      expect(mockHonService.chargeHon).toHaveBeenCalledWith(
        'payment-1',
        'visitor-1',
        30,
      );
    });
  });
});
