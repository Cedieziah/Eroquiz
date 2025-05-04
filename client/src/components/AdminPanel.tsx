import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Settings, Question, insertQuestionSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

type AdminTab = "questions" | "settings";

// Extended question schema with zod validation
const questionFormSchema = insertQuestionSchema.extend({
  // Update schema to require non-empty question text
  question: z.string().min(1, "Question text is required"),
  // Ensure options are provided correctly with non-empty strings
  options: z.array(
    z.string().min(1, "Answer option cannot be empty")
  ).min(2, "At least 2 options are required").max(4, "Maximum 4 options allowed"),
  // Ensure correct answer is valid
  correctAnswer: z.number().min(0).max(3),
  points: z.number().min(1, "Points must be at least 1").default(50)
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

// Updated schema with only relevant fields
const settingsFormSchema = z.object({
  quizDurationMinutes: z.number().min(1, "Minimum 1 minute").max(30, "Maximum 30 minutes"),
  lives: z.number().min(1, "Minimum 1 life").max(10, "Maximum 10 lives"),
  livesEnabled: z.boolean().default(true), // Add livesEnabled to the schema
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("questions");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch questions from API
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });
  
  // Fetch settings from API
  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });
  
  // Initialize question form
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 50
    }
  });
  
  // Initialize settings form
  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      quizDurationMinutes: settings ? Math.round(settings.quizDurationSeconds / 60) : 5,
      lives: settings?.lives || 5,
    }
  });
  
  // Update settings form values when settings data is loaded
  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        quizDurationMinutes: Math.round(settings.quizDurationSeconds / 60),
        lives: settings.lives,
        livesEnabled: settings.livesEnabled ?? true, // Include livesEnabled with fallback to true
      });
    }
  }, [settings, settingsForm]);
  
  // Set form values when editing a question
  useEffect(() => {
    if (editingQuestion) {
      questionForm.reset({
        question: editingQuestion.question,
        options: [...editingQuestion.options],
        correctAnswer: editingQuestion.correctAnswer,
        points: editingQuestion.points || 50 // Use question points or default
      });
    }
  }, [editingQuestion, questionForm]);
  
  // When editing a question, make sure the form is visible
  useEffect(() => {
    if (editingQuestion) {
      setShowAddForm(true);
    }
  }, [editingQuestion]);
  
  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const res = await apiRequest("POST", "/api/questions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question created successfully!",
      });
      questionForm.reset({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        points: 50 // Set default points
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create question: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuestionFormValues }) => {
      const res = await apiRequest("PUT", `/api/questions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully!",
      });
      setEditingQuestion(null);
      questionForm.reset({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        points: 50 // Set default points
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update question: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete question: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      // Transform the data to match the API expectations
      const apiData = {
        // Convert minutes to seconds for the server
        quizDurationSeconds: data.quizDurationMinutes * 60,
        // Include lives settings
        lives: data.lives,
        livesEnabled: data.livesEnabled,
        // Keep existing values for fields we're not showing in UI
        timerSeconds: settings?.timerSeconds || 30,
        pointsPerCorrectAnswer: settings?.pointsPerCorrectAnswer || 50,
        timeBonus: settings?.timeBonus || 0
      };
      
      const res = await apiRequest("PUT", "/api/settings", apiData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle question form submission
  const onSubmitQuestion = (data: QuestionFormValues) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };
  
  // Handle settings form submission
  const onSubmitSettings = (data: SettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };
  
  // Cancel editing and reset form
  const handleCancelEdit = () => {
    setEditingQuestion(null);
    questionForm.reset({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 50 // Set default points
    });
  };
  
  // Handle delete confirmation
  const handleDeleteQuestion = (id: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(id);
    }
  };
  
  return (
    <div className="container mx-auto max-w-6xl">
      {/* Main Container with Pixel Art Border */}
      <div className="relative mb-6">
        <div className="absolute inset-0 border-8 border-black"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow top-0 left-0 z-10"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow top-0 right-0 z-10"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow bottom-0 left-0 z-10"></div>
        <div className="absolute w-8 h-8 bg-pixel-yellow bottom-0 right-0 z-10"></div>
        
        {/* Admin Tabs */}
        <div className="relative z-20">
          <div className="flex bg-gray-200 border-b-4 border-black">
            <button 
              className={`px-6 py-3 font-pixel text-base ${
                activeTab === "questions" 
                  ? "bg-pixel-yellow text-black"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("questions")}
            >
              QUESTIONS
            </button>
            <button 
              className={`px-6 py-3 font-pixel text-base ${
                activeTab === "settings" 
                  ? "bg-pixel-yellow text-black"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              SETTINGS
            </button>
          </div>
          
          <div className="bg-white p-6">
            {/* Questions Tab */}
            {activeTab === "questions" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-pixel text-lg">Question List</h2>
                  <button 
                    onClick={() => {
                      setEditingQuestion(null);
                      setShowAddForm(!showAddForm);
                      if (editingQuestion) {
                        questionForm.reset({
                          question: "",
                          options: ["", "", "", ""],
                          correctAnswer: 0,
                          points: 50
                        });
                      }
                    }}
                    className="bg-blue-500 text-white font-pixel px-4 py-2 border-2 border-black hover:bg-blue-600"
                  >
                    {showAddForm && !editingQuestion ? "HIDE FORM" : "ADD QUESTION"}
                  </button>
                </div>

                {/* Collapsible Add/Edit Question Form */}
                {showAddForm && (
                  <div className="mb-6 border-4 border-black bg-gray-50 p-4">
                    <h3 className="font-pixel text-lg mb-4 text-center border-b-2 border-black pb-2">
                      {editingQuestion ? "Edit Question" : "Add New Question"}
                    </h3>
                    
                    <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)}>
                      <div className="mb-4">
                        <label className="block font-pixel text-base mb-2">Question:</label>
                        <input 
                          {...questionForm.register("question")}
                          className="w-full px-4 py-3 border-4 border-black font-pixel-text text-lg" 
                          placeholder="Enter question"
                        />
                        {questionForm.formState.errors.question && (
                          <p className="text-pixel-red text-xs mt-1 font-pixel">
                            {questionForm.formState.errors.question.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block font-pixel text-base mb-2">Answers:</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[0, 1, 2, 3].map((index) => (
                            <div key={index} className="flex items-center">
                              <input 
                                type="radio"
                                id={`correct-answer-${index}`}
                                value={index}
                                checked={questionForm.watch("correctAnswer") === index}
                                onChange={() => questionForm.setValue("correctAnswer", index)}
                                className="mr-2 w-5 h-5"
                              />
                              <div className="inline-flex w-8 h-8 bg-black text-white font-pixel items-center justify-center mr-3 text-base">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <input 
                                {...questionForm.register(`options.${index}`)}
                                className="w-full px-4 py-3 border-4 border-black font-pixel-text text-lg" 
                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                              />
                            </div>
                          ))}
                        </div>
                        {questionForm.formState.errors.options && (
                          <p className="text-pixel-red text-xs mt-1 font-pixel">
                            {questionForm.formState.errors.options.message}
                          </p>
                        )}
                        <p className="text-sm font-pixel mt-3 text-gray-600">* Select the radio button for the correct answer</p>
                      </div>

                      <div className="mb-4">
                        <label className="block font-pixel text-base mb-2">Points:</label>
                        <input 
                          type="number"
                          {...questionForm.register("points", { valueAsNumber: true })}
                          min="1"
                          className="w-full px-4 py-3 border-4 border-black font-pixel-text text-lg" 
                          placeholder="Points for correct answer (default: 50)"
                        />
                        {questionForm.formState.errors.points && (
                          <p className="text-pixel-red text-xs mt-1 font-pixel">
                            {questionForm.formState.errors.points.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        {editingQuestion && (
                          <button 
                            type="button" 
                            onClick={handleCancelEdit}
                            className="bg-gray-500 text-white font-pixel px-4 py-2 border-2 border-black hover:bg-gray-600 text-base"
                          >
                            CANCEL
                          </button>
                        )}
                        <button 
                          type="submit" 
                          className="bg-green-500 text-white font-pixel px-5 py-3 border-2 border-black hover:bg-green-600 text-base"
                          disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                        >
                          {editingQuestion ? "UPDATE" : "SAVE"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Question List */}
                <div className="border-4 border-black">
                  {questionsLoading ? (
                    <div className="flex justify-center items-center h-60">
                      <p className="font-pixel-text text-lg">Loading questions...</p>
                    </div>
                  ) : questions.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-60">
                      <p className="font-pixel-text text-lg mb-4">No questions yet!</p>
                      <button 
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-500 text-white font-pixel px-4 py-2 border-2 border-black hover:bg-blue-600"
                      >
                        ADD YOUR FIRST QUESTION
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gray-100">
                          <tr>
                            <th className="border-b-4 border-r-4 border-black px-4 py-2 text-left font-pixel text-sm w-[5%]">ID</th>
                            <th className="border-b-4 border-r-4 border-black px-4 py-2 text-left font-pixel text-sm w-[65%]">Question</th>
                            <th className="border-b-4 border-black px-4 py-2 text-center font-pixel text-sm w-[15%]">Points</th>
                            <th className="border-b-4 border-black px-4 py-2 text-center font-pixel text-sm w-[15%]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {questions.map((question, index) => (
                            <tr key={question.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-black`}>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text">{question.id}</td>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text">{question.question}</td>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text text-center">{question.points || 50}</td>
                              <td className="px-2 py-2 text-center">
                                <button 
                                  className="bg-blue-500 text-white px-2 py-1 border-2 border-black mr-1 font-pixel text-xs hover:bg-blue-600"
                                  onClick={() => setEditingQuestion(question)}
                                >
                                  EDIT
                                </button>
                                <button 
                                  className="bg-pixel-red text-white px-2 py-1 border-2 border-black font-pixel text-xs hover:bg-red-600"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  disabled={deleteQuestionMutation.isPending}
                                >
                                  DEL
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="border-4 border-black p-6 bg-gray-50">
                {settingsLoading ? (
                  <p className="text-center font-pixel-text">Loading settings...</p>
                ) : (
                  <form onSubmit={settingsForm.handleSubmit(onSubmitSettings)}>
                    <h3 className="font-pixel text-lg mb-6 text-center border-b-2 border-black pb-2">Quiz Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                      {/* Quiz Duration in Minutes */}
                      <div className="border-4 border-black p-4 bg-white">
                        <label className="block font-pixel text-sm mb-2">Quiz Duration (minutes):</label>
                        <div className="flex items-center">
                          <button 
                            type="button"
                            className="w-10 h-10 bg-gray-200 border-2 border-black font-pixel text-lg"
                            onClick={() => {
                              const current = settingsForm.getValues('quizDurationMinutes');
                              if (current > 1) {
                                settingsForm.setValue('quizDurationMinutes', current - 1);
                              }
                            }}
                          >-</button>
                          <input 
                            type="number"
                            {...settingsForm.register("quizDurationMinutes", { valueAsNumber: true })}
                            min="1" 
                            max="30"
                            className="w-20 px-3 py-2 border-y-2 border-black font-pixel-text text-center mx-1"
                          />
                          <button 
                            type="button"
                            className="w-10 h-10 bg-gray-200 border-2 border-black font-pixel text-lg"
                            onClick={() => {
                              const current = settingsForm.getValues('quizDurationMinutes');
                              if (current < 30) {
                                settingsForm.setValue('quizDurationMinutes', current + 1);
                              }
                            }}
                          >+</button>
                        </div>
                        {settingsForm.formState.errors.quizDurationMinutes && (
                          <p className="text-pixel-red text-xs mt-1 font-pixel">
                            {settingsForm.formState.errors.quizDurationMinutes.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-2 font-pixel">Total time for the entire quiz</p>
                      </div>

                      {/* Lives Settings Section */}
                      <div className="border-4 border-black p-4 bg-white">
                        {/* Lives Enable Toggle */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <label className="font-pixel text-sm">Enable Lives Feature:</label>
                            <div 
                              className={`relative inline-block w-14 h-8 cursor-pointer border-2 border-black ${
                                settingsForm.watch("livesEnabled") ? "bg-green-500" : "bg-gray-400"
                              }`}
                              onClick={() => {
                                settingsForm.setValue("livesEnabled", !settingsForm.watch("livesEnabled"));
                              }}
                            >
                              <div 
                                className={`absolute top-0.5 left-0.5 bg-white w-6 h-6 border-2 border-black transition-transform ${
                                  settingsForm.watch("livesEnabled") ? "transform translate-x-6" : ""
                                }`} 
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 font-pixel">
                            {settingsForm.watch("livesEnabled") 
                              ? "Players lose a life when answering incorrectly" 
                              : "Players can make unlimited mistakes"}
                          </p>
                        </div>

                        {/* Number of Lives (only visible if lives are enabled) */}
                        {settingsForm.watch("livesEnabled") && (
                          <div className="mt-4">
                            <label className="block font-pixel text-sm mb-2">Number of Lives:</label>
                            <div className="flex items-center">
                              <button 
                                type="button"
                                className="w-10 h-10 bg-gray-200 border-2 border-black font-pixel text-lg"
                                onClick={() => {
                                  const current = settingsForm.getValues('lives');
                                  if (current > 1) {
                                    settingsForm.setValue('lives', current - 1);
                                  }
                                }}
                              >-</button>
                              <input 
                                type="number"
                                {...settingsForm.register("lives", { valueAsNumber: true })}
                                min="1" 
                                max="10"
                                className="w-20 px-3 py-2 border-y-2 border-black font-pixel-text text-center mx-1"
                              />
                              <button 
                                type="button"
                                className="w-10 h-10 bg-gray-200 border-2 border-black font-pixel text-lg"
                                onClick={() => {
                                  const current = settingsForm.getValues('lives');
                                  if (current < 10) {
                                    settingsForm.setValue('lives', current + 1);
                                  }
                                }}
                              >+</button>
                            </div>
                            {settingsForm.formState.errors.lives && (
                              <p className="text-pixel-red text-xs mt-1 font-pixel">
                                {settingsForm.formState.errors.lives.message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                      <button 
                        type="submit" 
                        className="bg-green-500 text-white font-pixel px-6 py-3 border-2 border-black hover:bg-green-600"
                        disabled={updateSettingsMutation.isPending}
                      >
                        SAVE SETTINGS
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
