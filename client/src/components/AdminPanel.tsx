import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Settings, Question, insertQuestionSchema, Category, insertCategorySchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ImageManager from "./ImageManager";
import ImageSelectModal from "./ImageSelectModal";

type AdminTab = "questions" | "settings" | "categories" | "images";

// Extended question schema with zod validation
const questionFormSchema = insertQuestionSchema.extend({
  // Update schema to require non-empty question text
  question: z.string().min(1, "Question text is required"),
  // Optional image URL for question
  questionImage: z.string().optional(),
  // Ensure options are provided correctly with non-empty strings
  options: z.array(
    z.string().min(1, "Answer option cannot be empty")
  ).min(2, "At least 2 options are required").max(4, "Maximum 4 options allowed"),
  // Optional image URLs for options
  optionImages: z.array(z.string().optional()).length(4).optional(),
  // Ensure correct answer is valid
  correctAnswer: z.number().min(0).max(3),
  points: z.number().min(1, "Points must be at least 1").default(50),
  categories: z.array(z.number()).min(1, "At least one category is required").default([1]), // Multiple categories
});

// Category form schema
const categoryFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type QuestionFormValues = z.infer<typeof questionFormSchema>;

// Category definitions for reuse
const categories = [
  { id: 1, name: "Category 1", description: "Grades 3-4" },
  { id: 2, name: "Category 2", description: "Grades 5-6" },
  { id: 3, name: "Category 3", description: "Grades 7-8" },
  { id: 4, name: "Category 4", description: "Grades 9-10" },
  { id: 5, name: "Category 5", description: "Grades 11-12" }
];

