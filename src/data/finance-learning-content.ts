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
    
    const prompt = `Generate a quiz about ${topic}. Topic description: ${description}
    Generate ${count} multiple choice questions with 4 options each.
    Format the response as a JSON array of objects with the following structure:
    [
      {
        "question": "Question text",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": 0 // Index of correct answer (0-3)
      }
    ]
    Make sure the questions are educational and test understanding of the topic.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Raw API response:", text);
    
    // Try to find JSON in the response or use fallbacks
    if (!text || text.trim().length === 0) {
      console.log("Empty response from API, using fallback");
      const category = findMatchingCategory(topic, description);
      return fallbackQuizzes[category || "DEFAULT"];
    }
    
    // Ensure the response is valid JSON
    try {
      // Check if response text is wrapped in markdown or other text
      let jsonText = text;
      
      // Try to extract JSON if response is wrapped in markdown or other text
      const jsonStartMatch = text.match(/```json\s*\n?([\s\S]*?)```/) || 
                             text.match(/```\s*\n?([\s\S]*?)```/) ||
                             text.match(/\[\s*\{/);
      
      if (jsonStartMatch) {
        // Extract just the JSON part
        const possibleJson = jsonStartMatch[1] || text.substring(text.indexOf('['));
        console.log("Extracted potential JSON:", possibleJson);
        jsonText = possibleJson;
      }
      
      // Try to parse the JSON
      let quiz;
      try {
        quiz = JSON.parse(jsonText);
      } catch (initialParseError) {
        // Look for array pattern and try to extract just that part
        const arrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (arrayMatch) {
          console.log("Trying to parse JSON array directly");
          quiz = JSON.parse(arrayMatch[0]);
        } else {
          throw initialParseError;
        }
      }
      
      // Validate quiz structure
      if (Array.isArray(quiz) && quiz.length > 0 && quiz[0].question && 
          Array.isArray(quiz[0].options) && quiz[0].options.length > 0 && 
          typeof quiz[0].correctAnswer === 'number') {
        return quiz;
      } else {
        console.error("Invalid quiz format received:", quiz);
        throw new Error("Invalid quiz format");
      }
    } catch (parseError) {
      console.error("Error parsing quiz JSON:", parseError);
      console.log("Could not parse response as JSON, using fallback");
      
      // Get category for fallback
      const category = findMatchingCategory(topic, description);
      
      // Return fallback quiz
      return fallbackQuizzes[category || "DEFAULT"];
    }
  } catch (error: unknown) {
    console.error("Error generating quiz:", error);
    
    // If the error is because of model availability, try fallback model
    if (error instanceof Error && error.toString().includes("not found")) {
      try {
        // Try with gemini-1.0-pro if 1.5 is not available
        console.log("Trying fallback model gemini-1.0-pro");
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        
        const prompt = `Generate a quiz about ${topic}. Topic description: ${description}
        Generate ${count} multiple choice questions with 4 options each.
        Format the response as a JSON array of objects with the following structure:
        [
          {
            "question": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": 0 // Index of correct answer (0-3)
          }
        ]
        Make sure the questions are educational and test understanding of the topic.`;

        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("Raw API response:", text);
        
        // Try to find JSON in the response or use fallbacks
        if (!text || text.trim().length === 0) {
          console.log("Empty response from API, using fallback");
          const category = findMatchingCategory(topic, description);
          return fallbackQuizzes[category || "DEFAULT"];
        }
        
        // Ensure the response is valid JSON
        try {
          // Parse the JSON response
          const quiz = JSON.parse(text);
          
          // Validate quiz structure
          if (Array.isArray(quiz) && quiz.length > 0 && quiz[0].question && 
              Array.isArray(quiz[0].options) && quiz[0].options.length > 0 && 
              typeof quiz[0].correctAnswer === 'number') {
            return quiz;
          } else {
            console.error("Invalid quiz format received:", quiz);
            throw new Error("Invalid quiz format");
          }
        } catch (fallbackParseError) {
          console.error("Error parsing fallback quiz JSON:", fallbackParseError);
          console.log("Raw fallback response:", text);
          
          // Get category for fallback
          const fallbackCategory = Object.values(TOPIC_CATEGORIES).find(cat => 
            topic.toLowerCase().includes(cat.toLowerCase()) || 
            description.toLowerCase().includes(cat.toLowerCase())
          );
          
          // Return fallback quiz
          return fallbackQuizzes[fallbackCategory || "DEFAULT"];
        }
      } catch (fallbackError) {
        console.error("Error with fallback model:", fallbackError);
      }
    }
    
    // Find the category that best matches the topic
    const category = Object.values(TOPIC_CATEGORIES).find(cat => 
      topic.toLowerCase().includes(cat.toLowerCase()) || 
      description.toLowerCase().includes(cat.toLowerCase())
    );
    
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