/**
 * OpenAPI JSON Endpoint for Agent Semantic Aligner
 * GET /api/openapi.json
 */

import { NextResponse } from 'next/server';

export async function GET() {
    const spec = {
        openapi: '3.0.3',
        info: {
            title: 'Agent Semantic Aligner API',
            version: '1.0.0',
            description: 'Vocabulary mapping, ZK-proven semantic usage, and ontology bridging for agent interoperability.'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Local development' }
        ],
        paths: {
            '/api/mappings': {
                get: {
                    summary: 'List vocabulary mappings',
                    operationId: 'listMappings',
                    tags: ['Semantic'],
                    responses: { '200': { description: 'List of mappings' } }
                }
            },
            '/api/translate': {
                post: {
                    summary: 'Translate between vocabularies',
                    operationId: 'translateTerm',
                    tags: ['Semantic'],
                    responses: { '200': { description: 'Translation result' } }
                }
            }
        }
    };

    return NextResponse.json(spec, {
        headers: { 'Content-Type': 'application/json' }
    });
}
