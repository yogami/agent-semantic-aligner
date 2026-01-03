import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranslateMessage } from '../../lib/semantic-aligner/application/usecases/TranslateMessage';
import { IVocabularyRepository } from '../../lib/semantic-aligner/domain/ports/IVocabularyRepository';
import { ITranslationService } from '../../lib/semantic-aligner/domain/ports/ITranslationService';
import { VocabularyMapping } from '../../lib/semantic-aligner/domain/entities/VocabularyMapping';

describe('TranslateMessage Use Case', () => {
    let mockVocabularyRepo: IVocabularyRepository;
    let mockTranslationService: ITranslationService;
    let translateMessage: TranslateMessage;

    const mockMapping: VocabularyMapping = {
        id: 'test-id-1',
        sourceVocab: 'medical-v1',
        targetVocab: 'consumer-health',
        sourceTerm: 'hypertension',
        targetTerm: 'high blood pressure',
        confidence: 0.95,
        usageCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockVocabularyRepo = {
            findBySourceTerm: vi.fn(),
            findAllByVocabs: vi.fn(),
            create: vi.fn(),
            incrementUsage: vi.fn(),
            delete: vi.fn(),
        };

        mockTranslationService = {
            translateTerm: vi.fn(),
            extractTerms: vi.fn(),
        };

        translateMessage = new TranslateMessage(mockVocabularyRepo, mockTranslationService);
    });

    it('should use existing mapping when found', async () => {
        vi.mocked(mockTranslationService.extractTerms).mockResolvedValue(['hypertension']);
        vi.mocked(mockVocabularyRepo.findBySourceTerm).mockResolvedValue(mockMapping);
        vi.mocked(mockVocabularyRepo.incrementUsage).mockResolvedValue({
            ...mockMapping,
            usageCount: 6,
        });

        const result = await translateMessage.execute({
            message: 'Patient diagnosed with hypertension',
            sourceVocab: 'medical-v1',
            targetVocab: 'consumer-health',
        });

        expect(result.translatedMessage).toBe('Patient diagnosed with high blood pressure');
        expect(result.mappingsUsed).toHaveLength(1);
        expect(result.newMappingsCreated).toHaveLength(0);
        expect(mockVocabularyRepo.incrementUsage).toHaveBeenCalledWith('test-id-1');
    });

    it('should create new mapping when not found', async () => {
        const newMapping: VocabularyMapping = {
            id: 'new-id',
            sourceVocab: 'medical-v1',
            targetVocab: 'consumer-health',
            sourceTerm: 'tachycardia',
            targetTerm: 'fast heart rate',
            confidence: 0.85,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        vi.mocked(mockTranslationService.extractTerms).mockResolvedValue(['tachycardia']);
        vi.mocked(mockVocabularyRepo.findBySourceTerm).mockResolvedValue(null);
        vi.mocked(mockTranslationService.translateTerm).mockResolvedValue({
            translatedTerm: 'fast heart rate',
            confidence: 0.85,
        });
        vi.mocked(mockVocabularyRepo.create).mockResolvedValue(newMapping);

        const result = await translateMessage.execute({
            message: 'Patient exhibits tachycardia',
            sourceVocab: 'medical-v1',
            targetVocab: 'consumer-health',
        });

        expect(result.translatedMessage).toBe('Patient exhibits fast heart rate');
        expect(result.mappingsUsed).toHaveLength(0);
        expect(result.newMappingsCreated).toHaveLength(1);
        expect(mockTranslationService.translateTerm).toHaveBeenCalled();
        expect(mockVocabularyRepo.create).toHaveBeenCalled();
    });

    it('should return original message when no terms extracted', async () => {
        vi.mocked(mockTranslationService.extractTerms).mockResolvedValue([]);

        const result = await translateMessage.execute({
            message: 'Hello world',
            sourceVocab: 'medical-v1',
            targetVocab: 'consumer-health',
        });

        expect(result.translatedMessage).toBe('Hello world');
        expect(result.overallConfidence).toBe(1.0);
        expect(result.mappingsUsed).toHaveLength(0);
        expect(result.newMappingsCreated).toHaveLength(0);
    });

    it('should calculate average confidence from all mappings', async () => {
        const mapping1 = { ...mockMapping, confidence: 0.9 };
        const mapping2 = {
            ...mockMapping,
            id: 'id-2',
            sourceTerm: 'edema',
            targetTerm: 'swelling',
            confidence: 0.7,
        };

        vi.mocked(mockTranslationService.extractTerms).mockResolvedValue(['hypertension', 'edema']);
        vi.mocked(mockVocabularyRepo.findBySourceTerm)
            .mockResolvedValueOnce(mapping1)
            .mockResolvedValueOnce(mapping2);
        vi.mocked(mockVocabularyRepo.incrementUsage).mockResolvedValue(mockMapping);

        const result = await translateMessage.execute({
            message: 'hypertension with edema',
            sourceVocab: 'medical-v1',
            targetVocab: 'consumer-health',
        });

        expect(result.overallConfidence).toBe(0.8); // (0.9 + 0.7) / 2
    });
});
