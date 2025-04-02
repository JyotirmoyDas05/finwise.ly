import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebase-admin";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  experimental_attachments?: {
    name: string;
    url: string;
    contentType: string;
  }[];
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

// Keywords that might indicate user is asking for personalized insights
const insightKeywords = [
  'my finances', 'my budget', 'my income', 'my expense', 'my saving', 'my goal', 
  'my plan', 'my portfolio', 'give me insight', 'review my', 'analyze my', 
  'evaluate my', 'how am i doing', 'suggest for me', 'my spending', 'my money'
];

// Function to check if the user is asking for personalized insights
function isAskingForPersonalizedInsights(message: string): boolean {
  const lowercaseMessage = message.toLowerCase();
  return insightKeywords.some(keyword => lowercaseMessage.includes(keyword));
}

// Function to format file content for inclusion in the prompt
function formatFileContent(content: string, fileName: string): string {
  // Check if content is missing or invalid
  if (!content || content === 'undefined' || content === 'null') {
    return `[File: ${fileName} - No valid content could be processed]`;
  }
  
  // Determine file type and format accordingly
  try {
    let formattedContent = '';
    
    // JSON file handling
    if (fileName.endsWith('.json') || 
        (content.trim().startsWith('{') && content.trim().endsWith('}'))) {
      try {
        // Try to parse and pretty-print JSON
        const parsedJson = JSON.parse(content);
        formattedContent = `JSON file ${fileName}:\n${JSON.stringify(parsedJson, null, 2)}`;
      } catch (e) {
        // If parsing fails, just use the raw content
        formattedContent = `JSON file ${fileName} (unparseable):\n${content}`;
      }
    } 
    // CSV file handling with better formatting
    else if (fileName.endsWith('.csv') || 
             (content.includes(',') && content.split('\n').length > 1)) {
      // Attempt to format the CSV more nicely
      let csvContent = content;
      
      // Check if it looks like a valid CSV
      if (content.includes(',') && content.includes('\n')) {
        // Simple CSV clean-up and formatting
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          // Identify headers
          const headers = lines[0].split(',').map(h => h.trim());
          formattedContent = `CSV file ${fileName}:\n\nHeaders: ${headers.join(', ')}\n\nData Rows: ${lines.length - 1}`;
          
          // Include a sample of the data (first few rows)
          const sampleRows = lines.slice(1, Math.min(6, lines.length));
          if (sampleRows.length > 0) {
            formattedContent += `\n\nSample rows:\n`;
            sampleRows.forEach((row, i) => {
              formattedContent += `Row ${i+1}: ${row}\n`;
            });
          }
          
          // Add full content at the end for full analysis
          formattedContent += `\n\nFull CSV content:\n${content}`;
        } else {
          formattedContent = `CSV file ${fileName} (empty or invalid):\n${content}`;
        }
      } else {
        formattedContent = `CSV file ${fileName} (possibly malformed):\n${content}`;
      }
    } 
    // PDF file handling
    else if (fileName.endsWith('.pdf') || content.includes('[PDF Document:')) {
      formattedContent = `PDF file information: ${content}\nNote: This is metadata only as the PDF content could not be extracted directly.`;
    } 
    // Image file handling
    else if (content.includes('[Image:')) {
      formattedContent = `Image file information: ${content}\nNote: This is image metadata. If the user asks about analyzing this image, explain that you can only read text-based financial data, but you'd be happy to provide guidance on what to look for in the image if they describe its contents.`;
    } 
    // Default file handling
    else {
      formattedContent = `File ${fileName}:\n${content}`;
    }
    
    return formattedContent;
  } catch (error) {
    console.error(`Error formatting file content for ${fileName}:`, error);
    return `[File: ${fileName} - Error formatting content]`;
  }
}

