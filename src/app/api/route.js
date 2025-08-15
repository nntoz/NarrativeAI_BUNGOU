import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import systemPrompt from '@/components/common/systemPrompt';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message },
    ];

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o', //gptのバージョン変更
      messages: messages,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content?.trim();

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Message API endpoint is ready',
    methods: ['POST'],
  });
}