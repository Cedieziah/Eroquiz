import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getImages, uploadImage, deleteImage, ImageInfo } from '@/services/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ImageManagerProps {
  onSelectImage?: (url: string) => void;
  onClose?: () => void;
  showSelectButton?: boolean;
}

export default function ImageManager({ 
  onSelectImage, 
  onClose, 
  showSelectButton = true 
}: ImageManagerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch images from Supabase
  const { 
    data: images = [], 
    isLoading: imagesLoading,
    refetch: refetchImages
  } = useQuery<ImageInfo[]>({
    queryKey: ['quiz-images'],
    queryFn: getImages,
  });

  // Image upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingImage(true);
      try {
        const result = await uploadImage(file);
        return result;
      } finally {
        setUploadingImage(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['quiz-images'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to upload image: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Image delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['quiz-images'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete image: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
    e.target.value = ''; // Reset file input
  };

  // Handle image selection
  const handleSelectImage = (url: string) => {
    setSelectedImage(url);
    if (onSelectImage) onSelectImage(url);
    if (onClose) onClose();
  };

  // Handle image deletion
  const handleDeleteImage = (id: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteMutation.mutate(id);
    }
  };

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Render loading state
  if (imagesLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 font-pixel-text">Loading images...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-pixel text-xl">Image Manager</h2>
        {onClose && (
          <button 
            onClick={onClose} 
            className="bg-gray-500 text-white font-pixel px-3 py-1 border-2 border-black hover:bg-gray-600"
          >
            CLOSE
          </button>
        )}
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-4 border-4 border-black bg-gray-50">
        <h3 className="font-pixel mb-4">Upload New Image</h3>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex-grow cursor-pointer">
            <div className="bg-blue-500 text-white font-pixel px-4 py-2 border-2 border-black hover:bg-blue-600 text-center">
              {uploadingImage ? "UPLOADING..." : "SELECT IMAGE"}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
              disabled={uploadingImage}
            />
          </label>
          <p className="text-xs font-pixel-text text-gray-500">
            Max file size: 2MB. Supported formats: JPG, PNG, GIF.
          </p>
        </div>
      </div>

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="text-center p-10 border-4 border-dashed border-gray-300 bg-gray-50">
          <p className="font-pixel-text mb-2">No images uploaded yet</p>
          <p className="text-sm text-gray-500">Upload your first image using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2">
          {images.map((image) => (
            <div 
              key={image.id} 
              className={`border-4 relative group ${
                selectedImage === image.url ? 'border-pixel-blue bg-blue-50' : 'border-gray-300'
              }`}
            >
              <img 
                src={image.url} 
                alt={image.name} 
                className="w-full h-32 object-contain p-2"
              />
              <div className="p-2 bg-gray-100 border-t-2 border-gray-300">
                <p className="truncate text-xs font-pixel-text" title={image.name}>
                  {image.name.length > 15 ? image.name.substring(0, 12) + '...' : image.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
              </div>
              
              {/* Action buttons that appear on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {showSelectButton && (
                  <button
                    onClick={() => handleSelectImage(image.url)}
                    className="bg-pixel-blue text-white font-pixel px-2 py-1 border-2 border-black hover:bg-blue-600 text-xs mr-2"
                  >
                    SELECT
                  </button>
                )}
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="bg-pixel-red text-white font-pixel px-2 py-1 border-2 border-black hover:bg-red-600 text-xs"
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}