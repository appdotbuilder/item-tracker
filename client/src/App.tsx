import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { LogOut, Image as ImageIcon } from 'lucide-react';
import { AuthForm } from '@/components/AuthForm';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageGallery } from '@/components/ImageGallery';
// Using type-only imports for better TypeScript compliance
import type { 
  Image, 
  AuthResponse 
} from '../../server/src/schema';

// Define public user type (without password_hash)
type PublicUser = {
  id: number;
  email: string;
  username: string;
  created_at: Date;
  updated_at: Date;
};

interface AuthState {
  isAuthenticated: boolean;
  user: PublicUser | null;
  token: string | null;
}

function App() {
  // Authentication state
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Images state
  const [images, setImages] = useState<Image[]>([]);



  // Load user session from localStorage on app start
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth) as AuthState;
        setAuth(parsedAuth);
      } catch (error) {
        console.error('Failed to parse saved auth:', error);
        localStorage.removeItem('auth');
      }
    }
  }, []);

  // Load images when user is authenticated
  const loadImages = useCallback(async () => {
    if (!auth.user) return;
    
    try {
      const userImages = await trpc.getUserImages.query({ user_id: auth.user.id });
      setImages(userImages);
    } catch (error) {
      console.error('Failed to load images:', error);
      setError('Failed to load your images');
    }
  }, [auth.user]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadImages();
    }
  }, [auth.isAuthenticated, loadImages]);

  const handleAuthSuccess = (response: AuthResponse) => {
    const newAuth: AuthState = {
      isAuthenticated: true,
      user: response.user,
      token: response.token || null
    };
    
    setAuth(newAuth);
    localStorage.setItem('auth', JSON.stringify(newAuth));
    
    if (response.user.username) {
      setSuccess(`👋 Welcome back, ${response.user.username}!`);
    } else {
      setSuccess('🎉 Account created successfully! Welcome aboard!');
    }
  };

  const handleAuthAction = async (action: () => Promise<AuthResponse>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await action();
      handleAuthSuccess(response);
    } catch (error) {
      console.error('Auth failed:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null
    });
    localStorage.removeItem('auth');
    setImages([]);
    setSuccess('👋 See you later!');
  };

  const handleImageUploaded = (image: Image) => {
    setImages((prev: Image[]) => [image, ...prev]);
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!auth.user) return;

    await trpc.deleteImage.mutate({
      image_id: imageId,
      user_id: auth.user.id
    });

    // Remove from images list
    setImages((prev: Image[]) => prev.filter((img: Image) => img.id !== imageId));
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (!auth.isAuthenticated) {
    return (
      <AuthForm
        onAuthSuccess={handleAuthSuccess}
        onAuthAction={handleAuthAction}
        error={error}
        success={success}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <ImageIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ImageVault</h1>
              <p className="text-sm text-gray-600">Welcome back, {auth.user?.username}! 👋</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        {auth.user && (
          <div className="mb-8">
            <ImageUpload
              user={auth.user}
              onImageUploaded={handleImageUploaded}
              onError={setError}
              onSuccess={setSuccess}
            />
          </div>
        )}

        {/* Images Gallery */}
        {auth.user && (
          <ImageGallery
            images={images}
            user={auth.user}
            onDeleteImage={handleDeleteImage}
            onError={setError}
            onSuccess={setSuccess}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

export default App;