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
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              content += parsed.content;
              
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content }
                    : msg
                )
              );
            } catch (e) {
              console.error("Error parsing chunk:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing stream:", error);
      throw error;
    }
  };

  const handleSubmit = async (
    event?: { preventDefault?: () => void }
  ): Promise<void> => {
    event?.preventDefault?.();
    if (!input.trim() || isGenerating || !user?.uid) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      id: Date.now().toString(),
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
      setInput("");
      
      // Update messages with both user message and empty assistant message
      setMessages((prev) => [...prev.filter(msg => msg.id !== "welcome"), userMessage, assistantMessage]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.filter(msg => msg.id !== "welcome"), userMessage],
          userId: user.uid,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      await processStreamResponse(reader, assistantMessage.id);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => 
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: "Sorry, I encountered an error. Please try again." }
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

      if (!response.ok) throw new Error("Failed to get response");
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
              ]}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}