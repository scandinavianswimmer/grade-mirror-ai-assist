
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { BatchProcessingStatus, BatchProcessingResult } from '@/lib/batchProcessing';

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: BatchProcessingStatus[];
  result?: BatchProcessingResult;
  isProcessing: boolean;
}

const BatchProcessingModal = ({ 
  isOpen, 
  onClose, 
  statuses, 
  result, 
  isProcessing 
}: BatchProcessingModalProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const overallProgress = statuses.length > 0 
    ? Math.round(statuses.reduce((sum, status) => sum + status.progress, 0) / statuses.length)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Processing Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>

          {/* Summary Stats */}
          {result && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{result.totalSubmissions}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.processedSuccessfully}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          )}

          {/* Individual Submission Status */}
          <div className="space-y-3">
            <h3 className="font-medium">Submission Details</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {statuses.map((status) => (
                <div key={status.submissionId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status.status)}
                    <div>
                      <div className="font-medium">{status.studentName}</div>
                      {status.error && (
                        <div className="text-sm text-red-600">{status.error}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">{status.progress}%</div>
                    <Badge className={getStatusColor(status.status)}>
                      {status.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchProcessingModal;
