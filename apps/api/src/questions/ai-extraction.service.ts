import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateQuestionDto } from './dto/questions.dto';
import * as mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class AiExtractionService {
    private anthropicApiKey: string | null;
    private geminiApiKey: string | null;

    constructor(private configService: ConfigService) {
        this.anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY') || null;
        this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || null;

        if (this.geminiApiKey) {
            console.log('✅ Gemini AI configured (primary)');
        }
        if (this.anthropicApiKey) {
            console.log('✅ Claude AI configured (fallback)');
        }
    }

    async extractTextFromFile(buffer: Buffer, mimetype: string): Promise<string> {
        if (mimetype === 'application/pdf') {
            return "PDF_BUFFER_DIRECT";
        } else if (
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimetype === 'application/msword'
        ) {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } else if (mimetype === 'text/plain') {
            return buffer.toString('utf-8');
        } else {
            throw new BadRequestException('Unsupported file format. Please upload PDF, Word, or Text documents.');
        }
    }

    async parseDocument(buffer: Buffer, mimetype: string, rawText?: string): Promise<CreateQuestionDto[]> {
        const errors: string[] = [];

        // Try Gemini first (free tier, just rate-limited)
        if (this.geminiApiKey) {
            try {
                console.log('🤖 Attempting extraction with Gemini AI...');
                return await this.parseWithGemini(buffer, mimetype, rawText);
            } catch (error) {
                const msg = error.message || String(error);
                console.error('❌ Gemini extraction failed:', msg);
                errors.push(`Gemini: ${msg}`);
            }
        }

        // Try Claude as fallback
        if (this.anthropicApiKey) {
            try {
                console.log('🔄 Attempting extraction with Claude AI...');
                return await this.parseWithClaude(buffer, mimetype, rawText);
            } catch (error) {
                const msg = error.message || String(error);
                console.error('❌ Claude extraction failed:', msg);
                errors.push(`Claude: ${msg}`);
            }
        }

        if (errors.length === 0) {
            throw new BadRequestException('No AI provider configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY in .env');
        }

        // Both failed — give a clear error message
        const errorSummary = errors.join(' | ');
        if (errorSummary.includes('quota') || errorSummary.includes('rate') || errorSummary.includes('429')) {
            throw new BadRequestException(
                'AI quota temporarily exceeded. The free Gemini API has a rate limit. Please wait 1-2 minutes and try again.'
            );
        }
        if (errorSummary.includes('credit balance') || errorSummary.includes('billing')) {
            throw new BadRequestException(
                'AI API credits exhausted. Please add credits to your Anthropic account or wait for Gemini rate limit to reset (1-2 min).'
            );
        }

        throw new BadRequestException(`AI extraction failed: ${errorSummary}`);
    }

    // ============================================
    // GEMINI (Google) - Primary Provider (Free)
    // ============================================
    private async parseWithGemini(buffer: Buffer, mimetype: string, rawText?: string): Promise<CreateQuestionDto[]> {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: this.geminiApiKey! });

        const prompt = this.getExtractionPrompt();
        let uploadedFile: any = null;
        let tempFilePath: string | null = null;
        let contents: any[] = [];

        try {
            if (mimetype === 'application/pdf') {
                console.log('🤖 Uploading PDF to Gemini File API...');
                tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}.pdf`);
                fs.writeFileSync(tempFilePath, buffer);

                uploadedFile = await ai.files.upload({ file: tempFilePath });
                console.log(`✅ Uploaded file ${uploadedFile.name}`);
                contents = [
                    { fileData: { fileUri: uploadedFile.uri, mimeType: uploadedFile.mimeType } },
                    { text: prompt },
                ];
            } else {
                const textContent = rawText || buffer.toString('utf-8');
                contents = [
                    { text: `\nHere is the raw text to parse:\n"""\n${textContent}\n"""` },
                    { text: prompt },
                ];
            }

            console.log('🤖 Requesting from Gemini 2.0 Flash...');
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: contents,
                config: { temperature: 0.1, responseMimeType: 'application/json' },
            });

            return this.parseJsonResponse(response.text || '', 'Gemini');

        } finally {
            if (uploadedFile) {
                try { await ai.files.delete({ name: uploadedFile.name }); } catch { }
            }
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }

    // ============================================
    // CLAUDE (Anthropic) - Fallback Provider
    // ============================================
    private async parseWithClaude(buffer: Buffer, mimetype: string, rawText?: string): Promise<CreateQuestionDto[]> {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const client = new Anthropic({ apiKey: this.anthropicApiKey! });

        const prompt = this.getExtractionPrompt();
        let content: any[] = [];

        if (mimetype === 'application/pdf') {
            const base64Data = buffer.toString('base64');
            content = [
                {
                    type: 'document',
                    source: {
                        type: 'base64',
                        media_type: 'application/pdf',
                        data: base64Data,
                    },
                },
                { type: 'text', text: prompt },
            ];
        } else {
            const textContent = rawText || buffer.toString('utf-8');
            content = [
                { type: 'text', text: `Here is the exam paper text:\n\n${textContent}\n\n${prompt}` },
            ];
        }

        console.log('🤖 Sending document to Claude...');
        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            messages: [{ role: 'user', content }],
        });

        const textBlock = response.content.find((block: any) => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            throw new Error('No text response from Claude');
        }

        return this.parseJsonResponse(textBlock.text, 'Claude');
    }

    // ============================================
    // Shared Utilities
    // ============================================
    private getExtractionPrompt(): string {
        return `You are an expert educational content parser. I am providing you with an exam paper.
Your job is to identify ALL distinct questions, their options (if MCQ), the correct answer, and infer the difficulty and tags.
If the document is a PDF, you must read ALL pages and extract ALL questions.

Return the output STRICTLY as a JSON array of objects, with NO surrounding markdown formatting or backticks. Just the raw JSON array.

Each object must match this exact structure:
[
    {
        "questionText": "string (include the full text of the question, describe any diagrams present)",
        "questionType": "MCQ" | "NUMERICAL",
        "options": {
            "A": "string",
            "B": "string",
            "C": "string",
            "D": "string"
        },
        "correctAnswer": "string (the letter of the correct option, e.g. 'A' or 'B')",
        "explanation": "string (if the solution is shown, otherwise empty string)",
        "difficulty": "EASY" | "MEDIUM" | "HARD",
        "marks": 4,
        "negativeMarks": 1,
        "tags": ["string"]
    }
]

IMPORTANT RULES:
1. Extract EVERY question from the document, do not skip any.
2. For mathematical formulas, use plain text notation (e.g. x^2, sqrt(x), pi, theta).
3. If a question has a diagram, describe it in the questionText.
4. Infer difficulty based on complexity: basic formula application = EASY, multi-step = MEDIUM, advanced concepts = HARD.
5. Return ONLY the JSON array, nothing else.`;
    }

    private parseJsonResponse(responseText: string, provider: string): CreateQuestionDto[] {
        let jsonString = responseText
            .replace(/^```(?:json)?\s*/, '')
            .replace(/\s*```$/, '')
            .trim();

        const arrayStart = jsonString.indexOf('[');
        const arrayEnd = jsonString.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1) {
            jsonString = jsonString.substring(arrayStart, arrayEnd + 1);
        }

        const parsedArray = JSON.parse(jsonString);

        if (!Array.isArray(parsedArray)) {
            throw new Error(`${provider} did not return a valid array`);
        }

        if (parsedArray.length === 0) {
            throw new BadRequestException('No questions found in the document.');
        }

        console.log(`✅ ${provider} successfully extracted ${parsedArray.length} questions!`);
        return parsedArray as CreateQuestionDto[];
    }

    async parseQuestionsFromText(rawText: string): Promise<CreateQuestionDto[]> {
        throw new Error("Deprecated: Use parseDocument instead.");
    }
}
