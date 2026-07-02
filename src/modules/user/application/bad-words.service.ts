import { Injectable, OnModuleInit } from '@nestjs/common';
import { prisma } from '../../../libs/prisma';

@Injectable()
export class BadWordsService implements OnModuleInit {
  private bannedWords: Set<string> = new Set();

  async onModuleInit() {
    await this.loadBannedWords();
  }

  async loadBannedWords() {
    const words = await prisma.bannedWord.findMany();
    this.bannedWords = new Set(words.map((w) => w.word));
  }

  containsBadWord(text: string): boolean {
    if (!text) return false;
    const normalizedText = text.replace(/[^가-힣a-zA-Z0-9]/g, '');
    for (const word of this.bannedWords) {
      if (normalizedText.includes(word) || text.includes(word)) {
        return true;
      }
    }
    return false;
  }

  async addBannedWord(word: string) {
    if (this.bannedWords.has(word)) return;
    await prisma.bannedWord.create({ data: { word } });
    this.bannedWords.add(word);
  }

  async removeBannedWord(word: string) {
    if (!this.bannedWords.has(word)) return;
    await prisma.bannedWord.delete({ where: { word } });
    this.bannedWords.delete(word);
  }

  getAllBannedWords(): string[] {
    return Array.from(this.bannedWords);
  }
}