// Updated schema with only relevant fields
const settingsFormSchema = z.object({
  quizDurationMinutes: z.number().min(1, "Minimum 1 minute").max(60, "Maximum 60 minutes"),
  lives: z.number().min(1, "Minimum 1 life").max(10, "Maximum 10 lives"),
  livesEnabled: z.boolean().default(true), // Add livesEnabled to the schema
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("questions");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [previewQuestionImage, setPreviewQuestionImage] = useState<string | null>(null);
  const [previewOptionImages, setPreviewOptionImages] = useState<(string | null)[]>([null, null, null, null]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Image selection modal states
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'question' | 'option0' | 'option1' | 'option2' | 'option3' | null>(null);

  // Fetch questions from API
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });
  
  // Fetch settings from API
  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });
  
  // Fetch categories from API
  const { data: categoriesData = categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Initialize question form
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
      questionImage: "",
      options: ["", "", "", ""],
      optionImages: ["", "", "", ""],
      correctAnswer: 0,
      points: 50,
      categories: [1] // Default to Category 1
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
  
  // Initialize category form
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: ""
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
      // Log the question being edited to debug
      console.log('Editing question:', editingQuestion);
      
      // Ensure optionImages is always an array of 4 items (strings or null)
      const safeOptionImages = editingQuestion.optionImages 
        ? [...editingQuestion.optionImages]
        : ["", "", "", ""];
      
      // Make sure we have exactly 4 entries in the array
      while (safeOptionImages.length < 4) {
        safeOptionImages.push("");
      }
      
      // Log the prepared optionImages
      console.log('Prepared optionImages for form:', safeOptionImages);
      
      questionForm.reset({
        question: editingQuestion.question,
        questionImage: editingQuestion.questionImage || "",
        options: [...editingQuestion.options],
        optionImages: safeOptionImages,
        correctAnswer: editingQuestion.correctAnswer,
        points: editingQuestion.points || 50,
        categories: editingQuestion.categories || [1]
      });
      
      // Set preview images
      setPreviewQuestionImage(editingQuestion.questionImage || null);
      setPreviewOptionImages(
        safeOptionImages.map(img => img || null)
      );
    }
  }, [editingQuestion, questionForm]);
  
  // Set form values when editing a category
  useEffect(() => {
    if (editingCategory) {
      categoryForm.reset({
        id: editingCategory.id,
        name: editingCategory.name,
        description: editingCategory.description
      });
      setShowCategoryForm(true);
    }
  }, [editingCategory, categoryForm]);
  
  // When editing a question, make sure the form is visible
  useEffect(() => {
    if (editingQuestion) {
      setShowAddForm(true);
    }
  }, [editingQuestion]);
  
  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      // Ensure optionImages is always an array of strings (or null values)
      // This is critical for the server to process them correctly
      const cleanedData = {
        ...data,
        questionImage: data.questionImage || null,
        optionImages: data.optionImages 
          ? data.optionImages.map(img => img === "" || img === undefined ? null : img) 
          : [null, null, null, null]
      };
      
      // Log the data being sent to the server for debugging
      console.log('Creating question with data:', JSON.stringify(cleanedData, null, 2));
      
      const res = await apiRequest("POST", "/api/questions", cleanedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question created successfully!",
      });
      
      // Reset the form but keep the same category
      const keepCategories = questionForm.getValues().categories;
      questionForm.reset({
        question: "",
        questionImage: "",
        options: ["", "", "", ""],
        optionImages: ["", "", "", ""],
        correctAnswer: 0,
        points: 50,
        categories: keepCategories
      });
      
      // Reset preview images
      setPreviewQuestionImage(null);
      setPreviewOptionImages([null, null, null, null]);
      
      // Close the form after successful save
      setShowAddForm(false);
      
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
      // Always ensure optionImages is an array of 4 items, even if some/all are null
      // This is critical to ensure the backend gets consistent data structure
      // Convert empty strings to null values to be consistent with backend storage
      const cleanedData = {
        ...data,
        questionImage: data.questionImage || null,
        optionImages: Array.isArray(data.optionImages) 
          ? data.optionImages.map(img => img === "" || img === undefined ? null : img) 
          : [null, null, null, null]
      };
      
      // Log the data being sent to the server for debugging
      console.log('Sending update with cleaned data:', JSON.stringify(cleanedData, null, 2));
      
      const res = await apiRequest("PUT", `/api/questions/${id}`, cleanedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully!",
      });
      setEditingQuestion(null);
      
      // Reset the form but keep the same category
      const keepCategories = questionForm.getValues().categories;
      questionForm.reset({
        question: "",
        questionImage: "",
        options: ["", "", "", ""],
        optionImages: ["", "", "", ""],
        correctAnswer: 0,
        points: 50,
        categories: keepCategories
      });
      
      // Reset preview images
      setPreviewQuestionImage(null);
      setPreviewOptionImages([null, null, null, null]);
      
      // Close the form after successful update
      setShowAddForm(false);
      
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
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully!",
      });
      
      categoryForm.reset({
        name: "",
        description: ""
      });
      
      setShowCategoryForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormValues }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category updated successfully!",
      });
      setEditingCategory(null);
      
      categoryForm.reset({
        name: "",
        description: ""
      });
      
      setShowCategoryForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update category: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error.message}`,
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
  
  // Handle category form submission
  const onSubmitCategory = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };
  
  // Cancel editing and reset form
  const handleCancelEdit = () => {
    setEditingQuestion(null);
    
    // Reset the form but keep the category
    const keepCategories = questionForm.getValues().categories;
    questionForm.reset({
      question: "",
      questionImage: "",
      options: ["", "", "", ""],
      optionImages: ["", "", "", ""],
      correctAnswer: 0,
      points: 50,
      categories: keepCategories
    });
    
    // Reset preview images
    setPreviewQuestionImage(null);
    setPreviewOptionImages([null, null, null, null]);
  };

  // Cancel editing category and reset form
  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    categoryForm.reset({
      name: "",
      description: ""
    });
    setShowCategoryForm(false);
  };

  // Handle delete confirmation
  const handleDeleteQuestion = (id: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(id);
    }
  };
  
  // Handle delete category confirmation
  const handleDeleteCategory = (id: number) => {
    if (confirm("Are you sure you want to delete this category? This will affect all questions using this category!")) {
      deleteCategoryMutation.mutate(id);
    }
  };
  
  // Filter questions by category
  const handleFilterByCategory = (category: number | null) => {
    setSelectedCategory(category);
  };
  
  // Filter the questions list based on selected category
  const filteredQuestions = selectedCategory 
    ? questions.filter(q => q.categories && q.categories.includes(selectedCategory)) 
    : questions;
  
  // Get category name from ID using dynamic category data
  const getCategoryName = (categoryId: number): string => {
    const category = (categoriesData as Category[]).find(c => c.id === categoryId);
    return category ? `${category.name} (${category.description})` : "Unknown";
  };

  // Handle question image URL change
  const handleQuestionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    questionForm.setValue("questionImage", url);
    setPreviewQuestionImage(url || null);
  };

  // Handle option image URL change
  const handleOptionImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    
    // Always get the current optionImages array directly from form state first
    // This is critical for maintaining consistency
    let currentOptionImages = questionForm.getValues().optionImages;
    
    // Ensure we always have a properly initialized array with 4 elements
    if (!Array.isArray(currentOptionImages) || currentOptionImages.length !== 4) {
      currentOptionImages = ["", "", "", ""];
    }
    
    // Create a new array with the updated value
    const newOptionImages = [...currentOptionImages];
    newOptionImages[index] = url || ""; // Empty string if null/undefined
    
    // Set the entire optionImages array in the form with proper validation flags
    questionForm.setValue("optionImages", newOptionImages, { 
      shouldValidate: true, 
      shouldDirty: true, 
      shouldTouch: true 
    });
    
    // Force a form update by explicitly setting each item to ensure React detects the change
    // This is needed to ensure form properly tracks changes and submits correctly
    for (let i = 0; i < 4; i++) {
      questionForm.setValue(`optionImages.${i}` as const, newOptionImages[i], { 
        shouldDirty: true 
      });
    }
    
    // Log for debugging
    console.log(`Updated option image ${index} to: ${url}`);
    console.log('Current optionImages array:', newOptionImages);
    
    // Update preview
    const newPreviewOptionImages = [...previewOptionImages];
    newPreviewOptionImages[index] = url || null;
    setPreviewOptionImages(newPreviewOptionImages);
  };

  // Get image icon based on whether an image is present
  const getImageIcon = (hasImage: boolean) => {
    return hasImage 
      ? "🖼️" // Image present
      : "📄"; // Text only
  };

  // Update the part where the category value is set when clicking the radio button
  const handleCategoryChange = (categoryId: number) => {
    console.log(`Setting category to: ${categoryId}`);
    // No need to set a single "category" field - we're using an array of "categories" now
    // The bug is here - trying to set "category" (singular) which doesn't exist in our schema
    // This line should be removed or commented out:
    // questionForm.setValue("category", Number(categoryId));
  };

  // Open image selector for a specific field
  const openImageSelector = (field: 'question' | 'option0' | 'option1' | 'option2' | 'option3') => {
    setCurrentImageField(field);
    setImageModalOpen(true);
  };

  // Handle image selection from modal
  const handleSelectImage = (imageUrl: string) => {
    if (!currentImageField) return;
    
    if (currentImageField === 'question') {
      // For question image, update directly
      questionForm.setValue("questionImage", imageUrl, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      setPreviewQuestionImage(imageUrl);
    } else {
      // For option images, ensure proper array handling
      const optionIndex = parseInt(currentImageField.replace('option', ''), 10);
      
      // Always get fresh optionImages array first
      let currentOptionImages = questionForm.getValues().optionImages;
      
      // Ensure we have a properly initialized array
      if (!Array.isArray(currentOptionImages) || currentOptionImages.length !== 4) {
        currentOptionImages = ["", "", "", ""];
      }
      
      // Create new array with the selected image
      const newOptionImages = [...currentOptionImages];
      newOptionImages[optionIndex] = imageUrl;
      
      // Set the entire optionImages array with validation triggers
      questionForm.setValue("optionImages", newOptionImages, { 
        shouldValidate: true, 
        shouldDirty: true, 
        shouldTouch: true 
      });
      
      // Force update each individual index to ensure form properly tracks changes
      for (let i = 0; i < 4; i++) {
        questionForm.setValue(`optionImages.${i}` as const, newOptionImages[i], { 
          shouldDirty: true 
        });
      }
      
      // Log for debugging
      console.log(`Selected image for option ${optionIndex}: ${imageUrl}`);
      console.log('Updated optionImages array:', newOptionImages);
      
      // Update preview state
      const newPreviewOptionImages = [...previewOptionImages];
      newPreviewOptionImages[optionIndex] = imageUrl;
      setPreviewOptionImages(newPreviewOptionImages);
    }
    
    // Close the modal
    setImageModalOpen(false);
    setCurrentImageField(null);
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
                activeTab === "categories" 
                  ? "bg-pixel-yellow text-black"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("categories")}
            >
              CATEGORIES
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
            <button 
              className={`px-6 py-3 font-pixel text-base ${
                activeTab === "images" 
                  ? "bg-pixel-yellow text-black"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("images")}
            >
              IMAGES
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
                          questionImage: "",
                          options: ["", "", "", ""],
                          optionImages: ["", "", "", ""],
                          correctAnswer: 0,
                          points: 50,
                          categories: questionForm.getValues().categories
                        });
                        setPreviewQuestionImage(null);
                        setPreviewOptionImages([null, null, null, null]);
                      }
                    }}
                    className="bg-blue-500 text-white font-pixel px-4 py-2 border-2 border-black hover:bg-blue-600"
                  >
                    {showAddForm && !editingQuestion ? "HIDE FORM" : "ADD QUESTION"}
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <div className="font-pixel text-base mb-2">Filter by category:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterByCategory(null)}
                      className={`px-3 py-2 border-2 border-black font-pixel text-sm ${
                        selectedCategory === null 
                          ? "bg-pixel-blue text-white" 
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      All Categories
                    </button>
                    {(categoriesData as Category[]).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleFilterByCategory(category.id)}
                        className={`px-3 py-2 border-2 border-black font-pixel text-sm ${
                          selectedCategory === category.id 
                            ? "bg-pixel-blue text-white" 
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {category.name} ({category.description})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collapsible Add/Edit Question Form */}
                {showAddForm && (
                  <div className="mb-6 border-4 border-black bg-gray-50 p-4">
                    <h3 className="font-pixel text-lg mb-4 text-center border-b-2 border-black pb-2">
                      {editingQuestion ? "Edit Question" : "Add New Question"}
                    </h3>
                    
                    <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)}>
                      <div className="mb-4">
                        <label className="block font-pixel text-base mb-2">Categories:</label>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm font-pixel-text text-gray-600">Select one or multiple categories for this question</p>
                          <button
                            type="button"
                            onClick={() => {
                              const allCategoryIds = (categoriesData as Category[]).map(cat => cat.id);
                              questionForm.setValue("categories", allCategoryIds);
                            }}
                            className="bg-pixel-yellow text-black font-pixel px-3 py-1 border-2 border-black hover:bg-yellow-400 text-sm"
                          >
                            SELECT ALL CATEGORIES
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                          {(categoriesData as Category[]).map((category) => (
                            <label 
                              key={category.id} 
                              className={`cursor-pointer p-3 border-4 ${
                                questionForm.watch("categories").includes(category.id) 
                                  ? "border-pixel-blue bg-gray-100" 
                                  : "border-black hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                value={category.id}
                                checked={questionForm.watch("categories").includes(category.id)}
                                onChange={() => {
                                  const currentCategories = questionForm.getValues("categories");
                                  if (currentCategories.includes(category.id)) {
                                    questionForm.setValue("categories", currentCategories.filter(id => id !== category.id));
                                  } else {
                                    questionForm.setValue("categories", [...currentCategories, category.id]);
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className="font-pixel text-sm">{category.name}</div>
                              <div className="text-xs font-pixel-text">{category.description}</div>
                            </label>
                          ))}
                        </div>
                        {questionForm.formState.errors.categories && (
                          <p className="text-pixel-red text-xs mt-1 font-pixel">
                            {questionForm.formState.errors.categories.message}
                          </p>
                        )}
                      </div>
                      
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
                      
                      {/* Question Image URL */}
                      <div className="mb-4">
                        <label className="block font-pixel text-base mb-2">Question Image (Optional):</label>
                        <div className="flex items-center">
                          <input 
                            type="text"
                            {...questionForm.register("questionImage")}
                            className="w-full px-4 py-3 border-4 border-black font-pixel-text text-lg" 
                            placeholder="Enter image URL (optional)"
                            onChange={handleQuestionImageChange}
                          />
                          <button
                            type="button"
                            onClick={() => openImageSelector('question')}
                            className="ml-2 bg-pixel-yellow text-black font-pixel px-3 py-2 border-2 border-black hover:bg-yellow-400"
                          >
                            SELECT IMAGE
                          </button>
                        </div>
                        
                        {/* Image Preview */}
                        {previewQuestionImage && (
                          <div className="mt-2 border-4 border-black p-2 bg-white">
                            <p className="font-pixel text-sm mb-2">Image Preview:</p>
                            <div className="flex justify-center">
                              <img 
                                src={previewQuestionImage} 
                                alt="Question" 
                                className="max-h-40 object-contain"
                                onError={() => setPreviewQuestionImage(null)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block font-pixel text-base mb-2">Answers:</label>
                        <div className="grid grid-cols-1 gap-4">
                          {[0, 1, 2, 3].map((index) => (
                            <div key={index} className="p-4 border-4 border-black bg-white">
                              <div className="flex items-center mb-2">
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
                              
                              {/* Option Image URL */}
                              <div className="mt-2 ml-10">
                                <label className="block font-pixel text-sm mb-1">Option Image (Optional):</label>
                                <div className="flex items-center">
                                  <input 
                                    type="text"
                                    // Use proper registration of the field instead of manual value binding
                                    {...questionForm.register(`optionImages.${index}`)}
                                    className="w-full px-4 py-2 border-4 border-black font-pixel-text text-base" 
                                    placeholder="Enter image URL (optional)"
                                    // Keep the onChange handler to handle images properly
                                    onChange={(e) => handleOptionImageChange(index, e)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => openImageSelector(`option${index}` as 'option0' | 'option1' | 'option2' | 'option3')}
                                    className="ml-2 bg-pixel-yellow text-black font-pixel px-3 py-2 border-2 border-black hover:bg-yellow-400"
                                  >
                                    SELECT IMAGE
                                  </button>
                                </div>
                                
                                {/* Option Image Preview */}
                                {previewOptionImages[index] && (
                                  <div className="mt-2 border-2 border-black p-2 bg-gray-50">
                                    <div className="flex justify-center">
                                      <img 
                                        src={previewOptionImages[index] || ""} 
                                        alt={`Option ${String.fromCharCode(65 + index)}`} 
                                        className="max-h-24 object-contain"
                                        onError={() => {
                                          const newPreview = [...previewOptionImages];
                                          newPreview[index] = null;
                                          setPreviewOptionImages(newPreview);
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
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
                  ) : filteredQuestions.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-60">
                      <p className="font-pixel-text text-lg mb-4">
                        {selectedCategory 
                          ? `No questions yet for ${getCategoryName(selectedCategory)}!` 
                          : "No questions yet!"}
                      </p>
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
                            <th className="border-b-4 border-r-4 border-black px-4 py-2 text-left font-pixel text-sm w-[45%]">Question</th>
                            <th className="border-b-4 border-r-4 border-black px-4 py-2 text-center font-pixel text-sm w-[10%]">Type</th>
                            <th className="border-b-4 border-r-4 border-black px-4 py-2 text-center font-pixel text-sm w-[15%]">Category</th>
                            <th className="border-b-4 border-r-4 border-black px-4 py-2 text-center font-pixel text-sm w-[10%]">Points</th>
                            <th className="border-b-4 border-black px-4 py-2 text-center font-pixel text-sm w-[15%]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQuestions.map((question, index) => (
                            <tr key={question.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-black`}>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text">{question.id}</td>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text">
                                {question.question}
                                {question.questionImage && (
                                  <div className="mt-1">
                                    <img 
                                      src={question.questionImage} 
                                      alt="Question" 
                                      className="max-h-10 object-contain inline-block mr-2" 
                                    />
                                    <span className="text-xs text-gray-500">[Has image]</span>
                                  </div>
                                )}
                              </td>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text text-center">
                                {getImageIcon(Boolean(question.questionImage))}
                                {question.optionImages && question.optionImages.some(img => !!img) && " + 🖼️"}
                              </td>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text text-center">
                                {question.categories && question.categories.length > 0 ? (
                                  <div>
                                    <div className="text-xs font-medium">
                                      {question.categories.length > 1 
                                        ? `${question.categories.length} categories` 
                                        : "1 category"}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {question.categories.map(id => {
                                        const category = (categoriesData as Category[]).find(c => c.id === id);
                                        return category ? category.name : "Unknown";
                                      }).join(", ")}
                                    </div>
                                  </div>
                                ) : (
                                  "No categories"
                                )}
                              </td>
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
            
            {/* Categories Tab */}
            {activeTab === "categories" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-pixel text-lg">Category Management</h2>
                  <button 
                    onClick={() => {
                      setEditingCategory(null);
                      setShowCategoryForm(!showCategoryForm);
                      if (editingCategory) {
                        categoryForm.reset({
                          name: "",
                          description: ""
                        });
                      }
                    }}
                    className="bg-blue-500 text-white font-pixel px-4 py-2 border-2 border-black hover:bg-blue-600"
                  >
                    {showCategoryForm && !editingCategory ? "HIDE FORM" : "ADD CATEGORY"}
                  </button>
                </div>

                {/* Collapsible Add/Edit Category Form */}
                {showCategoryForm && (
                  <div className="mb-6 border-4 border-black bg-gray-50 p-4">
                    <h3 className="font-pixel text-lg mb-4 text-center border-b-2 border-black pb-2">
                      {editingCategory ? "Edit Category" : "Add New Category"}
                    </h3>
                    
                    <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)}>
                      <div className="mb-4">
                        <label className="block font-pixel text-base mb-2">Category Name:</label>
                        <input 
                          {...categoryForm.register("name")}
                          className="w-full px-4 py-3 border-4 border-black font-pixel-text text-lg" 
                          placeholder="Enter category name (e.g. Category 1)"
                        />
                        {categoryForm.formState.errors.name && (
                          <p className="text-pixel-red text-xs mt-1 font-pixel">
                            {categoryForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block font-pixel text-base mb-2">Description:</label>
                        <input 
                          {...categoryForm.register("description")}
                          className="w-full px-4 py-3 border-4 border-black font-pixel-text text-lg" 
                          placeholder="Enter description (e.g. Grades 3-4)"
                        />
                        {categoryForm.formState.errors.description && (
                          <p className="text-pixel-red text-xs mt-1 font-pixel">
                            {categoryForm.formState.errors.description.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        {editingCategory && (
                          <button 
                            type="button" 
                            onClick={handleCancelCategoryEdit}
                            className="bg-gray-500 text-white font-pixel px-4 py-2 border-2 border-black hover:bg-gray-600 text-base"
                          >
                            CANCEL
                          </button>
                        )}
                        <button 
                          type="submit" 
                          className="bg-green-500 text-white font-pixel px-5 py-3 border-2 border-black hover:bg-green-600 text-base"
                          disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        >
                          {editingCategory ? "UPDATE" : "SAVE"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Categories List */}
                <div className="border-4 border-black">
                  {categoriesLoading ? (
                    <div className="flex justify-center items-center h-60">
                      <p className="font-pixel-text text-lg">Loading categories...</p>
                    </div>
                  ) : ((categoriesData as Category[]).length === 0) ? (
                    <div className="flex flex-col justify-center items-center h-60">
                      <p className="font-pixel-text text-lg mb-4">No categories yet!</p>
                      <button 
                        onClick={() => setShowCategoryForm(true)}
                        className="bg-blue-500 text-white font-pixel px-4 py-2 border-2 border-black hover:bg-blue-600"
                      >
                        ADD YOUR FIRST CATEGORY
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gray-100">
                          <tr>
                            <th className="border-b-4 border-r-4 border-black px-4 py-2 text-left font-pixel text-sm w-[10%]">ID</th>
                            <th className="border-b-4 border-r-4 border-black px-4 py-2 text-left font-pixel text-sm w-[35%]">Name</th>
                            <th className="border-b-4 border-r-4 border-black px-4 py-2 text-left font-pixel text-sm w-[35%]">Description</th>
                            <th className="border-b-4 border-black px-4 py-2 text-center font-pixel text-sm w-[20%]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(categoriesData as Category[]).map((category: Category, index: number) => (
                            <tr key={category.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-black`}>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text">{category.id}</td>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text">{category.name}</td>
                              <td className="border-r-4 border-black px-4 py-2 font-pixel-text">{category.description}</td>
                              <td className="px-2 py-2 text-center">
                                <button 
                                  className="bg-blue-500 text-white px-2 py-1 border-2 border-black mr-1 font-pixel text-xs hover:bg-blue-600"
                                  onClick={() => setEditingCategory(category)}
                                >
                                  EDIT
                                </button>
                                <button 
                                  className="bg-pixel-red text-white px-2 py-1 border-2 border-black font-pixel text-xs hover:bg-red-600"
                                  onClick={() => handleDeleteCategory(category.id)}
                                  disabled={deleteCategoryMutation.isPending}
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

                <div className="mt-4 p-4 bg-gray-100 border-2 border-black">
                  <h3 className="font-pixel text-base mb-2">Note:</h3>
                  <p className="font-pixel-text text-sm">
                    Changing category names will affect all questions assigned to those categories.
                    Make sure to use descriptive names that clearly indicate the category's target audience or grade level.
                  </p>
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
                            max="60"
                            className="w-20 px-3 py-2 border-y-2 border-black font-pixel-text text-center mx-1"
                          />
                          <button 
                            type="button"
                            className="w-10 h-10 bg-gray-200 border-2 border-black font-pixel text-lg"
                            onClick={() => {
                              const current = settingsForm.getValues('quizDurationMinutes');
                              if (current < 60) {
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

            {/* Images Tab */}
            {activeTab === "images" && (
              <div>
                <h2 className="font-pixel text-lg mb-6">Image Management</h2>
                <div className="border-4 border-black p-4">
                  <p className="font-pixel-text mb-4">
                    Upload, manage, and delete images for your quiz questions and answers. These images will be stored
                    in your Supabase storage bucket and can be used in questions and answers.
                  </p>
                  <ImageManager />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Selection Modal */}
      <ImageSelectModal 
        isOpen={imageModalOpen}
        onClose={() => {
          setImageModalOpen(false);
          setCurrentImageField(null);
        }}
        onSelectImage={handleSelectImage}
        title={currentImageField === 'question' ? 'Select Question Image' : 'Select Option Image'}
      />
    </div>
  );
}
