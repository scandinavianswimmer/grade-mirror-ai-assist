
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { finalizeSubmission, FinalizationOptions } from '@/lib/finalizationApi';

interface FinalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: Array<{
    id: string;
    student_name: string;
    status: string;
    ai_grade?: string;
  }>;
  onFinalized: () => void;
}

const FinalizationModal = ({ isOpen, onClose, submissions, onFinalized }: FinalizationModalProps) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<FinalizationOptions>({
    exportFormat: 'pdf',
    includeComments: true,
    pushToLMS: false,
    sendNotification: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleFinalize = async () => {
    setIsProcessing(true);
    setResults([]);

    try {
      const newResults = [];

      for (const submission of submissions) {
        try {
          const result = await finalizeSubmission(submission.id, options);
          newResults.push({
            submissionId: submission.id,
            studentName: submission.student_name,
            success: true,
            result
          });
          
          toast({
            title: "Submission finalized",
            description: `${submission.student_name}'s submission has been finalized.`,
          });
        } catch (error) {
          newResults.push({
            submissionId: submission.id,
            studentName: submission.student_name,
            success: false,
            error: error.message
          });
          
          toast({
            title: "Finalization failed",
            description: `Failed to finalize ${submission.student_name}'s submission.`,
            variant: "destructive"
          });
        }
      }

      setResults(newResults);
      onFinalized();
      
      toast({
        title: "Finalization complete",
        description: `Processed ${submissions.length} submissions.`,
      });

    } catch (error) {
      toast({
        title: "Finalization error",
        description: "An unexpected error occurred during finalization.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalize Submissions</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission List */}
          <div className="space-y-2">
            <h3 className="font-medium">Submissions to finalize ({submissions.length})</h3>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-3 space-y-2">
              {submissions.map((submission) => (
                <div key={submission.id} className="flex justify-between items-center">
                  <span className="text-sm">{submission.student_name}</span>
                  <Badge variant="outline">{submission.ai_grade || 'Ungraded'}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Finalization Options */}
          <div className="space-y-4">
            <h3 className="font-medium">Finalization Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Label htmlFor="export-format">Export Format:</Label>
                <Select
                  value={options.exportFormat}
                  onValueChange={(value) => setOptions(prev => ({ ...prev, exportFormat: value as any }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-comments"
                  checked={options.includeComments}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeComments: !!checked }))
                  }
                />
                <Label htmlFor="include-comments">Include inline comments in export</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="push-lms"
                  checked={options.pushToLMS}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, pushToLMS: !!checked }))
                  }
                />
                <Label htmlFor="push-lms">Push grades to LMS (Canvas)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-notification"
                  checked={options.sendNotification}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, sendNotification: !!checked }))
                  }
                />
                <Label htmlFor="send-notification">Send notification to students</Label>
              </div>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Finalization Results</h3>
              <div className="max-h-32 overflow-y-auto border rounded-lg p-3 space-y-2">
                {results.map((result) => (
                  <div key={result.submissionId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.success)}
                      <span className="text-sm">{result.studentName}</span>
                    </div>
                    {!result.success && (
                      <Badge variant="destructive" className="text-xs">
                        {result.error}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              {results.length > 0 ? 'Close' : 'Cancel'}
            </Button>
            
            {results.length === 0 && (
              <Button 
                onClick={handleFinalize} 
                disabled={isProcessing || submissions.length === 0}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Finalize {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizationModal;
