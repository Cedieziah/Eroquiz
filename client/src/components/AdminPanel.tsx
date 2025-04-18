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
  // Ensure options are provided correctly
  options: z.array(z.string()).min(2, "At least 2 options are required").max(4, "Maximum 4 options allowed"),
  // Ensure correct answer is valid
  correctAnswer: z.number().min(0).max(3)
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

// Extended settings schema with zod validation
const settingsFormSchema = z.object({
  timerSeconds: z.number().min(5, "Minimum 5 seconds").max(60, "Maximum 60 seconds"),
  lives: z.number().min(1, "Minimum 1 life").max(10, "Maximum 10 lives"),
  pointsPerCorrectAnswer: z.number().min(1, "Minimum 1 point").max(1000, "Maximum 1000 points"),
  timeBonus: z.number().min(0, "Minimum 0 points").max(100, "Maximum 100 points"),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("questions");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
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
      correctAnswer: 0
    }
  });
  
  // Initialize settings form
  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      timerSeconds: 30,
      lives: 5,
      pointsPerCorrectAnswer: 50,
      timeBonus: 5
    }
  });
  
  // Update settings form values when settings data is loaded
  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        timerSeconds: settings.timerSeconds,
        lives: settings.lives,
        pointsPerCorrectAnswer: settings.pointsPerCorrectAnswer,
        timeBonus: settings.timeBonus
      });
    }
  }, [settings, settingsForm]);
  
  // Set form values when editing a question
  useEffect(() => {
    if (editingQuestion) {
      questionForm.reset({
        question: editingQuestion.question,
        options: [...editingQuestion.options],
        correctAnswer: editingQuestion.correctAnswer
      });
    }
  }, [editingQuestion, questionForm]);
  
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
        correctAnswer: 0
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
        correctAnswer: 0
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
      const res = await apiRequest("PUT", "/api/settings", data);
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
      correctAnswer: 0
    });
  };
  
  // Handle delete confirmation
  const handleDeleteQuestion = (id: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(id);
    }
  };
  
  return (
    <div>
      {/* Admin Tabs */}
      <div className="mb-6 border-b border-gray-300">
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 font-pixel text-sm ${activeTab === "questions" ? "bg-pixel-yellow" : "bg-gray-200"}`}
            onClick={() => setActiveTab("questions")}
          >
            QUESTIONS
          </button>
          <button 
            className={`px-4 py-2 font-pixel text-sm ${activeTab === "settings" ? "bg-pixel-yellow" : "bg-gray-200"}`}
            onClick={() => setActiveTab("settings")}
          >
            SETTINGS
          </button>
        </div>
      </div>
      
      {/* Questions Tab */}
      {activeTab === "questions" && (
        <div>
          {/* Question List */}
          <div className="mb-6 max-h-80 overflow-y-auto">
            {questionsLoading ? (
              <p className="text-center font-pixel-text">Loading questions...</p>
            ) : questions.length === 0 ? (
              <p className="text-center font-pixel-text">No questions yet. Add your first question below!</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left font-pixel text-sm">ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-pixel text-sm">Question</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-pixel text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id} className="border-b border-gray-200">
                      <td className="border border-gray-300 px-4 py-3 font-pixel-text">{question.id}</td>
                      <td className="border border-gray-300 px-4 py-3 font-pixel-text">{question.question}</td>
                      <td className="border border-gray-300 px-2 py-3">
                        <button 
                          className="bg-blue-500 text-white px-2 py-1 rounded mr-2 font-pixel text-xs"
                          onClick={() => setEditingQuestion(question)}
                        >
                          EDIT
                        </button>
                        <button 
                          className="bg-pixel-red text-white px-2 py-1 rounded font-pixel text-xs"
                          onClick={() => handleDeleteQuestion(question.id)}
                          disabled={deleteQuestionMutation.isPending}
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Add/Edit Question Form */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-pixel text-lg mb-4">
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </h3>
            
            <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)}>
              <div className="mb-4">
                <label className="block font-pixel text-sm mb-2">Question:</label>
                <input 
                  {...questionForm.register("question")}
                  className="w-full px-3 py-2 border-2 border-gray-300 font-pixel-text" 
                  placeholder="Enter question"
                />
                {questionForm.formState.errors.question && (
                  <p className="text-red-500 text-xs mt-1">
                    {questionForm.formState.errors.question.message}
                  </p>
                )}
              </div>
              
              {/* Answers */}
              <div className="mb-4">
                <label className="block font-pixel text-sm mb-2">Answers:</label>
                
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex mb-2">
                    <input 
                      type="radio"
                      id={`correct-answer-${index}`}
                      value={index}
                      checked={questionForm.watch("correctAnswer") === index}
                      onChange={() => questionForm.setValue("correctAnswer", index)}
                      className="mt-3 mr-2"
                    />
                    <input 
                      {...questionForm.register(`options.${index}`)}
                      className="w-full px-3 py-2 border-2 border-gray-300 font-pixel-text" 
                      placeholder={`Answer option ${index + 1}`}
                    />
                  </div>
                ))}
                
                {questionForm.formState.errors.options && (
                  <p className="text-red-500 text-xs mt-1">
                    {questionForm.formState.errors.options.message}
                  </p>
                )}
                
                <p className="text-xs font-pixel mt-2 text-gray-600">* Select the radio button next to the correct answer</p>
              </div>
              
              <div className="flex justify-between">
                <button 
                  type="submit" 
                  className="bg-pixel-green text-white font-pixel px-4 py-2 rounded-lg hover:bg-green-600"
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                >
                  {editingQuestion ? "UPDATE QUESTION" : "SAVE QUESTION"}
                </button>
                
                {editingQuestion && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="bg-gray-400 text-white font-pixel px-4 py-2 rounded-lg hover:bg-gray-500"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div>
          {settingsLoading ? (
            <p className="text-center font-pixel-text">Loading settings...</p>
          ) : (
            <form onSubmit={settingsForm.handleSubmit(onSubmitSettings)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-pixel text-sm mb-2">Question Timer (seconds):</label>
                  <input 
                    type="number"
                    {...settingsForm.register("timerSeconds", { valueAsNumber: true })}
                    min="5" 
                    max="60"
                    className="w-full px-3 py-2 border-2 border-gray-300 font-pixel-text"
                  />
                  {settingsForm.formState.errors.timerSeconds && (
                    <p className="text-red-500 text-xs mt-1">
                      {settingsForm.formState.errors.timerSeconds.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block font-pixel text-sm mb-2">Number of Lives:</label>
                  <input 
                    type="number"
                    {...settingsForm.register("lives", { valueAsNumber: true })}
                    min="1" 
                    max="10"
                    className="w-full px-3 py-2 border-2 border-gray-300 font-pixel-text"
                  />
                  {settingsForm.formState.errors.lives && (
                    <p className="text-red-500 text-xs mt-1">
                      {settingsForm.formState.errors.lives.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block font-pixel text-sm mb-2">Points per Correct Answer:</label>
                  <input 
                    type="number"
                    {...settingsForm.register("pointsPerCorrectAnswer", { valueAsNumber: true })}
                    min="1" 
                    max="1000"
                    className="w-full px-3 py-2 border-2 border-gray-300 font-pixel-text"
                  />
                  {settingsForm.formState.errors.pointsPerCorrectAnswer && (
                    <p className="text-red-500 text-xs mt-1">
                      {settingsForm.formState.errors.pointsPerCorrectAnswer.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block font-pixel text-sm mb-2">Time Bonus (points per second left):</label>
                  <input 
                    type="number"
                    {...settingsForm.register("timeBonus", { valueAsNumber: true })}
                    min="0" 
                    max="100"
                    className="w-full px-3 py-2 border-2 border-gray-300 font-pixel-text"
                  />
                  {settingsForm.formState.errors.timeBonus && (
                    <p className="text-red-500 text-xs mt-1">
                      {settingsForm.formState.errors.timeBonus.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  type="submit" 
                  className="bg-pixel-green text-white font-pixel px-4 py-2 rounded-lg hover:bg-green-600"
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
  );
}
