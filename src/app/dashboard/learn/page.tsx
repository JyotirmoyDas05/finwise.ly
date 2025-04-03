'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, Search, BookOpen, Target, Award, Clock, CheckCircle, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { financeTopics } from "@/data/finance-learning-content";
import { searchYouTubeVideos, getVideoDetails, formatDuration, type YouTubeVideo } from "@/lib/youtube";
import { generateQuizForTopic } from "@/data/finance-learning-content";
import { generateRelatedTopics, type GeneratedTopic } from "@/lib/topic-generator";

interface Quiz {
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

interface Topic {
  id: string;
  title: string;
  category: string;
  description: string;
  completed?: boolean;
  progress?: number;
  quiz?: {
    questions: QuizQuestion[];
  };
  videos?: any[];
}

interface LearningProgress {
  watchedVideos: string[];
  quizScores: {
    [topicId: string]: number;
  };
  completedTopics: string[];
  completedVideos: string[];
  completedQuizzes: string[];
  averageQuizScore: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  questions: QuizQuestion[];
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answerChoices: number[];
  questions: QuizQuestion[];
}

export default function LearnFinancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({
    watchedVideos: [],
    quizScores: {},
    completedTopics: [],
    completedVideos: [],
    completedQuizzes: [],
    averageQuizScore: 0
  });
  const [youtubeVideos, setYoutubeVideos] = useState<{ [key: string]: YouTubeVideo[] }>({});
  const [loadingVideos, setLoadingVideos] = useState<{ [key: string]: boolean }>({});
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizCount, setQuizCount] = useState(3);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      router.push("/login");
      return;
    }

    fetchTopics();
    fetchLearningProgress();
  }, [user, router]);

  useEffect(() => {
    // Fetch YouTube videos for each topic when topics are loaded
    if (topics.length > 0) {
      topics.forEach(topic => {
        fetchTopicVideos(topic);
      });
    }
  }, [topics]);

  const fetchTopics = async () => {
    try {
      // In a real app, this would fetch from your backend/API
      const topicsWithProgress = financeTopics.map(topic => ({
        ...topic,
        completed: false,
        progress: 0,
      }));
      setTopics(topicsWithProgress);
    } catch (error) {
      console.error("Error fetching topics:", error);
      toast.error("Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningProgress = async () => {
    if (!user?.uid) return;

    try {
      const progressDocRef = doc(db, "users", user.uid, "learning_progress", "main");
      const progressDoc = await getDoc(progressDocRef);

      if (progressDoc.exists()) {
        // Document exists, set the learning progress
        setLearningProgress(progressDoc.data() as LearningProgress);
      } else {
        // Document doesn't exist, create it with default values
        const defaultProgress: LearningProgress = {
          watchedVideos: [],
          quizScores: {},
          completedTopics: [],
          completedVideos: [],
          completedQuizzes: [],
          averageQuizScore: 0
        };

        // Create the document in Firestore
        await setDoc(progressDocRef, defaultProgress);
        console.log("Created new learning progress document");
        
        // Set the local state
        setLearningProgress(defaultProgress);
      }
    } catch (error) {
      console.error("Error fetching learning progress:", error);
      toast.error("Failed to load your learning progress");
    }
  };

  const fetchTopicVideos = async (topic: Topic) => {
    if (loadingVideos[topic.id]) return;
    
    setLoadingVideos(prev => ({ ...prev, [topic.id]: true }));
    try {
      const searchQuery = `${topic.title} ${topic.category} finance education`;
      const response = await searchYouTubeVideos(searchQuery, 2);
      
      if (response?.items?.length > 0) {
        // Get video IDs from search results
        const videoIds = response.items.map(item => item.id.videoId);
        
        // Fetch video details to get contentDetails
        const videoDetails = await getVideoDetails(videoIds);
        
        // Merge search results with video details
        const videosWithDetails = response.items.map(item => {
          const details = videoDetails.find(v => v.id.videoId === item.id.videoId);
          return {
            ...item,
            contentDetails: details?.contentDetails || { duration: "PT0M0S" }
          };
        });

        setYoutubeVideos(prev => ({
          ...prev,
          [topic.id]: videosWithDetails
        }));
      }
    } catch (error) {
      console.error(`Error fetching videos for topic ${topic.id}:`, error);
      toast.error("Failed to load videos");
    } finally {
      setLoadingVideos(prev => ({ ...prev, [topic.id]: false }));
    }
  };

  const updateLearningProgress = async (videoId: string, topicId: string) => {
    if (!user?.uid) return;

    try {
      const progressRef = doc(db, "users", user.uid, "learning_progress", "main");
      
      // Check if topic is not already completed
      const updatedCompletedTopics = learningProgress.completedTopics.includes(topicId)
        ? learningProgress.completedTopics
        : [...learningProgress.completedTopics, topicId];

      // Check if document exists
      const progressDoc = await getDoc(progressRef);
      
      if (!progressDoc.exists()) {
        // Document doesn't exist, create it with our data
        const newProgress = {
          watchedVideos: [videoId],
          quizScores: {},
          completedTopics: updatedCompletedTopics,
          completedVideos: [videoId],
          completedQuizzes: [],
          averageQuizScore: 0
        };
        
        await setDoc(progressRef, newProgress);
        console.log("Created new learning progress document with video progress");
        toast.success("Progress saved!");
        
        // Update local state
        setLearningProgress(newProgress);
      } else {
        // Document exists, update it
        await updateDoc(progressRef, {
          watchedVideos: arrayUnion(videoId),
          completedVideos: arrayUnion(videoId),
          completedTopics: arrayUnion(topicId)
        });
        
        setLearningProgress(prev => ({
          ...prev,
          watchedVideos: [...prev.watchedVideos, videoId],
          completedVideos: [...prev.completedVideos, videoId],
          completedTopics: updatedCompletedTopics
        }));
        
        toast.success("Progress updated!");
      }
      
      // Update topics state to mark as completed
      const updatedTopics = topics.map(topic => 
        topic.id === topicId 
          ? { ...topic, completed: true, progress: 100 }
          : topic
      );
      setTopics(updatedTopics);
    } catch (error) {
      console.error("Error updating learning progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const handleVideoSelect = (video: YouTubeVideo, topic: Topic) => {
    if (!video?.id?.videoId) {
      toast.error('Video not available');
      return;
    }
    setSelectedVideo(video);
    setSelectedTopic(topic);
  };

  const handleVideoComplete = async () => {
    if (!selectedVideo || !selectedTopic || !user?.uid) {
      return;
    }

    const videoId = selectedVideo.id.videoId;
    const topicId = selectedTopic.id;

    try {
      // Create a reference to the learning progress document
      const progressRef = doc(db, "users", user.uid, "learning_progress", "main");

      // Check if topic is not already completed
      const updatedCompletedTopics = learningProgress.completedTopics.includes(topicId)
        ? learningProgress.completedTopics
        : [...learningProgress.completedTopics, topicId];

      // First check if the document exists
      const progressDoc = await getDoc(progressRef);
      
      if (!progressDoc.exists()) {
        // Document doesn't exist, create it first with default values + our updates
        const newProgress = {
          watchedVideos: [videoId],
          quizScores: {},
          completedTopics: updatedCompletedTopics,
          completedVideos: [videoId],
          completedQuizzes: [],
          averageQuizScore: 0
        };
        
        await setDoc(progressRef, newProgress);
        console.log("Created new learning progress document with video progress");
        
        // Update local state
        setLearningProgress(newProgress);
      } else {
        // Document exists, update it
        await updateDoc(progressRef, {
          watchedVideos: arrayUnion(videoId),
          completedVideos: arrayUnion(videoId),
          completedTopics: updatedCompletedTopics
        });

        // Update local state
        setLearningProgress(prev => ({
          ...prev,
          watchedVideos: [...prev.watchedVideos, videoId],
          completedVideos: [...prev.completedVideos, videoId],
          completedTopics: updatedCompletedTopics
        }));
      }

      // Update topics state to mark as completed
      const updatedTopics = topics.map(topic => 
        topic.id === topicId 
          ? { ...topic, completed: true, progress: 100 }
          : topic
      );
      setTopics(updatedTopics);
      
      // Show success message
      toast.success("Video completed and progress saved!");
    } catch (error) {
      console.error("Error updating video progress:", error);
      toast.error("Failed to save video progress");
    }
  };

  const handleQuizStart = async (topic: Topic) => {
    try {
      setSelectedTopic(topic);
      
      // Show quiz setup dialog first
      setShowQuizSetup(true);
    } catch (error) {
      console.error("Error setting up quiz:", error);
      toast.error("Failed to set up quiz");
    }
  };
  
  const handleQuizSetupComplete = async () => {
    try {
      if (!selectedTopic) return;
      
      // Always generate a fresh quiz using AI - never use existing cached quizzes
      toast.info(`Generating a new ${quizCount}-question quiz for you...`);
      
      // Generate fresh quiz questions for this attempt
      const timestamp = new Date().getTime(); // Add timestamp to ensure uniqueness
      const randomSeed = Math.floor(Math.random() * 1000); // Add random seed
      
      // Add the timestamp and random seed to make each request unique
      const quizQuestions = await generateQuizForTopic(
        `${selectedTopic.title} (${timestamp}-${randomSeed})`, 
        selectedTopic.description,
        quizCount
      );
      
      // Set the quiz without updating the topic
      setSelectedQuiz({ questions: quizQuestions });
      setShowQuizSetup(false);
      setCurrentQuestion(0);
      setQuizAnswers([]);
      setSelectedAnswerIndex(null);
      setIsAnswerSubmitted(false);
      setQuizCompleted(false);
      setQuizResult(null);
      setShowQuiz(true);
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz");
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswerSubmitted) return; // Prevent changing answer after submission
    setSelectedAnswerIndex(answerIndex);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswerIndex === null || isAnswerSubmitted) return;
    
    // Record the answer
    setQuizAnswers(prev => [...prev, selectedAnswerIndex]);
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (selectedQuiz?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz completed
      calculateQuizScore();
    }
  };

  const calculateQuizScore = async () => {
    if (!selectedTopic || !selectedQuiz || !user?.uid) return;

    const correctAnswers = quizAnswers.reduce((acc: number, answer: number, index: number) => {
      return acc + (answer === selectedQuiz.questions[index].correctAnswer ? 1 : 0);
    }, 0);
    
    const score = (correctAnswers / selectedQuiz.questions.length) * 100;

    // Create a unique quiz ID to track completed quizzes
    const quizId = `${selectedTopic.id}-${new Date().getTime()}`;

    // Calculate new average quiz score
    const quizScores = {
      ...learningProgress.quizScores,
      [selectedTopic.id]: score
    };
    
    // Get all quiz scores as an array
    const allScores = Object.values(quizScores);
    // Calculate new average score
    const newAverageScore = allScores.length > 0 
      ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) 
      : 0;

    // Check if topic is not already completed
    const updatedCompletedTopics = learningProgress.completedTopics.includes(selectedTopic.id)
      ? learningProgress.completedTopics
      : [...learningProgress.completedTopics, selectedTopic.id];

    try {
      // Create a reference to the learning progress document
      const progressRef = doc(db, "users", user.uid, "learning_progress", "main");
      
      // Check if the document exists
      const progressDoc = await getDoc(progressRef);
      
      if (!progressDoc.exists()) {
        // Document doesn't exist, create it with our data
        const newProgress = {
          watchedVideos: [],
          quizScores: quizScores,
          completedTopics: updatedCompletedTopics,
          completedVideos: [],
          completedQuizzes: [quizId],
          averageQuizScore: newAverageScore
        };
        
        await setDoc(progressRef, newProgress);
        console.log("Created new learning progress document with quiz results");
        toast.success("Quiz progress saved");
        
        // Update local state
        setLearningProgress(newProgress);
      } else {
        // Document exists, update it
        await updateDoc(progressRef, {
          quizScores: quizScores,
          completedQuizzes: arrayUnion(quizId),
          completedTopics: updatedCompletedTopics,
          averageQuizScore: newAverageScore
        });
        
        console.log("Learning progress updated successfully");
        toast.success("Quiz progress saved");
        
        // Update local state
        setLearningProgress(prev => ({
          ...prev,
          quizScores: quizScores,
          completedQuizzes: [...prev.completedQuizzes, quizId],
          completedTopics: updatedCompletedTopics,
          averageQuizScore: newAverageScore
        }));
      }
      
      // Set quiz result for display
      setQuizResult({
        score,
        totalQuestions: selectedQuiz.questions.length,
        correctAnswers,
        answerChoices: quizAnswers,
        questions: selectedQuiz.questions
      });
      
      setQuizCompleted(true);
    } catch (error) {
      console.error("Error updating learning progress:", error);
      toast.error("Failed to save quiz progress");
    }
  };

  const resetQuiz = () => {
    setShowQuiz(false);
    setCurrentQuestion(0);
    setQuizAnswers([]);
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
    setQuizCompleted(false);
    setQuizResult(null);
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    // Only filter existing topics while typing
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!searchInput.trim()) {
        setGeneratedTopics([]);
        return;
      }

      setIsSearching(true);
      try {
        const newTopics = await generateRelatedTopics(searchInput);
        setGeneratedTopics(newTopics);
        
        // Fetch videos for new topics
        newTopics.forEach(topic => {
          fetchTopicVideos({
            ...topic,
            completed: false,
            progress: 0,
            videos: []
          });
        });
      } catch (error) {
        console.error("Error generating topics:", error);
        toast.error("Failed to generate topics");
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Modify the existing topics state to include generated topics
  const allTopics = [...topics, ...generatedTopics.map(topic => ({
    ...topic,
    completed: false,
    progress: 0,
    videos: []
  }))];

  // Update the filtered topics logic
  const filteredTopics = allTopics.filter(topic => {
    const matchesSearch = !searchQuery.trim() || 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(topics.map(topic => topic.category))];

  const getProgressPercentage = () => {
    if (topics.length === 0) return 0;
    return (learningProgress.completedTopics.length / topics.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-gray-900">
      <DashboardSidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Learn Finance
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Master financial literacy with our curated video content and interactive quizzes
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search or discover new financial topics (press Enter to search)..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleSearchSubmit}
                  className="pl-10 h-12 rounded-xl border-2 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  className="rounded-xl border-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setSelectedCategory("all")}
                >
                  All Topics
                </Button>
                {Array.from(new Set(allTopics.map(t => t.category))).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="rounded-xl border-2 transition-colors hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-b from-background to-background/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Your Learning Progress</CardTitle>
              <CardDescription>Track your journey to financial literacy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="text-sm font-medium text-primary">
                    {Math.round((learningProgress.completedTopics.length / topics.length) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(learningProgress.completedTopics.length / topics.length) * 100} 
                  className="h-2 rounded-full"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {learningProgress.completedTopics.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Topics Completed</div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {learningProgress.completedVideos.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Videos Watched</div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {learningProgress.completedQuizzes.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes Completed</div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {learningProgress.averageQuizScore}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <Card key={topic.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-background/40 backdrop-blur-sm border-0">
                <div className="aspect-video relative">
                  {loadingVideos[topic.id] ? (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  ) : youtubeVideos[topic.id]?.[0] ? (
                    <img
                      src={youtubeVideos[topic.id][0].snippet.thumbnails.high.url}
                      alt={topic.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <img
                      src="/placeholder.svg"
                      alt={topic.title}
                      className="object-cover w-full h-full"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                      onClick={() => {
                        const video = youtubeVideos[topic.id]?.[0];
                        if (video) {
                          handleVideoSelect(video, topic);
                        }
                      }}
                      disabled={!youtubeVideos[topic.id]?.[0]}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="rounded-full px-3 py-1">{topic.category}</Badge>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {youtubeVideos[topic.id]?.[0] 
                          ? formatDuration(youtubeVideos[topic.id][0].contentDetails.duration)
                          : "Loading..."}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {topic.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {youtubeVideos[topic.id]?.length || 0} videos
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => handleQuizStart(topic)}
                      >
                        Take Quiz
                      </Button>
                      {learningProgress.completedTopics.includes(topic.id) && (
                        <Badge variant="success" className="rounded-full px-3 py-1">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quiz Setup Dialog */}
          <Dialog open={showQuizSetup} onOpenChange={setShowQuizSetup}>
            <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-gray-800 max-h-[90vh] w-[95vw] overflow-visible">
              <button 
                onClick={() => setShowQuizSetup(false)} 
                className="absolute right-4 top-4 z-50 rounded-full bg-white/90 dark:bg-gray-700/90 p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Quiz Setup
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-300">
                  Customize your quiz experience for {selectedTopic?.title || "this topic"}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <label htmlFor="questionCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Number of Questions
                  </label>
                  <Input
                    id="questionCount"
                    type="number"
                    min={1}
                    max={10}
                    value={quizCount}
                    onChange={(e) => setQuizCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 3)))}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose between 1-10 questions (more questions = more comprehensive assessment)
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="outline" onClick={() => setShowQuizSetup(false)}>
                  Cancel
                </Button>
                <Button onClick={handleQuizSetupComplete}>
                  Start Quiz
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quiz Dialog */}
          <Dialog open={showQuiz} onOpenChange={(open) => !open && resetQuiz()}>
            <DialogContent className="sm:max-w-xl p-6 bg-white dark:bg-gray-800 max-h-[90vh] w-[95vw] overflow-auto">
              <button 
                onClick={resetQuiz} 
                className="absolute right-4 top-4 z-50 rounded-full bg-white/90 dark:bg-gray-700/90 p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
              
              {!quizCompleted ? (
                <div className="space-y-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedTopic?.title} Quiz
                    </DialogTitle>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Question {currentQuestion + 1} of {selectedQuiz?.questions.length}
                      </span>
                      <Progress 
                        value={((currentQuestion + 1) / (selectedQuiz?.questions.length || 1)) * 100} 
                        className="h-2 w-24"
                      />
                    </div>
                  </DialogHeader>
                  
                  {selectedQuiz?.questions[currentQuestion] && (
                    <div className="space-y-6">
                      <div className="font-medium text-gray-900 dark:text-white text-lg">
                        {selectedQuiz.questions[currentQuestion].question}
                      </div>
                      
                      <div className="space-y-3">
                        {selectedQuiz.questions[currentQuestion].options.map((option, index) => (
                          <div 
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            className={cn(
                              "p-4 border rounded-lg cursor-pointer transition-all",
                              selectedAnswerIndex === index && !isAnswerSubmitted
                                ? "border-primary bg-primary/10" 
                                : "border-gray-200 dark:border-gray-700 hover:border-primary",
                              isAnswerSubmitted && index === selectedQuiz.questions[currentQuestion].correctAnswer
                                ? "border-green-500 bg-green-100 dark:bg-green-900/30" 
                                : "",
                              isAnswerSubmitted && selectedAnswerIndex === index && index !== selectedQuiz.questions[currentQuestion].correctAnswer
                                ? "border-red-500 bg-red-100 dark:bg-red-900/30" 
                                : ""
                            )}
                          >
                            <div className="flex items-center">
                              <div className={cn(
                                "flex-shrink-0 h-5 w-5 rounded-full border mr-3 flex items-center justify-center",
                                selectedAnswerIndex === index && !isAnswerSubmitted
                                  ? "border-primary bg-primary text-white" 
                                  : "border-gray-300 dark:border-gray-600",
                                isAnswerSubmitted && index === selectedQuiz.questions[currentQuestion].correctAnswer
                                  ? "border-green-500 bg-green-500 text-white" 
                                  : "",
                                isAnswerSubmitted && selectedAnswerIndex === index && index !== selectedQuiz.questions[currentQuestion].correctAnswer
                                  ? "border-red-500 bg-red-500 text-white" 
                                  : ""
                              )}>
                                {isAnswerSubmitted && index === selectedQuiz.questions[currentQuestion].correctAnswer && (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                                {isAnswerSubmitted && selectedAnswerIndex === index && index !== selectedQuiz.questions[currentQuestion].correctAnswer && (
                                  <X className="h-3 w-3" />
                                )}
                              </div>
                              <span className="text-gray-800 dark:text-gray-200">{option}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4">
                        {!isAnswerSubmitted ? (
                          <Button 
                            onClick={handleAnswerSubmit}
                            disabled={selectedAnswerIndex === null}
                            className="w-full"
                          >
                            Submit Answer
                          </Button>
                        ) : (
                          <Button 
                            onClick={handleNextQuestion}
                            className="w-full"
                          >
                            {currentQuestion < (selectedQuiz.questions.length - 1) ? 'Next Question' : 'View Results'}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      Quiz Results
                    </DialogTitle>
                  </DialogHeader>
                  
                  {quizResult && (
                    <div className="space-y-6">
                      <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <div className="text-5xl font-bold mb-2">
                          {Math.round(quizResult.score)}%
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          You answered {quizResult.correctAnswers} out of {quizResult.totalQuestions} questions correctly
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 dark:text-white border-b pb-2">Question Summary</h4>
                        {quizResult.questions.map((question, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-start">
                              <div className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center mt-0.5 mr-2",
                                quizResult.answerChoices[index] === question.correctAnswer 
                                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              )}>
                                {quizResult.answerChoices[index] === question.correctAnswer 
                                  ? <CheckCircle className="h-3 w-3" />
                                  : <X className="h-3 w-3" />
                                }
                              </div>
                              <div>
                                <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                  {question.question}
                                </div>
                                <div className="text-sm mt-1">
                                  <span className="text-gray-600 dark:text-gray-400">Your answer: </span>
                                  <span className={cn(
                                    quizResult.answerChoices[index] === question.correctAnswer
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  )}>
                                    {question.options[quizResult.answerChoices[index]]}
                                  </span>
                                </div>
                                {quizResult.answerChoices[index] !== question.correctAnswer && (
                                  <div className="text-sm mt-1">
                                    <span className="text-gray-600 dark:text-gray-400">Correct answer: </span>
                                    <span className="text-green-600 dark:text-green-400">
                                      {question.options[question.correctAnswer]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-4 flex space-x-3">
                        <Button variant="outline" onClick={resetQuiz} className="flex-1">
                          Close
                        </Button>
                        <Button 
                          onClick={() => {
                            resetQuiz();
                            handleQuizStart(selectedTopic!);
                          }}
                          className="flex-1"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Video Dialog */}
          <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
            <DialogContent className="max-w-3xl bg-white dark:bg-gray-900 p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh] sm:max-h-[85vh] w-[95vw]">
              <button 
                onClick={() => setSelectedVideo(null)} 
                className="absolute right-4 top-4 z-50 rounded-full bg-white/90 dark:bg-gray-800/90 p-2 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                aria-label="Close dialog"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800 dark:text-white">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <div className="flex flex-col w-full">
                <div className="w-full bg-black">
                  <div className="aspect-video w-full">
                    {selectedVideo?.id?.videoId ? (
                      <iframe
                        key={selectedVideo.id.videoId}
                        src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1&rel=0&modestbranding=1`}
                        title={selectedVideo.snippet.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center space-y-4">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <p className="text-sm text-gray-400">Loading video...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <DialogTitle className="text-lg font-semibold leading-tight text-gray-900 dark:text-white">
                        {selectedVideo?.snippet.title || "Loading..."}
                      </DialogTitle>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(selectedVideo?.contentDetails?.duration || "PT0M0S")}</span>
                        <span>•</span>
                        <span>{selectedVideo?.snippet.channelTitle || "Loading..."}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-gray-900 dark:text-white">Category</h4>
                        <Badge variant="secondary" className="mt-1 rounded-lg text-xs">
                          {selectedTopic?.category || "Loading..."}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 border-t dark:border-gray-800 pt-3 mt-3">
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-1">About this lesson</h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line max-h-[20vh] overflow-y-auto pr-2">
                        {selectedVideo?.snippet.description || "Loading description..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 