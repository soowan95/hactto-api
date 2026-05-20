import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  let corsOrigin = ['https://hactto.com'],
    loggerLevel: LogLevel[] = ['error', 'warn'];
  if (process.env.NODE_ENV === 'localhost') {
    corsOrigin = ['http://localhost:3000'];
    loggerLevel = ['error', 'warn', 'log', 'debug', 'verbose'];
  }

  const app = await NestFactory.create(AppModule, {
    logger: loggerLevel,
  });
  app.setGlobalPrefix('hactto');

  const reflector: Reflector = new Reflector();

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties not defined in the DTO
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
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Swagger
  if (process.env.NODE_ENV === 'localhost') {
    const config = new DocumentBuilder()
      .setTitle('로또 분석 백엔드 API')
      .setDescription('로또 분석 백엔드 API description')
      .setVersion('1.0.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }
  console.info('current profile: ', process.env.NODE_ENV);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
