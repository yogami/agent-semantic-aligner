import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db';
import { PrismaVocabularyRepository } from '@/infrastructure/repositories/PrismaVocabularyRepository';
import { CreateMappingInput } from '@/domain/entities/VocabularyMapping';

const vocabularyRepo = new PrismaVocabularyRepository(prisma);

// GET all mappings (optionally filtered by vocab pair)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sourceVocab = searchParams.get('sourceVocab');
        const targetVocab = searchParams.get('targetVocab');

        if (sourceVocab && targetVocab) {
            const mappings = await vocabularyRepo.findAllByVocabs(sourceVocab, targetVocab);
            return NextResponse.json({ mappings });
        }

        // Get all mappings
        const mappings = await prisma.vocabularyMapping.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return NextResponse.json({ mappings });
    } catch (error) {
        console.error('Error fetching mappings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mappings' },
            { status: 500 }
        );
    }
}

// Create a new mapping
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreateMappingInput;

        if (!body.sourceVocab || !body.targetVocab || !body.sourceTerm || !body.targetTerm) {
            return NextResponse.json(
                { error: 'Missing required fields: sourceVocab, targetVocab, sourceTerm, targetTerm' },
                { status: 400 }
            );
        }

        const mapping = await vocabularyRepo.create(body);
        return NextResponse.json({ mapping }, { status: 201 });
    } catch (error) {
        console.error('Error creating mapping:', error);
        return NextResponse.json(
            { error: 'Failed to create mapping' },
            { status: 500 }
        );
    }
}

// Delete a mapping
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required parameter: id' },
                { status: 400 }
            );
        }

        await vocabularyRepo.delete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting mapping:', error);
        return NextResponse.json(
            { error: 'Failed to delete mapping' },
            { status: 500 }
        );
    }
}
