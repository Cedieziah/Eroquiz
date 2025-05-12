import React from 'react';
import ImageManager from './ImageManager';

interface ImageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  title?: string;
}

export default function ImageSelectModal({ 
  isOpen, 
  onClose, 
  onSelectImage,
  title = "Select Image"
}: ImageSelectModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Modal header */}
        <div className="p-4 border-b border-gray-200 bg-gray-100">
          <h2 className="font-pixel text-xl">{title}</h2>
        </div>
        
        {/* Modal body */}
        <div className="flex-1 overflow-auto">
          <ImageManager onSelectImage={onSelectImage} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}