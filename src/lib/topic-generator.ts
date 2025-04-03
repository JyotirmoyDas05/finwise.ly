import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.NEXT_PUBLIC_GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
  : null;

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 2; // Maximum requests per minute as per free tier
let requestTimestamps: number[] = [];
let isRateLimited = false;
let rateLimitResetTimeout: NodeJS.Timeout | null = null;

// Fallback categories and topics
const FALLBACK_CATEGORIES = [
  {
    name: "Investing",
    subcategories: ["Stocks", "Bonds", "Mutual Funds", "ETFs", "Cryptocurrency", "Real Estate Investment", "Portfolio Management"]
  },
  {
    name: "Budgeting",
    subcategories: ["Expense Tracking", "Income Management", "Zero-Based Budgeting", "50/30/20 Rule", "Envelope System"]
  },
  {
    name: "Savings",
    subcategories: ["Emergency Fund", "High-Yield Savings", "Certificates of Deposit", "Money Market Accounts", "Automatic Savings"]
  },
  {
    name: "Debt Management",
    subcategories: ["Credit Cards", "Student Loans", "Mortgage", "Debt Consolidation", "Debt Snowball", "Debt Avalanche"]
  },
  {
    name: "Retirement Planning",
    subcategories: ["401(k)", "IRA", "Pension Plans", "Social Security", "Early Retirement", "Retirement Income"]
  },
  {
    name: "Tax Planning",
    subcategories: ["Tax Deductions", "Tax Credits", "Income Tax", "Capital Gains", "Tax-Advantaged Accounts"]
  },
  {
    name: "Insurance",
    subcategories: ["Life Insurance", "Health Insurance", "Auto Insurance", "Home Insurance", "Disability Insurance"]
  },
  {
    name: "Real Estate",
    subcategories: ["Home Buying", "Mortgages", "Property Investment", "REITs", "Real Estate Market Analysis"]
  },
  {
    name: "Personal Finance",
    subcategories: ["Financial Goals", "Net Worth", "Cash Flow", "Financial Planning", "Money Management"]
  },
  {
    name: "Banking",
    subcategories: ["Checking Accounts", "Savings Accounts", "Online Banking", "Mobile Banking", "Banking Fees"]
  },
  {
    name: "Credit Building",
    subcategories: ["Credit Score", "Credit Reports", "Credit Repair", "Credit Cards", "Credit History"]
  },
  {
    name: "Financial Technology",
    subcategories: ["Digital Payments", "Mobile Wallets", "Online Trading", "Robo-Advisors", "Personal Finance Apps"]
  },
  {
    name: "Risk Management",
    subcategories: ["Diversification", "Asset Allocation", "Insurance Planning", "Emergency Planning", "Risk Assessment"]
  },
  {
    name: "Business Finance",
    subcategories: ["Small Business", "Business Planning", "Business Credit", "Cash Flow Management", "Business Loans"]
  },
  {
    name: "International Finance",
    subcategories: ["Forex", "International Investing", "Global Markets", "Currency Exchange", "International Banking"]
  }
];

function generateFallbackTopics(searchQuery: string): GeneratedTopic[] {
  const searchTerms = searchQuery.toLowerCase().split(' ');
  
  // Find matching category
  const matchingCategory = FALLBACK_CATEGORIES.find(category => 
    searchTerms.some(term => 
      category.name.toLowerCase().includes(term) || 
      category.subcategories.some(sub => sub.toLowerCase().includes(term))
    )
  ) || FALLBACK_CATEGORIES.find(cat => cat.name === "Personal Finance")!;

  // Get random subcategories for variety
  const shuffledSubcategories = [...matchingCategory.subcategories].sort(() => Math.random() - 0.5);
  
  const topics: GeneratedTopic[] = [
    {
      id: `${matchingCategory.name.toLowerCase().replace(/\s+/g, '-')}-fundamentals`,
      title: `${matchingCategory.name} Fundamentals`,
      description: `Master the essential concepts and principles of ${matchingCategory.name.toLowerCase()}. This comprehensive introduction covers key terminology, fundamental strategies, and best practices for building a strong foundation in ${matchingCategory.name.toLowerCase()}.`,
      category: matchingCategory.name,
      subtopics: [
        `Introduction to ${matchingCategory.name}`,
        shuffledSubcategories[0] || "Basic Principles",
        shuffledSubcategories[1] || "Core Concepts"
      ],
      keyPoints: [
        "Understanding Basic Terminology",
        "Essential Principles and Concepts",
        "Building Strong Foundations"
      ]
    },
    {
      id: `advanced-${matchingCategory.name.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Advanced ${matchingCategory.name}`,
      description: `Take your ${matchingCategory.name.toLowerCase()} knowledge to the next level with advanced concepts and strategies. Learn professional techniques, complex strategies, and sophisticated approaches used by industry experts.`,
      category: matchingCategory.name,
      subtopics: [
        shuffledSubcategories[2] || "Advanced Techniques",
        shuffledSubcategories[3] || "Professional Strategies",
        "Expert-Level Applications"
      ],
      keyPoints: [
        "Advanced Strategy Development",
        "Professional Techniques",
        "Complex Problem Solving"
      ]
    },
    {
      id: `practical-${matchingCategory.name.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Practical ${matchingCategory.name} Applications`,
      description: `Apply your ${matchingCategory.name.toLowerCase()} knowledge in real-world scenarios. Learn hands-on techniques, practical implementations, and real-life case studies to master practical applications.`,
      category: matchingCategory.name,
      subtopics: [
        "Real-World Case Studies",
        shuffledSubcategories[4] || "Practical Implementation",
        "Problem-Solving Scenarios"
      ],
      keyPoints: [
        "Real-World Applications",
        "Practical Implementation Strategies",
        "Case Study Analysis"
      ]
    },
    {
      id: `modern-${matchingCategory.name.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Modern ${matchingCategory.name} Trends`,
      description: `Stay current with the latest trends and developments in ${matchingCategory.name.toLowerCase()}. Explore emerging technologies, innovative approaches, and contemporary best practices shaping the future of this field.`,
      category: matchingCategory.name,
      subtopics: [
        "Current Trends",
        "Emerging Technologies",
        "Future Developments"
      ],
      keyPoints: [
        "Latest Industry Developments",
        "Modern Tools and Technologies",
        "Future Outlook"
      ]
    }
  ];

  // Add a specialized topic based on the specific search query if it matches a subcategory
  const matchingSubcategory = matchingCategory.subcategories.find(sub => 
    searchTerms.some(term => sub.toLowerCase().includes(term))
  );

  if (matchingSubcategory) {
    topics.push({
      id: `specialized-${matchingSubcategory.toLowerCase().replace(/\s+/g, '-')}`,
      title: `${matchingSubcategory} Mastery`,
      description: `Deep dive into ${matchingSubcategory} with this specialized course. Learn specific strategies, techniques, and best practices focused entirely on mastering this crucial aspect of ${matchingCategory.name.toLowerCase()}.`,
      category: matchingCategory.name,
      subtopics: [
        `${matchingSubcategory} Fundamentals`,
        `Advanced ${matchingSubcategory} Strategies`,
        `${matchingSubcategory} in Practice`
      ],
      keyPoints: [
        "Specialized Knowledge",
        "Focused Skill Development",
        "Expert-Level Mastery"
      ]
    });
  }

  return topics;
}

