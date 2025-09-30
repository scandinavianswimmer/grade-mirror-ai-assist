import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AutoProcessingIndicatorProps {
  status: 'idle' | 'extracting' | 'analyzing' | 'complete' | 'error';
  progress?: number;
  message?: string;
}

export function AutoProcessingIndicator({ 
  status, 
  progress = 0,
  message 
}: AutoProcessingIndicatorProps) {
  if (status === 'idle') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'extracting':
        return {
          icon: <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />,
          title: 'Extracting Text',
          color: 'bg-blue-50 border-blue-200'
        };
      case 'analyzing':
        return {
          icon: <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />,
          title: 'AI Analysis in Progress',
          color: 'bg-purple-50 border-purple-200'
        };
      case 'complete':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          title: 'Processing Complete',
          color: 'bg-green-50 border-green-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          title: 'Processing Error',
          color: 'bg-red-50 border-red-200'
        };
      default:
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          title: 'Processing',
          color: 'bg-gray-50 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`fixed top-20 right-4 z-50 w-80 rounded-lg border-2 shadow-xl ${config.color} p-4 animate-fade-in`}>
      <div className="flex items-center gap-3 mb-3">
        {config.icon}
        <div>
          <h3 className="font-semibold text-sm">{config.title}</h3>
          {message && (
            <p className="text-xs text-gray-600 mt-1">{message}</p>
          )}
        </div>
      </div>
      
      {status !== 'complete' && status !== 'error' && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 text-right">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
}
