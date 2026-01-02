import OpenAI from 'openai';
import { ITranslationService } from '../../domain/interfaces/ITranslationService';

/**
 * OpenAI implementation of the TranslationService.
 */
export class OpenAITranslationService implements ITranslationService {
    private readonly openai: OpenAI;

    constructor(apiKey?: string) {
        this.openai = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });
    }

    private isMockMode(): boolean {
        return this.openai.apiKey?.startsWith('mock-') ?? false;
    }

    async translateTerm(
        term: string,
        sourceVocab: string,
        targetVocab: string,
        context?: string
    ): Promise<{ translatedTerm: string; confidence: number }> {
        if (this.isMockMode()) {
            return {
                translatedTerm: `[MOCK] ${term} -> ${targetVocab}`,
                confidence: 0.9,
            };
        }

        const prompt = `You are a semantic translation expert. Translate the following term from the "${sourceVocab}" vocabulary/ontology to the "${targetVocab}" vocabulary/ontology.

Term to translate: "${term}"
${context ? `Context: "${context}"` : ''}

Respond in JSON format only:
{
  "translatedTerm": "the equivalent term in the target vocabulary",
  "confidence": 0.0 to 1.0 confidence score
}`;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from OpenAI');
        }

        const result = JSON.parse(content);
        return {
            translatedTerm: result.translatedTerm || term,
            confidence: result.confidence ?? 0.5,
        };
    }

    async extractTerms(message: string, vocabulary: string): Promise<string[]> {
        if (this.isMockMode()) {
            return ['mock-term-1', 'mock-term-2'];
        }

        const prompt = `You are a semantic analysis expert. Extract domain-specific terms from the following message that belong to the "${vocabulary}" vocabulary/ontology.

Message: "${message}"

Respond in JSON format only:
{
  "terms": ["term1", "term2", ...]
}

Only include terms that are specific to the vocabulary domain, not common words.`;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from OpenAI');
        }

        const result = JSON.parse(content);
        return result.terms || [];
    }
}
