import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db';
import { PrismaVocabularyRepository } from '@/infrastructure/repositories/PrismaVocabularyRepository';
import { OpenAITranslationService } from '@/infrastructure/services/OpenAITranslationService';
import { TranslateMessage } from '@/application/usecases/TranslateMessage';
import { TranslationRequest } from '@/domain/entities/VocabularyMapping';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as TranslationRequest;

        if (!body.message || !body.sourceVocab || !body.targetVocab) {
            return NextResponse.json(
                { error: 'Missing required fields: message, sourceVocab, targetVocab' },
                { status: 400 }
            );
        }

        const vocabularyRepo = new PrismaVocabularyRepository(prisma);
        const translationService = new OpenAITranslationService();
        const translateUseCase = new TranslateMessage(vocabularyRepo, translationService);

        const result = await translateUseCase.execute(body);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
