# Agent Semantic Aligner

Translation middleware for vocabulary gaps between AI agents using different ontologies.

## 🚀 Part of Multi-Agent Communication Suite (App 1 of 5)

### Features
- **Semantic Translation**: Translates domain-specific terminology between vocabularies
- **Learning Mappings**: Stores and reuses learned vocabulary mappings
- **LLM-Powered**: Uses OpenAI GPT-4o-mini for intelligent translation
- **Clean Architecture**: Domain-driven design with SOLID principles

### Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Prisma 7 + Neon PostgreSQL
- OpenAI API
- TailwindCSS
- Vitest + Playwright

### Quick Start

```bash
npm install
npx prisma db push
npm run dev
```

### API Endpoints

- `POST /api/translate` - Translate a message between vocabularies
- `GET/POST/DELETE /api/mappings` - Manage vocabulary mappings

### Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for translation

### Testing

```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests
```

### License

MIT
