import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Trash2, Image as ImageIcon, Calendar, HardDrive } from 'lucide-react';
import { useState } from 'react';
import type { Image } from '../../../server/src/schema';

// Define public user type (without password_hash)
type PublicUser = {
  id: number;
  email: string;
  username: string;
  created_at: Date;
  updated_at: Date;
};

interface ImageGalleryProps {
  images: Image[];
  user: PublicUser;
  onDeleteImage: (imageId: number) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  isLoading: boolean;
}

export function ImageGallery({ images, user, onDeleteImage, onError, onSuccess, isLoading }: ImageGalleryProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteConfirm = async (imageId: number, imageName: string) => {
    setDeletingId(imageId);
    try {
      await onDeleteImage(imageId);
      onSuccess(`🗑️ "${imageName}" deleted successfully`);
    } catch (error) {
      onError('Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (image: Image) => {
    // NOTE: Placeholder for download functionality
    // In a real application, you would:
    // 1. Generate a secure download URL
    // 2. Trigger the download or open in new tab
    onSuccess(`🔗 Download link for "${image.original_name}" (feature coming soon)`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = images.reduce((sum, img) => sum + img.file_size, 0);

  const sortedImages = images.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <ImageIcon className="h-5 w-5" />
            <span>Your Images ({images.length})</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <HardDrive className="h-3 w-3" />
              <span>{formatFileSize(totalSize)}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-600 mb-3">No images yet</h3>
            <p className="text-gray-500 mb-6">
              Upload your first image to start building your collection! 📷
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Download className="h-4 w-4" />
                <span>Easy downloads</span>
              </div>
              <div className="flex items-center space-x-1">
                <HardDrive className="h-4 w-4" />
                <span>Secure storage</span>
              </div>
              <div className="flex items-center space-x-1">
                <ImageIcon className="h-4 w-4" />
                <span>High quality</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="image-grid">
            {sortedImages.map((image: Image) => (
              <Card key={image.id} className="image-card group">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                  {/* NOTE: This is a placeholder for image display
                      In a real application, you would display the actual image */}
                  <div className="text-center p-4">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600 truncate max-w-full px-2">
                      {image.original_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {image.mime_type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(image)}
                        className="shadow-lg"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isLoading || deletingId === image.id}
                            className="shadow-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Image</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{image.original_name}"? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteConfirm(image.id, image.original_name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingId === image.id ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs flex items-center space-x-1">
                        <HardDrive className="h-3 w-3" />
                        <span>{formatFileSize(image.file_size)}</span>
                      </Badge>
                      <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(image.created_at).toLocaleDateString()}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleDownload(image)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            disabled={isLoading || deletingId === image.id}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Image</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{image.original_name}"? 
                              This action cannot be undone and the image will be permanently removed from your collection.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteConfirm(image.id, image.original_name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingId === image.id ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}