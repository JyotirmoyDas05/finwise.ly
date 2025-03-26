import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebase-admin";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 0.4,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseModalities: [],
  responseMimeType: "text/plain",
};

// Initial prompt to establish the AI's role and behavior
const INITIAL_PROMPT = [
  {
    text: "You are FinAIBot, a personalized Financial Assistant Made to Help in this Domain of topic only, so act accordingly"
  },
  {
    text: "input: Hi"
  },
  {
    text: "output: Hi There!, I am FinAIBot, a personalized Financial AI Assistant made to Help you With your Finance related queries. You can ask your Financial Queries right away and I would be very much Happy to Help you."
  },
  {
    text: "input: Who are you"
  },
  {
    text: "output: I am FinAIBot, a personalized Financial AI Assistant made to Help you With your Finance related queries. \nYou can ask me anything related to this Domain."
  },
  {
    text: "input: What can you do"
  },
  {
    text: "output: I am a personalized Financial AI Chatbot made to Help you With your Finance related queries.\n\nYou can ask me about Price of a specific stock, Investment tips or How is the market today?\n\nI am Ready to clarify any of your Doubts in this domain"
  },
  {
    text: "input: Who made you"
  },
  {
    text: "output: I was made by a team of Student developers from FinAIBot, a company that specializes in providing personalized Financial AI Chatbots to help you with your Finance related queries."
  }
];

// Style-specific prompts
const stylePrompts = {
  detailed: "You are FinAIBot, a detailed financial advisor. Provide comprehensive, in-depth analysis with specific examples, data points, and step-by-step explanations. Focus on thorough understanding and detailed breakdowns of financial concepts.",
  quick: "You are FinAIBot, a concise financial advisor. Provide brief, actionable tips and straightforward advice. Focus on practical, easy-to-implement solutions without unnecessary details.",
  balanced: "You are FinAIBot, a balanced financial advisor. Provide well-rounded advice that combines key insights with practical implementation. Focus on both understanding and actionability."
};

// Helper function to split text into natural chunks
function splitIntoChunks(text: string): string[] {
  // First, split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length === 0) {
    // If no complete sentences, split by words while preserving word boundaries
    const words = text.match(/\S+\s*/g) || [text];
    return words;
  }
  
  return sentences;
}

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json() as { messages: ChatMessage[], userId: string };
    
    // Get user's AI style preference
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const aiStyle = userData?.settings?.aiPreference || 'balanced';

    // Get the appropriate style prompt
    const stylePrompt = stylePrompts[aiStyle as keyof typeof stylePrompts] || stylePrompts.balanced;

    // Format messages for Gemini
    const formattedMessages = [
      ...INITIAL_PROMPT,
      ...messages.map((msg: ChatMessage) => ({
        text: `${msg.role === 'user' ? 'input: ' : 'output: '}${msg.content}`
      }))
    ];

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: formattedMessages }],
      generationConfig,
    });

    // Create a TransformStream for streaming the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process the stream
    (async () => {
      try {
        let buffer = "";
        let lastChunkTime = Date.now();

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (!text.trim()) continue;

          buffer += text;
          const now = Date.now();
          const timeSinceLastChunk = now - lastChunkTime;

          // Send buffer if we have a complete sentence, enough words, or enough time has passed
          if (
            /[.!?]\s*$/.test(buffer) || // Complete sentence
            buffer.split(/\s+/).length >= 3 || // At least 3 words
            timeSinceLastChunk > 100 // Time threshold
          ) {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`)
            );
            await new Promise(resolve => setTimeout(resolve, 30)); // Slightly longer delay for more natural reading
            buffer = "";
            lastChunkTime = now;
          }
        }

        // Send any remaining text
        if (buffer.trim()) {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`)
          );
        }
        
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      } catch (error) {
        console.error('Streaming error:', error);
        await writer.abort(error);
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}