import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.NEXT_PUBLIC_GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
  : null;

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  videos: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    channelTitle: string;
    category: string;
    duration: string;
    videoId: string;
  }[];
  quiz: {
    questions: QuizQuestion[];
  };
}

// Topic categories for matching fallback quizzes
const TOPIC_CATEGORIES = {
  BUDGETING: "Budgeting",
  INVESTING: "Investing",
  SAVINGS: "Savings",
  DEBT: "Debt",
  TAXES: "Taxes",
  RETIREMENT: "Retirement",
  INSURANCE: "Insurance"
};

// Helper function to find matching category
function findMatchingCategory(topic: string, description: string): string | undefined {
  return Object.values(TOPIC_CATEGORIES).find(cat => 
    topic.toLowerCase().includes(cat.toLowerCase()) || 
    description.toLowerCase().includes(cat.toLowerCase())
  );
}

// Fallback quizzes for different categories
const fallbackQuizzes = {
  [TOPIC_CATEGORIES.BUDGETING]: [
      {
        question: "What is the primary purpose of budgeting?",
        options: [
          "To spend more money",
          "To track and control expenses",
          "To avoid saving money",
          "To increase debt"
        ],
        correctAnswer: 1
      },
      {
        question: "Which of these is NOT a good budgeting practice?",
        options: [
          "Setting financial goals",
          "Tracking expenses",
          "Ignoring monthly bills",
          "Creating an emergency fund"
        ],
        correctAnswer: 2
      },
      {
        question: "What percentage of income is recommended for savings?",
        options: [
          "5-10%",
          "10-15%",
          "15-20%",
          "20-25%"
        ],
        correctAnswer: 2
      }
  ],
  [TOPIC_CATEGORIES.INVESTING]: [
    {
      question: "What is diversification in investing?",
      options: [
        "Putting all money in one stock",
        "Spreading investments across different assets",
        "Investing only in bonds",
        "Keeping all money in savings"
      ],
      correctAnswer: 1
    },
    {
      question: "Which investment typically has the highest risk?",
      options: [
        "Government bonds",
        "Savings account",
        "Individual stocks",
        "Certificates of deposit"
      ],
      correctAnswer: 2
    },
    {
      question: "What is compound interest?",
      options: [
        "Interest on savings only",
        "Interest on loans only",
        "Interest earned on both principal and previous interest",
        "A type of tax"
      ],
      correctAnswer: 2
    }
  ],
  [TOPIC_CATEGORIES.SAVINGS]: [
    {
      question: "How many months of expenses should an emergency fund cover?",
      options: [
        "1-2 months",
        "2-3 months",
        "3-6 months",
        "6-12 months"
      ],
      correctAnswer: 2
    },
    {
      question: "Where should you keep your emergency fund?",
      options: [
        "In stocks",
        "In a high-yield savings account",
        "In cryptocurrency",
        "In real estate"
      ],
      correctAnswer: 1
    },
    {
      question: "What is the primary purpose of an emergency fund?",
      options: [
        "To invest in stocks",
        "To pay for vacations",
        "To cover unexpected expenses",
        "To buy luxury items"
      ],
      correctAnswer: 2
    }
  ],
  [TOPIC_CATEGORIES.DEBT]: [
    {
      question: "Which debt repayment strategy focuses on paying the smallest debt first?",
      options: [
        "Avalanche method",
        "Snowball method",
        "Minimum payment method",
        "Interest-only method"
      ],
      correctAnswer: 1
    },
    {
      question: "What is the recommended maximum debt-to-income ratio?",
      options: [
        "20%",
        "30%",
        "40%",
        "50%"
      ],
      correctAnswer: 1
    },
    {
      question: "Which type of debt typically has the highest interest rate?",
      options: [
        "Mortgage",
        "Student loans",
        "Credit cards",
        "Car loans"
      ],
      correctAnswer: 2
    }
  ],
  "DEFAULT": [
    {
      question: "What is compound interest?",
      options: [
        "Interest paid only on the principal amount",
        "Interest paid on both the principal and accumulated interest",
        "A fixed interest rate that never changes",
        "Interest that is only paid on loans"
      ],
      correctAnswer: 1
    },
    {
      question: "Which of these is a good financial habit?",
      options: [
        "Spending your entire paycheck immediately",
        "Reviewing your budget monthly",
        "Taking on debt for non-essential purchases",
        "Ignoring your credit score"
      ],
      correctAnswer: 1
    },
    {
      question: "What is the 50/30/20 rule in budgeting?",
      options: [
        "Invest 50%, save 30%, spend 20%",
        "Spend 50% on needs, 30% on wants, and save 20%",
        "Pay 50% in taxes, 30% on housing, 20% on everything else",
        "Allocate 50% to debt repayment, 30% to savings, 20% to spending"
      ],
      correctAnswer: 1
    }
  ]
};

