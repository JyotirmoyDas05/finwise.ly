"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Chat } from "@/components/ui/chat";
import { type Message } from "@/components/ui/chat-message";
import { useAuth } from "@/app/context/AuthContext";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi I am FinAIBot🤖, How Can I Help you Today?",
  createdAt: new Date(),
};

export default function AskAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const hasShownWelcome = useRef(false);

  // Show welcome message only on first load
  useEffect(() => {
    if (messages.length === 0 && !hasShownWelcome.current) {
      setMessages([WELCOME_MESSAGE]);
      hasShownWelcome.current = true;
    }
  }, []);

  const processStreamResponse = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    assistantMessageId: string
  ) => {
    const decoder = new TextDecoder();
    let content = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              if (data) {
                const parsed = JSON.parse(data);
                content += parsed.content;
                
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error("Error parsing chunk:", e, "Raw data:", data);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing stream:", error);
      throw error;
    }
  };

  // Helper function to process file content
  const processFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Function to safely handle text-based files
      const handleTextFile = () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              resolve(`[File: ${file.name} - No content could be read]`);
            }
          } catch (error) {
            console.error(`Error reading text file ${file.name}:`, error);
            resolve(`[File: ${file.name} - Error reading content]`);
          }
        };
        reader.onerror = () => {
          console.error(`FileReader error for ${file.name}`);
          resolve(`[File: ${file.name} - Error reading file]`);
        };
        reader.readAsText(file);
      };

      // Handle different file types appropriately
      try {
        // For CSV files, handle them as text with extra validation
        if (file.name.endsWith('.csv') || file.type === 'text/csv') {
          handleTextFile();
        }
        // For JSON files, handle as text 
        else if (file.name.endsWith('.json') || file.type === 'application/json') {
          handleTextFile();
        }
        // For plain text files
        else if (file.type.startsWith('text/') || 
            file.name.endsWith('.txt') || 
            file.name.endsWith('.md')) {
          handleTextFile();
        } 
        // For PDFs, just return metadata
        else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const fileSize = (file.size / 1024).toFixed(2);
          resolve(`[PDF Document: ${file.name}, Size: ${fileSize} KB]`);
        } 
        // For images, extract metadata only
        else if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            const imageInfo = {
              name: file.name,
              type: file.type,
              size: `${(file.size / 1024).toFixed(2)} KB`,
              dimensions: `${img.width}x${img.height} pixels`,
            };
            URL.revokeObjectURL(img.src);
            resolve(`[Image: ${JSON.stringify(imageInfo)}]`);
          };
          img.onerror = () => {
            resolve(`[Image: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)} KB]`);
          };
          img.src = URL.createObjectURL(file);
        } 
        // For any other file type, just return metadata
        else {
          resolve(`[File: ${file.name}, type: ${file.type || 'unknown'}, size: ${(file.size / 1024).toFixed(2)} KB]`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        resolve(`[File: ${file.name} - Could not process file]`);
      }
    });
  };

  const handleSubmit = async (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ): Promise<void> => {
    event?.preventDefault?.();
    if ((!input.trim() && !options?.experimental_attachments?.length) || isGenerating || !user?.uid) return;

    // Process file attachments if any
    let fileContents: string[] = [];
    let attachments: {name: string, url: string, contentType: string}[] = [];

    if (options?.experimental_attachments && options.experimental_attachments.length > 0) {
      try {
        // Process each file
        const files = Array.from(options.experimental_attachments);
        
        // Process files with error handling for individual files
        fileContents = await Promise.all(
          files.map(async (file) => {
            try {
              return await processFileContent(file);
            } catch (fileError) {
              console.error(`Error processing file ${file.name}:`, fileError);
              return `[File: ${file.name} - Error processing file]`;
            }
          })
        );
        
        // Create attachments for the message
        attachments = await Promise.all(files.map(async (file) => {
          try {
            // For images, use blob URLs directly (they're handled specially in the chat-message component)
            if (file.type.startsWith('image/')) {
              return {
                name: file.name,
                url: URL.createObjectURL(file),
                contentType: file.type || 'application/octet-stream',
              };
            }
            
            // For text files, create a proper data URL
            if (file.type.startsWith('text/') || 
                file.name.endsWith('.txt') || 
                file.name.endsWith('.md') ||
                file.name.endsWith('.csv') ||
                file.name.endsWith('.json')) {
              try {
                // Read the file text content
                const textContent = await file.text();
                const base64Content = btoa(textContent || file.name);
                return {
                  name: file.name,
                  url: `data:${file.type || 'text/plain'};base64,${base64Content}`,
                  contentType: file.type || 'text/plain',
                };
              } catch (readError) {
                console.error(`Error reading text from file ${file.name}:`, readError);
                // Fallback to a simple data URL
                return {
                  name: file.name,
                  url: `data:text/plain;base64,${btoa(file.name)}`,
                  contentType: file.type || 'text/plain',
                };
              }
            }
            
            // For other files, create a simple data URL with metadata
            return {
              name: file.name,
              url: `data:${file.type || 'application/octet-stream'};base64,${btoa(file.name || 'Unknown')}`,
              contentType: file.type || 'application/octet-stream',
            };
          } catch (error) {
            console.error(`Error creating attachment for file ${file.name}:`, error);
            // Return a minimal valid attachment
            return {
              name: file.name,
              url: `data:text/plain;base64,${btoa('Error creating preview')}`,
              contentType: file.type || 'application/octet-stream',
            };
          }
        }));
      } catch (error) {
        console.error("Error processing files:", error);
        // Don't block the message sending, just show an error notification
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "There was an error processing one or more of your files. Your message will be sent, but the file analysis may be limited.",
            id: `file-error-${Date.now()}`,
            createdAt: new Date(),
          }
        ]);
      }
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim() || "Please analyze the attached file(s).",
      id: Date.now().toString(),
      createdAt: new Date(),
      experimental_attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      id: (Date.now() + 1).toString(),
      createdAt: new Date(),
    };

    try {
      setIsGenerating(true);
      setInput("");
      
      // Update messages with both user message and empty assistant message
      setMessages((prev) => [...prev.filter(msg => msg.id !== "welcome"), userMessage, assistantMessage]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.filter(msg => msg.id !== "welcome"), userMessage],
          userId: user.uid,
          fileContents: fileContents.length > 0 ? fileContents : undefined,
        }),
      });

      if (!response.ok) throw new Error(`Failed to get response: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      await processStreamResponse(reader, assistantMessage.id);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => 
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: "Sorry, I encountered an error. Please try again. If you uploaded files, try with smaller or different file types." }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const append = async (message: { role: "user"; content: string }) => {
    if (!user?.uid) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      ...message,
      createdAt: new Date(),
    };

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      id: (Date.now() + 1).toString(),
      createdAt: new Date(),
    };

    try {
      setIsGenerating(true);
      setMessages((prev) => [...prev.filter(msg => msg.id !== "welcome"), userMessage, assistantMessage]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.filter(msg => msg.id !== "welcome"), userMessage],
          userId: user.uid,
        }),
      });

      if (!response.ok) throw new Error(`Failed to get response: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      await processStreamResponse(reader, assistantMessage.id);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: "I apologize, but I am having trouble processing your request. Please try again later." }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col items-center p-6">
        <div className="w-full max-w-4xl h-[calc(100vh-4rem)] rounded-2xl border bg-white shadow-lg">
          <div className="relative flex flex-col h-full w-full p-4 overflow-hidden">
            {messages.length === 0 && (
              <div className="mb-4 px-4 py-2 rounded-lg bg-blue-50 text-sm text-blue-800">
                <p className="font-medium">💡 Tip: You can upload files for analysis</p>
                <p className="text-xs mt-1">Drag and drop or use the attachment icon to upload CSV, text, PDF, or image files of financial documents for insights and analysis.</p>
              </div>
            )}
            <Chat
              messages={messages}
              input={input}
              handleInputChange={(e) => setInput(e.target.value)}
              handleSubmit={handleSubmit}
              isGenerating={isGenerating}
              setMessages={setMessages}
              append={append}
              suggestions={[
                "How do I create a monthly budget?",
                "What are the best investment options for beginners?",
                "Explain the concept of compound interest",
                "Tips for reducing monthly expenses",
                "How to start saving for retirement?",
                "Review my financial situation",
                "How am I doing with my budget?",
                "What can I improve in my spending habits?",
                "Give me personalized advice for my savings goals",
                "Analyze my income vs expenses",
                "Upload a CSV of my transactions and analyze it",
                "Help me understand this financial statement",
                "Review my budget spreadsheet",
                "What insights can you give from my expense data?",
                "I've uploaded a PDF of my financial report",
                "Analyze this bank statement image"
              ]}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}