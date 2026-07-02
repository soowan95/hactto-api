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
  ): Promise<{ episode: number; rank: number; lottoIdentifier?: string }> {
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

    let qrEpisode: number | undefined;
    let qrNumbers: number[][] = [];
    let qrUrl: string | undefined;
    let image;
    try {
      image = await Jimp.read(buffer);
      // JSQR에 넘길 이미지 데이터 (대용량 이미지에서 QR 인식이 실패하는 것을 방지하기 위해 리사이징)
      const qrImage = image.clone().resize({ w: 800 });
      const qrData = new Uint8ClampedArray(qrImage.bitmap.data);
      const decoded = jsQR(qrData, qrImage.bitmap.width, qrImage.bitmap.height);
      if (decoded) {
        if (
          !decoded.data.includes('lotto') &&
          !decoded.data.includes('dhlottery')
        ) {
          throw new BadRequestException(
            '유효한 로또 QR 코드가 아닙니다. 위조된 이미지일 수 있습니다.',
          );
        }

        qrUrl = decoded.data;
        // Extract episode and numbers from QR URL (e.g. v=1126m011213141516m...)
        const urlMatch = decoded.data.match(/v=(\d+)(.*)/);
        if (urlMatch) {
          qrEpisode = parseInt(urlMatch[1], 10);
          const numbersStr = urlMatch[2];
          // matches m010203040506 or q010203040506
          const rows = numbersStr.match(/[mq](\d{12})/g);
          if (rows) {
            qrNumbers = rows.map((row) => {
              const digits = row.slice(1);
              return [
                parseInt(digits.slice(0, 2), 10),
                parseInt(digits.slice(2, 4), 10),
                parseInt(digits.slice(4, 6), 10),
                parseInt(digits.slice(6, 8), 10),
                parseInt(digits.slice(8, 10), 10),
                parseInt(digits.slice(10, 12), 10),
              ];
            });
          }
        }
      } else {
        throw new BadRequestException(
          '중복 인증 방지를 위해 QR코드 인식이 필수입니다. QR코드가 밝고 선명하게 보이도록 정면에서 다시 촬영해주세요.',
        );
      }
    } catch (e) {
      console.error(e);
      if (e instanceof BadRequestException) {
        throw e;
      }
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

    return this.parseTextractAndBlur(
      response,
      image,
      s3Bucket,
      s3Key,
      qrEpisode,
      qrNumbers,
      qrUrl,
    );
  }

  private async parseTextractAndBlur(
    response: any,
    image: any,
    s3Bucket: string,
    s3Key: string,
    qrEpisode?: number,
    qrNumbers?: number[][],
    qrUrl?: string,
  ): Promise<{ episode: number; rank: number; lottoIdentifier?: string }> {
    const blocks =
      response.Blocks?.filter((block: any) => block.BlockType === 'LINE') || [];

    // 1. 회차 찾기
    let episode = qrEpisode || 0;
    let epBlock = null;

    // QR로 회차를 안다면, 해당 회차가 포함된 블록을 우선 찾음
    if (qrEpisode) {
      for (const b of blocks.slice(0, 20)) {
        if (b.Text?.includes(qrEpisode.toString())) {
          epBlock = b;
          break;
        }
      }
    }

    if (!epBlock) {
      for (const b of blocks.slice(0, 20)) {
        const line = b.Text || '';
        const episodeMatch = line.match(/제\s*(\d+)\s*회?/);
        if (episodeMatch) {
          episode = parseInt(episodeMatch[1], 10);
          epBlock = b;
          break;
        }
      }
    }

    // 폴백 1: "제"나 "회"가 오인식되었지만 비슷한 문자가 있는 경우
    if (!epBlock) {
      for (const b of blocks.slice(0, 20)) {
        const line = b.Text || '';
        if (/[제회지히xXiI]/.test(line)) {
          const nums = line.match(/\d{3,4}/g);
          if (nums) {
            for (const numStr of nums) {
              const num = parseInt(numStr, 10);
              if (num > 800 && num < 2000 && num !== 1000) {
                episode = num;
                epBlock = b;
                break;
              }
            }
          }
        }
        if (epBlock) break;
      }
    }

    // 폴백 2: 짧은 줄에 회차로 추정되는 숫자가 있는 경우
    if (!epBlock) {
      for (const b of blocks.slice(0, 20)) {
        const line = b.Text || '';
        if (
          line.length <= 25 &&
          !line.toLowerCase().includes('lotto') &&
          !line.includes('-') &&
          !line.includes(':')
        ) {
          const nums = line.match(/\d+/g);
          if (nums && nums.length <= 2) {
            for (const numStr of nums) {
              const num = parseInt(numStr, 10);
              if (num > 800 && num < 2000 && num !== 1000) {
                episode = num;
                epBlock = b;
                break;
              }
            }
          }
        }
        if (epBlock) break;
      }
    }

    if (!episode) {
      throw new BadRequestException('로또 회차를 인식할 수 없습니다.');
    }

    // 2. 번호 라인 찾기
    const parsedBlocks: { nums: number[]; block: any }[] = [];

    // Extract all potential number blocks from Textract
    const textractBlocks: { nums: number[]; block: any }[] = [];
    for (const b of blocks) {
      const line = b.Text || '';

      // try original regex
      const numbersMatch = line.match(
        /([A-E])\s*(수\s*동|자\s*동|반\s*자\s*동)?\s*(\d{1,2})\s*(\d{1,2})\s*(\d{1,2})\s*(\d{1,2})\s*(\d{1,2})\s*(\d{1,2})/,
      );
      if (numbersMatch) {
        textractBlocks.push({
          nums: [
            parseInt(numbersMatch[3], 10),
            parseInt(numbersMatch[4], 10),
            parseInt(numbersMatch[5], 10),
            parseInt(numbersMatch[6], 10),
            parseInt(numbersMatch[7], 10),
            parseInt(numbersMatch[8], 10),
          ],
          block: b,
        });
        continue;
      }

      // try fallback regex
      let cleanedLine = line
        .replace(/[oO]/g, '0')
        .replace(/[ilI]/g, '1')
        .replace(/[sS]/g, '5')
        .replace(/[zZ]/g, '2')
        .replace(/[bB]/g, '8');
      const numsMatch = cleanedLine.match(/\b([0-4]?\d)\b/g);
      if (numsMatch && numsMatch.length >= 6) {
        // get the last 6 numbers
        const parsed = numsMatch.slice(-6).map((n) => parseInt(n, 10));
        if (parsed.every((n) => n >= 1 && n <= 45)) {
          textractBlocks.push({ nums: parsed, block: b });
        }
      }
    }

    if (qrNumbers && qrNumbers.length > 0) {
      // QR 코드 데이터가 있으면 QR 데이터를 최우선으로 사용!
      for (const qrNumSet of qrNumbers) {
        // 매칭되는 Textract block 찾기 (블러 처리를 위해)
        // 숫자가 가장 많이 일치하는 블록을 찾는다.
        let bestMatchBlock = null;
        let maxMatches = -1;

        for (const tb of textractBlocks) {
          let matches = 0;
          for (const n of qrNumSet) {
            if (tb.nums.includes(n)) matches++;
          }
          if (matches > maxMatches) {
            maxMatches = matches;
            bestMatchBlock = tb.block;
          }
        }

        // 매칭되는 블록이 없더라도 (OCR 실패) 빈 블록으로 추가하여 당첨 결과라도 맞게 나오게 함.
        // 블러는 못하더라도 당첨 확인은 정확함!
        parsedBlocks.push({
          nums: qrNumSet,
          block: bestMatchBlock,
        });
      }
    } else {
      // QR 코드 데이터가 없으면 Textract 결과 그대로 사용
      parsedBlocks.push(...textractBlocks);
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
      blurred.pixelate(15);
      blurred.blur(20);

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

    return { episode, rank: bestRank, lottoIdentifier: qrUrl };
  }
}