async function generateQuizForTopic(topic: string, description: string, count: number = 3): Promise<QuizQuestion[]> {
  // If no API key is available, immediately use fallback
  if (!genAI || !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.log("No Gemini API key configured. Using fallback quiz questions.");
    
    // Find the category that best matches the topic
    const category = findMatchingCategory(topic, description);
    
    // Return the appropriate fallback quiz
    const fallbackQuiz = fallbackQuizzes[category || "DEFAULT"];
    // Return requested number of questions, cycling through if needed
    return Array.from({ length: count }, (_, i) => fallbackQuiz[i % fallbackQuiz.length]);
  }
  
  try {
    // Update to use Gemini 1.5 Pro model which is the latest available
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Generate a diverse quiz about ${topic}. Topic description: ${description}

    Generate exactly ${count} multiple choice questions following these requirements:
    1. Each question must cover a DIFFERENT aspect of ${topic}
    2. Include a mix of:
       - Basic concept understanding
       - Practical application scenarios
       - Real-world examples
       - Problem-solving situations
       - Current trends and modern practices
    3. Questions should range from basic to advanced difficulty
    4. Each question must have exactly 4 options and one correct answer
    
    Format your response EXACTLY as a JSON array like this, with no additional text or formatting:
    [
      {
        "question": "Question text here?",
        "options": [
          "First option",
          "Second option",
          "Third option",
          "Fourth option"
        ],
        "correctAnswer": 0
      }
    ]
    
    Technical Rules:
    1. The correctAnswer must be a number from 0-3 indicating the index of the correct option
    2. Each question must have exactly 4 options
    3. Do not include any text outside the JSON array
    4. Do not use markdown formatting
    5. Ensure the JSON is properly formatted with no trailing commas
    6. Make sure each question tests a different concept or aspect of the topic`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Raw API response:", text);
    
    // Clean and parse the JSON
    try {
      // Remove any markdown formatting or extra text
      let jsonText = text.trim();
      
      // Extract JSON if wrapped in code blocks
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
      
      // Find the array portion if there's additional text
      const arrayMatch = jsonText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        jsonText = arrayMatch[0];
      }
      
      // Remove any trailing commas before closing brackets
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
      
      // Parse the cleaned JSON
      const quiz = JSON.parse(jsonText);
      
      // Validate quiz structure
      if (!Array.isArray(quiz)) {
        throw new Error("Quiz is not an array");
      }
      
      // Validate and fix each question
      const validatedQuiz = quiz.map((q, index) => {
        if (!q.question || !Array.isArray(q.options) || typeof q.correctAnswer !== 'number') {
          throw new Error(`Invalid question format at index ${index}`);
        }
        
        // Ensure exactly 4 options
        if (q.options.length !== 4) {
          throw new Error(`Question ${index + 1} does not have exactly 4 options`);
        }
        
        // Ensure correctAnswer is within valid range
        if (q.correctAnswer < 0 || q.correctAnswer > 3) {
          throw new Error(`Invalid correctAnswer for question ${index + 1}`);
        }
        
        return {
          question: q.question.trim(),
          options: q.options.map((opt: string) => opt.trim()),
          correctAnswer: q.correctAnswer
        };
      });
      
      // Ensure we have the requested number of questions
      if (validatedQuiz.length !== count) {
        throw new Error(`Expected ${count} questions but got ${validatedQuiz.length}`);
      }
      
      return validatedQuiz;
    } catch (parseError) {
      console.error("Error parsing quiz JSON:", parseError);
      console.log("Problematic JSON text:", text);
      
      // Get category for fallback
      const category = findMatchingCategory(topic, description);
      return fallbackQuizzes[category || "DEFAULT"];
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
    
    // Find the category that best matches the topic
    const category = findMatchingCategory(topic, description);
    
    // Return fallback quiz questions based on category
    return fallbackQuizzes[category || "DEFAULT"];
  }
}

export const financeTopics: Topic[] = [
  {
    id: "budgeting-basics",
    title: "Budgeting Basics",
    description: "Learn the fundamentals of creating and maintaining a budget",
    category: "Budgeting",
    videos: [],
    quiz: {
      questions: [
        {
          question: "What is the primary purpose of budgeting?",
          options: [
            "To spend more money",
            "To track and control expenses",
            "To avoid saving money",
            "To increase debt"
          ],
          correctAnswer: 1
        },
        {
          question: "Which of these is NOT a good budgeting practice?",
          options: [
            "Setting financial goals",
            "Tracking expenses",
            "Ignoring monthly bills",
            "Creating an emergency fund"
          ],
          correctAnswer: 2
        },
        {
          question: "What percentage of income is recommended for savings?",
          options: [
            "5-10%",
            "10-15%",
            "15-20%",
            "20-25%"
          ],
          correctAnswer: 2
        }
      ]
    }
  },
  {
    id: "investment-fundamentals",
    title: "Investment Fundamentals",
    description: "Understanding the basics of investing and building wealth",
    category: "Investing",
    videos: [],
    quiz: {
      questions: [
        {
          question: "What is diversification in investing?",
          options: [
            "Putting all money in one stock",
            "Spreading investments across different assets",
            "Investing only in bonds",
            "Keeping all money in savings"
          ],
          correctAnswer: 1
        },
        {
          question: "Which investment typically has the highest risk?",
          options: [
            "Government bonds",
            "Savings account",
            "Individual stocks",
            "Certificates of deposit"
          ],
          correctAnswer: 2
        },
        {
          question: "What is compound interest?",
          options: [
            "Interest on savings only",
            "Interest on loans only",
            "Interest earned on both principal and previous interest",
            "A type of tax"
          ],
          correctAnswer: 2
        }
      ]
    }
  },
  {
    id: "emergency-fund",
    title: "Emergency Fund Planning",
    description: "Learn how to build and maintain an emergency fund",
    category: "Savings",
    videos: [],
    quiz: {
      questions: [
        {
          question: "How many months of expenses should an emergency fund cover?",
          options: [
            "1-2 months",
            "2-3 months",
            "3-6 months",
            "6-12 months"
          ],
          correctAnswer: 2
        },
        {
          question: "Where should you keep your emergency fund?",
          options: [
            "In stocks",
            "In a high-yield savings account",
            "In cryptocurrency",
            "In real estate"
          ],
          correctAnswer: 1
        },
        {
          question: "What is the primary purpose of an emergency fund?",
          options: [
            "To invest in stocks",
            "To pay for vacations",
            "To cover unexpected expenses",
            "To buy luxury items"
          ],
          correctAnswer: 2
        }
      ]
    }
  },
  {
    id: "debt-management",
    title: "Debt Management Strategies",
    description: "Strategies for managing and eliminating debt",
    category: "Debt",
    videos: [],
    quiz: {
      questions: [
        {
          question: "Which debt repayment strategy focuses on paying the smallest debt first?",
          options: [
            "Avalanche method",
            "Snowball method",
            "Minimum payment method",
            "Interest-only method"
          ],
          correctAnswer: 1
        },
        {
          question: "What is the recommended maximum debt-to-income ratio?",
          options: [
            "20%",
            "30%",
            "40%",
            "50%"
          ],
          correctAnswer: 1
        },
        {
          question: "Which type of debt typically has the highest interest rate?",
          options: [
            "Mortgage",
            "Student loans",
            "Credit cards",
            "Car loans"
          ],
          correctAnswer: 2
        }
      ]
    }
  }
];

export { generateQuizForTopic, fallbackQuizzes, TOPIC_CATEGORIES }; 