function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps older than the window
  requestTimestamps = requestTimestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  // Check if we've hit the limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    if (!isRateLimited) {
      isRateLimited = true;
      // Set a timeout to reset rate limit after 30 seconds (as suggested by the API error)
      rateLimitResetTimeout = setTimeout(() => {
        isRateLimited = false;
        requestTimestamps = [];
        if (rateLimitResetTimeout) {
          clearTimeout(rateLimitResetTimeout);
          rateLimitResetTimeout = null;
        }
      }, 30000);
    }
    return false;
  }
  
  // Add current timestamp and return true
  requestTimestamps.push(now);
  return true;
}

export interface GeneratedTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  subtopics?: string[];
  keyPoints?: string[];
}

export async function generateRelatedTopics(searchQuery: string): Promise<GeneratedTopic[]> {
  // If rate limited or no API key, use fallback
  if (isRateLimited || !genAI || !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.log(isRateLimited ? "Rate limited, using fallback topics" : "No API key, using fallback topics");
    return generateFallbackTopics(searchQuery);
  }

  // Check rate limit
  if (!checkRateLimit()) {
    console.log("Rate limit reached, using fallback topics");
    return generateFallbackTopics(searchQuery);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Generate 5 detailed financial topics related to "${searchQuery}".
    
    Instructions:
    1. Each topic should be unique and specific
    2. Topics should range from beginner to advanced concepts
    3. Include both theoretical and practical aspects
    4. Ensure topics are educational and relevant to financial literacy
    
    Format the response as a JSON array with the following structure:
    [
      {
        "id": "unique-id-based-on-title",
        "title": "Topic Title",
        "description": "Detailed description of the topic (2-3 sentences)",
        "category": "Main category (e.g., Investing, Budgeting, Savings, etc.)",
        "subtopics": ["Related subtopic 1", "Related subtopic 2", "Related subtopic 3"],
        "keyPoints": ["Key learning point 1", "Key learning point 2", "Key learning point 3"]
      }
    ]
    
    Make sure each topic is comprehensive and educational.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      let jsonText = text;
      const jsonMatch = text.match(/```json\s*\n?([\s\S]*?)```/) || 
                       text.match(/```\s*\n?([\s\S]*?)```/) ||
                       text.match(/\[\s*\{/);
      
      if (jsonMatch) {
        jsonText = jsonMatch[1] || text.substring(text.indexOf('['));
      }
      
      const topics = JSON.parse(jsonText);
      
      return topics.map((topic: GeneratedTopic) => ({
        ...topic,
        id: topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }));
    } catch (parseError) {
      console.error("Error parsing generated topics:", parseError);
      return generateFallbackTopics(searchQuery);
    }
  } catch (error) {
    console.error("Error generating topics:", error);
    // Check if error is rate limit related
    if (error instanceof Error && error.toString().includes("429")) {
      isRateLimited = true;
      // Set timeout to reset rate limit after 30 seconds
      setTimeout(() => {
        isRateLimited = false;
        requestTimestamps = [];
      }, 30000);
    }
    return generateFallbackTopics(searchQuery);
  }
} 