// Function to fetch user's financial data
async function getUserFinancialData(userId: string) {
  try {
    // Fetch user profile and finances
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    const userData = userDoc.data();
    
    // Fetch user's budgets
    const budgetsQuery = await db.collection('budgets').where('userId', '==', userId).get();
    const budgets = budgetsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Fetch user's transactions
    const transactionsQuery = await db.collection('transactions').where('userId', '==', userId).get();
    const transactions = transactionsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Fetch user's goals
    const goalsQuery = await db.collection('users').doc(userId).collection('goals').get();
    const goals = goalsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      profile: userData?.profile || {},
      finances: userData?.finances || {},
      budgets,
      transactions,
      goals
    };
  } catch (error) {
    console.error('Error fetching user financial data:', error);
    return null;
  }
}

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
    const { messages, userId, fileContents } = await req.json() as { 
      messages: ChatMessage[], 
      userId: string,
      fileContents?: string[]
    };
    
    // Get user's AI style preference
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const aiStyle = userData?.settings?.aiPreference || 'balanced';

    // Get the appropriate style prompt
    const stylePrompt = stylePrompts[aiStyle as keyof typeof stylePrompts] || stylePrompts.balanced;
    
    // Format basic messages for Gemini
    let formattedMessages = [
      ...INITIAL_PROMPT,
      ...messages.map((msg: ChatMessage) => ({
        text: `${msg.role === 'user' ? 'input: ' : 'output: '}${msg.content}`
      }))
    ];
    
    // Add file contents to the context if available
    const latestUserMessage = messages[messages.length - 1];
    let hasAttachments = false;
    let fileContext = '';

    if (fileContents && fileContents.length > 0 && latestUserMessage?.experimental_attachments) {
      hasAttachments = true;
      
      try {
        // Ensure we have valid arrays of attachments and contents
        const attachments = Array.isArray(latestUserMessage.experimental_attachments) 
          ? latestUserMessage.experimental_attachments 
          : [];
        
        const validFileContents = Array.isArray(fileContents) 
          ? fileContents 
          : [];
        
        // Combine file contents with their names, with additional error handling
        fileContext = attachments.map((attachment, index) => {
          try {
            if (!attachment || !attachment.name) {
              return `[Invalid attachment at index ${index}]`;
            }
            
            // Make sure we have valid content before formatting
            let content = '';
            if (index < validFileContents.length) {
              content = validFileContents[index] || `[File: ${attachment.name} - No content available]`;
            } else {
              content = `[File: ${attachment.name} - Content missing]`;
            }
            
            return formatFileContent(content, attachment.name);
          } catch (attachmentError) {
            console.error(`Error processing attachment at index ${index}:`, attachmentError);
            return `[Error processing file ${index}]`;
          }
        }).filter(Boolean).join('\n\n');
        
        // Add file context to the formatted messages
        if (fileContext) {
          formattedMessages.splice(INITIAL_PROMPT.length, 0, {
            text: `System: The user has uploaded the following file(s). Analyze and extract relevant financial information from these files to provide insights or answer the user's question:

${fileContext}

How to handle different file types:
1. For CSV/Text/JSON files: Analyze the content for financial information, trends, and insights.
2. For PDF files: You only have metadata, so acknowledge the PDF and ask the user if they would like to describe its contents or key information from it.
3. For Image files: You can only see metadata, so acknowledge the image and ask what type of financial document/information it contains so you can provide better assistance.

You should analyze the content of text-based files in detail when responding to the user, especially information related to budgets, transactions, financial data, etc. but don't explicitly mention that you're looking at their uploaded files unless the user asks about it specifically.`
          });
        }
      } catch (fileError) {
        console.error("Error processing file attachments:", fileError);
        // Add a fallback message if attachment processing fails
        formattedMessages.splice(INITIAL_PROMPT.length, 0, {
          text: "System: The user has uploaded files, but there was an error processing them. Acknowledge that they've uploaded files and ask them to describe the content."
        });
      }
    }
    
    // Check if the latest user message is asking for personalized insights
    if (latestUserMessage && latestUserMessage.role === 'user' && 
        isAskingForPersonalizedInsights(latestUserMessage.content) && !hasAttachments) {
      
      // Fetch user's financial data
      const financialData = await getUserFinancialData(userId);
      
      if (financialData) {
        // Add financial context to the prompt
        const financialContext = {
          text: `System: Here is the user's financial data for reference when providing personalized insights. 
          DO NOT mention this data directly or that you have access to it, but use it to provide relevant insights:
          
          Profile: ${JSON.stringify(financialData.profile)}
          Finances Overview: ${JSON.stringify(financialData.finances)}
          Budgets: ${JSON.stringify(financialData.budgets)}
          Transactions: ${JSON.stringify(financialData.transactions)}
          Goals: ${JSON.stringify(financialData.goals)}
          
          Use this data only when the user is explicitly asking for personalized insights, advice, or reviews about their finances.
          Always maintain a conversational tone and don't directly reference this data.`
        };
        
        // Insert financial context after INITIAL_PROMPT but before user messages
        formattedMessages.splice(INITIAL_PROMPT.length, 0, financialContext);
      }
    }

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
            const payload = JSON.stringify({ content: buffer });
            await writer.write(encoder.encode(`data: ${payload}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 30)); // Slightly longer delay for more natural reading
            buffer = "";
            lastChunkTime = now;
          }
        }

        // Send any remaining text
        if (buffer.trim()) {
          const payload = JSON.stringify({ content: buffer });
          await writer.write(encoder.encode(`data: ${payload}\n\n`));
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