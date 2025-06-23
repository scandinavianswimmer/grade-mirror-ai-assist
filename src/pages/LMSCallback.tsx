
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { exchangeCodeForToken } from '@/lib/canvasOAuth';
import { useToast } from '@/hooks/use-toast';

const LMSCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const canvasUrl = localStorage.getItem('canvas_url') || 'https://canvas.instructure.com';

      if (error) {
        setStatus('error');
        setMessage(`Canvas authorization failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from Canvas');
        return;
      }

      if (!user) {
        setStatus('error');
        setMessage('User not authenticated');
        return;
      }

      try {
        await exchangeCodeForToken(code, canvasUrl, user.id);
        setStatus('success');
        setMessage('Successfully connected to Canvas!');
        
        toast({
          title: "Canvas Connected",
          description: "Your Canvas account has been successfully linked.",
        });

        // Redirect to LMS page after 2 seconds
        setTimeout(() => {
          navigate('/lms');
        }, 2000);
      } catch (error) {
        setStatus('error');
        setMessage(`Failed to connect to Canvas: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Canvas. Please try again.",
          variant: "destructive"
        });
      }
    };

    handleCallback();
  }, [searchParams, user, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Connecting to Canvas...</h2>
            <p className="text-gray-600">Please wait while we establish the connection.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-800">Connection Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you back to the LMS page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-800">Connection Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/lms')}
              className="text-blue-600 hover:underline"
            >
              Return to LMS Integration
            </button>
          </>
        )}
      </Card>
    </div>
  );
};

export default LMSCallback;
