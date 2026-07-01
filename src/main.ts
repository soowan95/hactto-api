import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  let corsOrigin: (string | RegExp)[] = [
      'https://hactto.com',
      'https://www.hactto.com',
    ],
    loggerLevel: LogLevel[] = ['error', 'warn'];
  if (
    process.env.NODE_ENV === 'localhost' ||
    process.env.NODE_ENV === 'development' ||
    !process.env.NODE_ENV
  ) {
    corsOrigin = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      /^http:\/\/localhost:\d+$/,
    ];
    loggerLevel = ['error', 'warn', 'log', 'debug', 'verbose'];
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: loggerLevel,
  });
  app.set('trust proxy', true);

  app.setGlobalPrefix('hactto/v1');

  const reflector: Reflector = new Reflector();

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties aren't defined in the DTO
      transform: true, // Automatically convert incoming types to DTO types
    }),
  );
  // Global Interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(), // Logs HTTP request details and measures response time
    new ResponseTransformInterceptor(reflector), // Standardizes all HTTP responses into a consistent format
  );

  // CORS
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    exposedHeaders: ['x-first-visit'],
  });

  // Swagger
  if (process.env.NODE_ENV === 'localhost') {
    const config = new DocumentBuilder()
      .setTitle('로또 분석 백엔드 API')
      .setDescription('로또 분석 백엔드 API description')
      .setVersion('1.0.0')
      .addTag('- Algorithm', 'Algorithm API Documentation')
      .addTag('- Analysis', 'Analysis API Documentation')
      .addTag('- Winning Number', 'Winning Number API Documentation')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }
  console.info('current profile: ', process.env.NODE_ENV);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
