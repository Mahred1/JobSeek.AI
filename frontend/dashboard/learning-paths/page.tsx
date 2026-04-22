"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { learningPathsApi } from "@/lib/api";
import { LearningPath, Niche, PathQuestion } from "@/lib/models/learning-path";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { hasToken } from "@/lib/auth";
import Link from "next/link";

// Steps in the learning path journey
enum PathStep {
  SELECT_NICHE = "select_niche",
  ANSWER_QUESTIONS = "answer_questions",
  VIEW_PATH = "view_path",
}

export default function LearningPathsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("create");

  // State for the learning path journey
  const [step, setStep] = useState<PathStep>(PathStep.SELECT_NICHE);
  const [selectedNiche, setSelectedNiche] = useState<number | null>(null);
  const [customNiche, setCustomNiche] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingPath, setLoadingPath] = useState(false);
  const [useAiQuestions, setUseAiQuestions] = useState(true);
  const [customAnswer, setCustomAnswer] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Data states
  const [niches, setNiches] = useState<Niche[]>([]);
  const [displayedNiches, setDisplayedNiches] = useState<Niche[]>([]);
  const [questions, setQuestions] = useState<PathQuestion[]>([]);
  const [generatedPath, setGeneratedPath] = useState<LearningPath | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Saved paths state
  const [savedPaths, setSavedPaths] = useState<LearningPath[]>([]);
  const [loadingSavedPaths, setLoadingSavedPaths] = useState(false);
  const [savedPathsError, setSavedPathsError] = useState<string | null>(null);

  // Check for tab URL parameter on mount
  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");

    if (tabParam === "saved") {
      setActiveTab("saved");
    }
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    if (!hasToken()) {
      router.push("/login");
    }
  }, [router]);

  // Load user's saved paths
  useEffect(() => {
    const fetchSavedPaths = async () => {
      if (activeTab !== "saved") return;

      try {
        setLoadingSavedPaths(true);
        setSavedPathsError(null);

        // Check authentication first
        if (!hasToken()) {
          router.push("/login");
          return;
        }

        const paths = await learningPathsApi.getUserPaths();
        setSavedPaths(paths);
      } catch (err) {
        console.error("Failed to fetch saved learning paths:", err);
        // Check for authentication error
        if (err instanceof Error && err.message.includes("401")) {
          setSavedPathsError("Your session has expired. Please log in again.");
          router.push("/login");
          return;
        }
        setSavedPathsError(
          "Failed to load your saved learning paths. Please try again later."
        );
      } finally {
        setLoadingSavedPaths(false);
      }
    };

    if (isAuthenticated) {
      fetchSavedPaths();
    }
  }, [activeTab, isAuthenticated, router]);


  // Load niches on initial load
  useEffect(() => {
    const fetchNiches = async () => {
      try {
        setLoading(true);

        // Check authentication first
        if (!hasToken()) {
          router.push("/login");
          return;
        }

        const fetchedNiches = await learningPathsApi.getNiches();
        setNiches(fetchedNiches);
        setDisplayedNiches(fetchedNiches);
      } catch (err) {
        console.error("Failed to fetch niches:", err);
        // Check for authentication error
        if (err instanceof Error && err.message.includes("401")) {
          setError("Your session has expired. Please log in again.");
          router.push("/login");
          return;
        }
        setError("Failed to load industry niches. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchNiches();
    }
  }, [isAuthenticated, router]);

  // Filter niches based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setDisplayedNiches(niches);
    } else {
      const filtered = niches.filter(
        (niche) =>
          niche.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          niche.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setDisplayedNiches(filtered);
    }
  }, [searchQuery, niches]);

  // Handle niche selection and load questions
  const handleSelectNiche = async (nicheId: number) => {
    setSelectedNiche(nicheId);
    setError(null);

    // If Other is selected, we stay on this step until a custom niche is entered
    if (nicheId === 16) {
      return;
    }

    try {
      setLoading(true);

      // Check authentication first
      if (!hasToken()) {
        router.push("/login");
        return;
      }

      // Fetch questions for the selected niche
      const fetchedQuestions = await learningPathsApi.getQuestions(
        nicheId,
        useAiQuestions
      );
      setQuestions(fetchedQuestions);
      setStep(PathStep.ANSWER_QUESTIONS);
      setCurrentQuestionIndex(0);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      // Check for authentication error
      if (err instanceof Error && err.message.includes("401")) {
        setError("Your session has expired. Please log in again.");
        router.push("/login");
        return;
      }
      setError(
        "Failed to load questions for this industry. Please try another one or try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle custom niche input
  const handleCustomNicheSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customNiche.trim()) {
      setStep(PathStep.ANSWER_QUESTIONS);
      setCurrentQuestionIndex(0);
      // For custom niches, we'll use a predefined set of general questions
      // In a real implementation, you might fetch general questions from the backend
      // For now, we'll just simulate it by using the same questions flow
    }
  };

  // Update answer for current question
  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  // Navigate to next question or finish quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCustomAnswer("");
      setShowCustomInput(false);
    } else {
      // All questions answered, generate learning path
      generateLearningPath();
    }
  };

  // Generate a learning path based on answers
  const generateLearningPath = async () => {
    setLoadingPath(true);
    setError(null);

    // Check if user is authenticated before making the request
    if (!hasToken()) {
      setError("You must be logged in to generate a learning path");
      router.push("/login");
      setLoadingPath(false);
      return;
    }

    try {
      // Create the request object
      const request = {
        nicheId: selectedNiche || 0,
        customNiche: selectedNiche === 16 ? customNiche : undefined,
        answers: answers,
      };

      // Call the API to generate the path
      const path = await learningPathsApi.generatePath(request);
      setGeneratedPath(path);

      // Automatically save the generated path
      const savedPath = await learningPathsApi.savePath(path);

      // Show success message
      const saveNotification = document.createElement("div");
      saveNotification.className =
        "fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md shadow-md z-50";
      saveNotification.innerHTML = `
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Learning path saved automatically!</span>
        </div>
      `;
      document.body.appendChild(saveNotification);

      // Remove the notification after 3 seconds
      setTimeout(() => {
        saveNotification.remove();
      }, 3000);

      // Add to saved paths
      setSavedPaths([savedPath, ...savedPaths]);

      setStep(PathStep.VIEW_PATH);
    } catch (err: any) {
      console.error("Failed to generate learning path:", err);
      // Check specifically for authentication errors
      if (err.message && err.message.includes("401")) {
        setError("Authentication failed. Please log in again.");
        router.push("/login");
      } else {
        setError(
          "Failed to generate your learning path. Please try again later."
        );
      }
    } finally {
      setLoadingPath(false);
    }
  };

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCustomAnswer("");
      setShowCustomInput(false);
    }
  };

  // Get niche name (selected or custom)
  const getNicheName = () => {
    if (selectedNiche === 16) return customNiche;
    const niche = niches.find((n) => n.id === selectedNiche);
    return niche ? niche.name : "";
  };

  // Reset to beginning
  const handleReset = () => {
    setStep(PathStep.SELECT_NICHE);
    setSelectedNiche(null);
    setCustomNiche("");
    setCurrentQuestionIndex(0);
    setAnswers({});
    setGeneratedPath(null);
    setCustomAnswer("");
    setShowCustomInput(false);
  };

  // Save the learning path to the user's account
  const handleSavePath = async () => {
    if (!generatedPath) return;

    // Check authentication first
    if (!hasToken()) {
      setError("You must be logged in to save a learning path");
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const savedPath = await learningPathsApi.savePath(generatedPath);
      // Show success notification
      alert("Learning path saved successfully!");

      // Add to saved paths and switch to saved tab
      setSavedPaths([savedPath, ...savedPaths]);
      setActiveTab("saved");
    } catch (err) {
      console.error("Failed to save learning path:", err);
      // Check for authentication error
      if (err instanceof Error && err.message.includes("401")) {
        setError("Your session has expired. Please log in again.");
        router.push("/login");
        return;
      }
      setError("Failed to save your learning path. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Render niche selection screen
  const renderNicheSelection = () => {
    if (loading && niches.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <div>
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Explore Learning Pathways
          </h1>
          <p className="text-gray-600">
            Discover personalized learning paths tailored to your career goals
            and interests. Select an industry to begin your journey.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="max-w-md mx-auto mb-4 flex items-center justify-between">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Input
              className="pl-10 pr-4 py-2 w-full"
              placeholder="Search industries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* <div className="max-w-md mx-auto mb-8 flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg">
          <Label
            htmlFor="ai-questions"
            className="text-sm font-medium cursor-pointer"
          >
            Use AI to generate questions
          </Label>
          <div
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white bg-gray-200 data-[state=checked]:bg-blue-600"
            onClick={() => setUseAiQuestions(!useAiQuestions)}
            data-state={useAiQuestions ? "checked" : "unchecked"}
          >
            <span
              className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
              data-state={useAiQuestions ? "checked" : "unchecked"}
            />
          </div>
          <div className="text-sm text-gray-500">
            {useAiQuestions
              ? "Dynamic questions customized for each niche"
              : "Standard predefined questions"}
          </div>
        </div> */}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayedNiches.map((niche) => (
            <Card
              key={niche.id}
              className={`
                cursor-pointer hover:shadow-md transition-all 
                ${
                  selectedNiche === niche.id
                    ? "ring-2 ring-blue-500 shadow-lg transform scale-[1.02]"
                    : "hover:scale-[1.02]"
                }
              `}
              onClick={() => handleSelectNiche(niche.id)}
            >
              <CardContent className="p-6">
                {/* <div className="text-3xl mb-4">{niche.icon}</div> */}
                <CardTitle className="mb-2 text-lg">{niche.name}</CardTitle>
                <CardDescription className="text-sm">
                  {niche.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {displayedNiches.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-500">
              No industries match your search. Try a different term or create a
              custom path.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedNiche(16);
              }}
            >
              Create Custom Path
            </Button>
          </div>
        )}

        {selectedNiche === 16 && (
          <Card className="mt-8 max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Create Custom Learning Path</CardTitle>
              <CardDescription>
                Tell us about the specific field you're interested in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCustomNicheSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customNiche">Field of Interest</Label>
                  <Input
                    id="customNiche"
                    type="text"
                    placeholder="E.g. Quantum Computing, Culinary Arts, etc."
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render interactive question flow
  const renderQuestionFlow = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (questions.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-500">
            No questions available for this industry. Please try another one.
          </p>
          <Button className="mt-4" variant="outline" onClick={handleReset}>
            Go Back
          </Button>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    // Handle selection of "Other" option
    const handleSelectOther = () => {
      setShowCustomInput(true);
      handleSelectAnswer(currentQuestion.id, "custom");
    };

    // Handle custom answer input
    const handleCustomAnswerChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      setCustomAnswer(e.target.value);
      handleSelectAnswer(currentQuestion.id, `custom:${e.target.value}`);
    };

    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress bar and steps */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium text-gray-500">
            <span>Getting Started</span>
            <span>Building Your Path</span>
            <span>Almost Done</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-right">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-block text-3xl bg-blue-100 text-blue-700 p-3 rounded-full mb-3">
            {getNicheName()[0] || "🚀"}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customize Your {getNicheName()} Path
          </h1>
          <p className="text-gray-600 mt-2">
            We'll create a personalized learning plan just for you
          </p>
        </div>

        <Card className="mb-6 shadow-lg">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl">{currentQuestion.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${
                      answers[currentQuestion.id] === option
                        ? "border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]"
                        : "hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                  onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                >
                  <div className="flex items-start">
                    <div
                      className={`
                        w-5 h-5 mt-0.5 rounded-full border flex-shrink-0
                        ${
                          answers[currentQuestion.id] === option
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }
                      `}
                    >
                      {answers[currentQuestion.id] === option && (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900">{option}</h4>
                    </div>
                  </div>
                </div>
              ))}

              {/* Custom "Other" option */}
              <div
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all
                  ${
                    answers[currentQuestion.id]?.startsWith("custom")
                      ? "border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]"
                      : "hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
                onClick={handleSelectOther}
              >
                <div className="flex items-start">
                  <div
                    className={`
                      w-5 h-5 mt-0.5 rounded-full border flex-shrink-0
                      ${
                        answers[currentQuestion.id]?.startsWith("custom")
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }
                    `}
                  >
                    {answers[currentQuestion.id]?.startsWith("custom") && (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 w-full">
                    <h4 className="font-medium text-gray-900">
                      Other (please specify)
                    </h4>
                    {(answers[currentQuestion.id]?.startsWith("custom") ||
                      showCustomInput) && (
                      <div className="mt-2">
                        <Input
                          type="text"
                          placeholder="Type your answer here..."
                          value={customAnswer}
                          onChange={handleCustomAnswerChange}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={handleNextQuestion}
              disabled={
                !answers[currentQuestion.id] ||
                (answers[currentQuestion.id]?.startsWith("custom:") &&
                  !customAnswer)
              }
            >
              {currentQuestionIndex === questions.length - 1
                ? "Generate My Path"
                : "Next Question"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  // Render loading animation
  const renderLoading = () => {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Crafting Your Learning Path
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          We're analyzing your preferences and creating a personalized roadmap
          for your journey in {getNicheName()}...
        </p>
      </div>
    );
  };

  // Render saved learning paths
  const renderSavedPaths = () => {
    if (loadingSavedPaths) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (savedPathsError) {
      return (
        <div className="bg-red-50 text-red-700 p-6 rounded-md my-4">
          {savedPathsError}
        </div>
      );
    }

    if (savedPaths.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No Learning Paths Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't created any learning paths yet. Create your first
            personalized learning journey to get started.
          </p>
          <Button onClick={() => setActiveTab("create")}>
            Create Your First Path
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPaths.map((path) => (
            <Card
              key={path.id}
              className="hover:shadow-md transition-all hover:border-blue-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg mr-3">
                    {path.niche.charAt(0)}
                  </div>
                  <CardTitle className="line-clamp-1">{path.title}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2">
                  {path.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-wrap gap-1 mb-3">
                  {path.modules.slice(0, 3).map((module, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                    >
                      {module.title}
                    </span>
                  ))}
                  {path.modules.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      +{path.modules.length - 3} more
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {path.estimatedTime}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link
                  href={`/dashboard/learning-paths/${path.id}`}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full">
                    View Path
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Show tabs only if not in question flow or viewing a generated path */}
      {(activeTab === "create" && step === PathStep.SELECT_NICHE) ||
      activeTab === "saved" ? (
        <div className="mb-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">Learning Paths</h1>
                <p className="text-gray-600">
                  Create and access your personalized learning journeys
                </p>
              </div>
              <TabsList className="grid grid-cols-2 w-[300px]">
                <TabsTrigger value="create">Create New</TabsTrigger>
                <TabsTrigger value="saved">My Paths</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="create" className="mt-0">
              {renderNicheSelection()}
            </TabsContent>

            <TabsContent value="saved" className="mt-0">
              {renderSavedPaths()}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <>
          {activeTab === "create" &&
            step === PathStep.ANSWER_QUESTIONS &&
            !loadingPath &&
            renderQuestionFlow()}
          {loadingPath && renderLoading()}
          {activeTab === "create" &&
            step === PathStep.VIEW_PATH &&
            generatedPath && (
              <LearningPathView path={generatedPath} onReset={handleReset} />
            )}
        </>
      )}
    </div>
  );
}

function LearningPathView({
  path,
  onReset,
}: {
  path: LearningPath;
  onReset: () => void;
}) {
  return (
    <div className="pb-16">
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-4 mb-10 rounded-xl text-white">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center mb-6">
            <div className="text-5xl bg-white/20 p-5 rounded-full backdrop-blur-sm mb-4 md:mb-0 md:mr-6">
              {path.niche[0]}
            </div>
            <div>
              <h1 className="text-4xl font-bold">{path.title}</h1>
              <p className="text-blue-100 mt-1 text-xl">
                Your Personalized Learning Journey
              </p>
            </div>
          </div>
          <p className="text-xl text-blue-50">{path.description}</p>

          <div className="flex flex-wrap gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Timeframe: {path.estimatedTime}</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400/30 rounded-full blur-xl"></div>
          <div className="absolute left-1/4 bottom-5 w-60 h-60 bg-indigo-400/20 rounded-full blur-xl"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Overview Section */}
        {path.overview && (
          <div className="mb-8 bg-blue-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed">{path.overview}</p>
          </div>
        )}

        {/* Path Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Prerequisites */}
          {path.prerequisites && path.prerequisites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Prerequisites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {path.prerequisites.map((prereq, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      <span className="text-sm text-gray-700">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Intended Audience */}
          {path.intendedAudience && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-green-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  Intended Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{path.intendedAudience}</p>
              </CardContent>
            </Card>
          )}

          {/* Career Outcomes */}
          {path.careerOutcomes && path.careerOutcomes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-purple-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  Career Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {path.careerOutcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      <span className="text-sm text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Path Navigation */}
        <div className="sticky top-[4.5rem] z-20 bg-white shadow rounded-xl mb-8 overflow-hidden">
          <div className="flex items-center overflow-x-auto">
            {path.modules.map((module, index) => (
              <a
                key={module.id}
                href={`#module-${module.id}`}
                className="flex-shrink-0 px-6 py-4 font-medium hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 mr-2 text-sm font-bold">
                    {index + 1}
                  </span>
                  {module.title}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Path Content */}
        <div className="space-y-12">
          {path.modules.map((module, index) => (
            <div
              key={module.id}
              id={`module-${module.id}`}
              className="scroll-mt-32"
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 mr-3 font-bold">
                  {index + 1}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {module.title}
                </h2>
              </div>
              <p className="text-gray-700 mb-6 max-w-3xl">
                {module.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Difficulty
                  </h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">
                    {module.difficulty}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Time Commitment
                  </h4>
                  <p className="text-gray-600 text-sm bg-blue-50 p-3 rounded-md flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-blue-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {module.timeline}
                  </p>
                </div>
              </div>

              {/* Prerequisites for this module */}
              {module.prerequisites && module.prerequisites.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Module Prerequisites
                  </h4>
                  <div className="bg-amber-50 p-3 rounded-md">
                    <ul className="space-y-1">
                      {module.prerequisites.map((prereq, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-sm text-amber-800"
                        >
                          <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {prereq}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {module.learningObjectives &&
                module.learningObjectives.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Learning Objectives
                    </h4>
                    <div className="bg-green-50 p-3 rounded-md">
                      <ul className="space-y-1">
                        {module.learningObjectives.map((objective, idx) => (
                          <li
                            key={idx}
                            className="flex items-start text-sm text-green-800"
                          >
                            <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {module.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Subtopics */}
              {module.subtopics && module.subtopics.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Subtopics
                  </h4>
                  <div className="space-y-4">
                    {module.subtopics.map((subtopic, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-md p-4"
                      >
                        <h5 className="font-medium text-gray-900 mb-2">
                          {subtopic.title}
                        </h5>
                        <p className="text-sm text-gray-600 mb-3">
                          {subtopic.description}
                        </p>
                        {subtopic.resources &&
                          subtopic.resources.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-gray-500">
                                Resources:
                              </span>
                              {subtopic.resources.map(
                                (resource, resourceIdx) => (
                                  <div
                                    key={resourceIdx}
                                    className="flex items-center justify-between bg-gray-50 rounded-md p-2"
                                  >
                                    <div className="flex items-center">
                                      <span className="text-xs font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-1 mr-2">
                                        {resource.type}
                                      </span>
                                      <div>
                                        <a
                                          href={resource.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-sm"
                                        >
                                          {resource.name}
                                        </a>
                                        {resource.description && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            {resource.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {resource.isFree && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                          Free
                                        </span>
                                      )}
                                      {resource.estimatedTime && (
                                        <span className="text-xs text-gray-500">
                                          {resource.estimatedTime}
                                        </span>
                                      )}
                                      {resource.rating && (
                                        <div className="flex items-center">
                                          <span className="text-yellow-500 mr-1">
                                            ★
                                          </span>
                                          <span className="text-sm">
                                            {resource.rating}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {module.projects && module.projects.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Hands-on Projects
                  </h4>
                  <div className="bg-purple-50 p-3 rounded-md">
                    <ul className="space-y-1">
                      {module.projects.map((project, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-sm text-purple-800"
                        >
                          <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {project}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Tips
                </h4>
                <p className="text-gray-600 text-sm bg-yellow-50 p-3 rounded-md">
                  {module.tips}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Recommended Resources
                </h4>
                <div className="space-y-3">
                  {module.resources.map((resource, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-md p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-xs font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-1 mr-3">
                            {resource.type}
                          </span>
                          <div>
                            <a
                              href={resource.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {resource.name}
                            </a>
                            {resource.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {resource.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {resource.isFree && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Free
                            </span>
                          )}
                          {resource.estimatedTime && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {resource.estimatedTime}
                            </span>
                          )}
                          {resource.rating && (
                            <div className="flex items-center">
                              <span className="text-yellow-500 mr-1">★</span>
                              <span className="text-sm">{resource.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`#module-${path.modules[0].id}`}>
            <Button size="lg" className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Begin Learning Journey
            </Button>
          </Link>
          <Link href="/dashboard/learning-paths?tab=saved">
            <Button variant="outline" size="lg" className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              View All Saved Paths
            </Button>
          </Link>
          <Button variant="ghost" size="lg" onClick={onReset} className="gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Create New Path
          </Button>
        </div>
      </div>
    </div>
  );
}
