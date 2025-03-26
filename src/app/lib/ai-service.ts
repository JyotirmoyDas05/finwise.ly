interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  content: string;
  timestamp: Date;
}

// Mock financial knowledge base
const financialKnowledge = {
  budgeting: [
    "The 50/30/20 rule is a popular budgeting method where 50% goes to needs, 30% to wants, and 20% to savings.",
    "Track your expenses daily to identify spending patterns and areas for improvement.",
    "Consider using budgeting apps to automate expense tracking and categorization."
  ],
  saving: [
    "Start with an emergency fund covering 3-6 months of expenses.",
    "Automate your savings by setting up recurring transfers.",
    "Consider high-yield savings accounts for better interest rates."
  ],
  investing: [
    "Diversify your portfolio across different asset classes.",
    "Start investing early to take advantage of compound interest.",
    "Consider index funds for long-term, low-cost investing."
  ],
  debt: [
    "Pay off high-interest debt first using the avalanche method.",
    "Consider debt consolidation for better interest rates.",
    "Create a debt repayment plan and stick to it."
  ]
};

export class AIService {
  private static instance: AIService;
  private messageHistory: Message[] = [];

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private generateResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    // Simple keyword-based response system
    if (message.includes('budget') || message.includes('spending')) {
      return this.getRandomResponse(financialKnowledge.budgeting);
    } else if (message.includes('save') || message.includes('savings')) {
      return this.getRandomResponse(financialKnowledge.saving);
    } else if (message.includes('invest') || message.includes('investment')) {
      return this.getRandomResponse(financialKnowledge.investing);
    } else if (message.includes('debt') || message.includes('loan')) {
      return this.getRandomResponse(financialKnowledge.debt);
    } else {
      return "I'm your AI financial assistant. I can help you with budgeting, saving, investing, and debt management. What specific topic would you like to learn about?";
    }
  }

  private getRandomResponse(responses: string[]): string {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    // Add user message to history
    this.messageHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Generate AI response
    const response = this.generateResponse(message);

    // Add AI response to history
    const aiResponse: ChatResponse = {
      content: response,
      timestamp: new Date()
    };

    this.messageHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return aiResponse;
  }

  getMessageHistory(): Message[] {
    return [...this.messageHistory];
  }

  clearHistory(): void {
    this.messageHistory = [];
  }
} 