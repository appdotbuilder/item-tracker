import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import type { Image } from '../../../server/src/schema';

// Define public user type (without password_hash)
type PublicUser = {
  id: number;
  email: string;
  username: string;
  created_at: Date;
  updated_at: Date;
};

interface ImageUploadProps {
  user: PublicUser;
  onImageUploaded: (image: Image) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function ImageUpload({ user, onImageUploaded, onError, onSuccess }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev: number) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // NOTE: This is a stub implementation for file upload
      // In a real application, you would:
      // 1. Upload the file to a server endpoint or cloud storage
      // 2. Get the file path and other metadata from the upload response
      const { trpc } = await import('@/utils/trpc');
      
      const uploadData = {
        user_id: user.id,
        filename: `${Date.now()}-${file.name}`,
        original_name: file.name,
        file_path: `/uploads/${Date.now()}-${file.name}`, // Stub path
        file_size: file.size,
        mime_type: file.type
      };

      const uploadedImage: Image = await trpc.uploadImage.mutate(uploadData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onImageUploaded(uploadedImage);
      onSuccess(`📸 "${file.name}" uploaded successfully!`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      onError('Failed to upload image. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload New Image</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Drag and Drop Zone */}
          <div
            className={`upload-zone ${isDragging ? 'border-blue-500 bg-blue-50' : ''} ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragging ? '📂 Drop your image here' : '📸 Click or drag image to upload'}
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: JPG, PNG, GIF, WebP • Max size: 10MB
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>

          {/* Hidden File Input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            disabled={isUploading}
            className="hidden"
          />

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}