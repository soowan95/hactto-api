import { Injectable, BadRequestException } from '@nestjs/common';
import {
  TextractClient,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Jimp } from 'jimp';
import jsQR from 'jsqr';
import { prisma } from '../../../libs/prisma';

// S3 스트림을 버퍼로 변환하는 헬퍼 함수
const streamToBuffer = async (stream: any): Promise<Buffer> => {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};
@Injectable()
export class LottoOcrService {
  private textractClient: TextractClient;
  private s3Client: S3Client;

  constructor() {
    const config = {
      region: process.env.AWS_REGION || 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    };
    this.textractClient = new TextractClient(config);
    this.s3Client = new S3Client(config);
  }

  async analyzeLottoImage(
    imageUrl: string,
  ): Promise<{ episode: number; rank: number }> {
    const s3Bucket = process.env.AWS_S3_BUCKET;
    if (!s3Bucket) {
      throw new BadRequestException('S3 Bucket is not configured.');
    }

    // Extract S3 key from imageUrl (e.g. https://bucket.s3.region.amazonaws.com/uploads/...)
    let s3Key = '';
    try {
      const url = new URL(imageUrl);
      // Remove leading slash
      s3Key = url.pathname.substring(1);
    } catch (e) {
      console.error(e);
      throw new BadRequestException('잘못된 이미지 URL입니다.');
    }

    // 1. Download from S3
    let buffer: Buffer;
    try {
      const getRes = await this.s3Client.send(
        new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key }),
      );
      buffer = await streamToBuffer(getRes.Body);
    } catch (e) {
      console.error(e);
      throw new BadRequestException('이미지를 가져올 수 없습니다.');
    }

    // 2. Validate QR Code
    let image;
    try {
      image = await Jimp.read(buffer);
      const qrData = new Uint8ClampedArray(image.bitmap.data);
      const decoded = jsQR(qrData, image.bitmap.width, image.bitmap.height);
      if (
        !decoded ||
        (!decoded.data.includes('lotto') && !decoded.data.includes('dhlottery'))
      ) {
        throw new BadRequestException(
          '유효한 로또 QR 코드를 찾을 수 없습니다. 위조된 이미지일 수 있습니다.',
        );
      }
    } catch (e) {
      console.error(e);
      throw new BadRequestException('이미지(QR) 처리 중 오류가 발생했습니다.');
    }

    // 3. Textract
    let response;
    try {
      response = await this.textractClient.send(
        new DetectDocumentTextCommand({
          Document: { Bytes: buffer },
        }),
      );
    } catch (e) {
      console.error(e);
      throw new BadRequestException(
        '이미지 분석에 실패했습니다. 올바른 로또 이미지인지 확인해주세요.',
      );
    }

    return this.parseTextractAndBlur(response, image, s3Bucket, s3Key);
  }

  private async parseTextractAndBlur(
    response: any,
    image: any,
    s3Bucket: string,
    s3Key: string,
  ): Promise<{ episode: number; rank: number }> {
    const blocks =
      response.Blocks?.filter((block: any) => block.BlockType === 'LINE') || [];

    // 1. 회차 찾기
    let episode = 0;
    let epBlock = null;
    for (const b of blocks) {
      const line = b.Text || '';
      const episodeMatch = line.match(/제\s*(\d+)\s*회/);
      if (episodeMatch) {
        episode = parseInt(episodeMatch[1], 10);
        epBlock = b;
        break;
      }
    }

    // 폴백: "제" 와 "회"가 다른 문자로 오인식되었을 경우 (예: "XII 747 s|")
    if (!episode) {
      for (const b of blocks) {
        const line = b.Text || '';
        if (
          line.length <= 15 &&
          !line.toLowerCase().includes('lotto') &&
          !line.includes('-')
        ) {
          const nums = line.match(/\d+/g);
          if (
            nums &&
            nums.length === 1 &&
            nums[0].length >= 3 &&
            nums[0].length <= 4
          ) {
            episode = parseInt(nums[0], 10);
            epBlock = b;
            break;
          }
        }
      }
    }

    if (!episode) {
      throw new BadRequestException('로또 회차를 인식할 수 없습니다.');
    }

    // 2. 번호 라인 찾기
    const parsedBlocks: { nums: number[]; block: any }[] = [];
    for (const b of blocks) {
      const line = b.Text || '';
      const numbersMatch = line.match(
        /([A-E])\s*(수\s*동|자\s*동|반\s*자\s*동)?\s*(\d{1,2})\s*(\d{1,2})\s*(\d{1,2})\s*(\d{1,2})\s*(\d{1,2})\s*(\d{1,2})/,
      );

      if (numbersMatch) {
        const nums = [
          parseInt(numbersMatch[3], 10),
          parseInt(numbersMatch[4], 10),
          parseInt(numbersMatch[5], 10),
          parseInt(numbersMatch[6], 10),
          parseInt(numbersMatch[7], 10),
          parseInt(numbersMatch[8], 10),
        ];
        parsedBlocks.push({ nums, block: b });
      }
    }

    // 폴백: A 수동 글자와 숫자가 다른 라인으로 인식되었을 경우
    if (parsedBlocks.length === 0) {
      for (const b of blocks) {
        const line = b.Text || '';
        const numsMatch = line.match(/\b([0-4]?\d)\b/g);
        if (numsMatch && numsMatch.length === 6) {
          const parsed = numsMatch.map((n: string) => parseInt(n, 10));
          if (parsed.every((n: number) => n >= 1 && n <= 45)) {
            parsedBlocks.push({ nums: parsed, block: b });
          }
        }
      }
    }

    if (parsedBlocks.length === 0) {
      throw new BadRequestException(
        '로또 번호를 인식할 수 없습니다. 이미지가 흐리거나 잘리지 않았는지 확인해주세요.',
      );
    }

    // 3. 당첨 번호 조회 및 등수 판독
    const winningInfo = await prisma.winningNumber.findUnique({
      where: { episode },
    });

    if (!winningInfo) {
      throw new BadRequestException(
        `DB에 ${episode}회 당첨 정보가 없어 판독할 수 없습니다.`,
      );
    }

    const winningNumbers = [
      winningInfo.lt1WnNo,
      winningInfo.lt2WnNo,
      winningInfo.lt3WnNo,
      winningInfo.lt4WnNo,
      winningInfo.lt5WnNo,
      winningInfo.lt6WnNo,
    ];
    const bonusNumber = winningInfo.ltBnsWnNo;

    let bestRank = 6;
    const winningBlocks: any[] = [];

    for (const pb of parsedBlocks) {
      let matchCount = 0;
      let bonusMatch = false;

      for (const num of pb.nums) {
        if (winningNumbers.includes(num)) matchCount++;
        else if (num === bonusNumber) bonusMatch = true;
      }

      let currentRank = 6;
      if (matchCount === 6) currentRank = 1;
      else if (matchCount === 5 && bonusMatch) currentRank = 2;
      else if (matchCount === 5) currentRank = 3;
      else if (matchCount === 4) currentRank = 4;
      else if (matchCount === 3) currentRank = 5;

      if (currentRank <= 5) {
        winningBlocks.push(pb.block);
      }
      if (currentRank < bestRank) bestRank = currentRank;
    }

    // 4. Blur 처리 및 S3 업로드
    try {
      const blurred = image.clone();
      blurred.blur(15);

      const comp = async (block: any) => {
        if (!block || !block.Geometry?.BoundingBox) return;
        const box = block.Geometry.BoundingBox;
        let left = Math.max(0, box.Left - 0.01);
        let top = Math.max(0, box.Top - 0.01);
        let width = Math.min(1 - left, box.Width + 0.02);
        let height = Math.min(1 - top, box.Height + 0.02);

        let px = Math.floor(left * image.bitmap.width);
        let py = Math.floor(top * image.bitmap.height);
        let pw = Math.floor(width * image.bitmap.width);
        let ph = Math.floor(height * image.bitmap.height);

        const snippet = image.clone().crop({ x: px, y: py, w: pw, h: ph });
        blurred.composite(snippet, px, py);
      };

      // 당첨된 경우만 원본 남김
      await comp(epBlock);
      for (const wb of winningBlocks) {
        await comp(wb);
      }

      const blurredBuffer = await blurred.getBuffer('image/png');
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: s3Key,
          Body: blurredBuffer,
          ContentType: 'image/png',
        }),
      );
    } catch (e) {
      console.error(e);
      // 블러 처리에 실패해도 분석 결과 자체는 반환함
    }

    return { episode, rank: bestRank };
  }
}
