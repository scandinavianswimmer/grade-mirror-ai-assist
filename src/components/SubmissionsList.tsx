
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { createBatchProcessor, BatchProcessingStatus } from '@/lib/batchProcessing';
import BatchProcessingModal from './BatchProcessingModal';
import { 
  FileText, 
  Search, 
  Filter, 
  Play, 
  RefreshCw, 
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Brain
} from 'lucide-react';

interface Submission {
  id: string;
  student_name: string;
  status: string;
  processing_status: string;
  ai_grade?: string;
  created_at: string;
  file_url?: string;
}

interface SubmissionsListProps {
  assignmentId: string;
}

const SubmissionsList = ({ assignmentId }: SubmissionsListProps) => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatuses, setProcessingStatuses] = useState<BatchProcessingStatus[]>([]);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error loading submissions",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.student_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(filteredSubmissions.map(sub => sub.id));
    } else {
      setSelectedSubmissions([]);
    }
  };

  const handleSelectSubmission = (submissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(prev => [...prev, submissionId]);
    } else {
      setSelectedSubmissions(prev => prev.filter(id => id !== submissionId));
    }
  };

  const handleBatchProcess = async () => {
    if (selectedSubmissions.length === 0) {
      toast({
        title: "No submissions selected",
        description: "Please select submissions to process.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setShowProcessingModal(true);
    setProcessingStatuses([]);
    setProcessingResult(null);

    const batchProcessor = createBatchProcessor((statuses) => {
      setProcessingStatuses([...statuses]);
    });

    try {
      const result = await batchProcessor.processSubmissionsBatch(selectedSubmissions);
      setProcessingResult(result);
      
      toast({
        title: "Batch processing completed",
        description: `${result.processedSuccessfully} submissions processed successfully.`,
      });

      // Refresh submissions
      await fetchSubmissions();
      setSelectedSubmissions([]);

    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: "Batch processing failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (submission: Submission) => {
    if (submission.status === 'ai_graded' || submission.status === 'finalized') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (submission.processing_status === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    } else if (submission.processing_status === 'processing') {
      return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    } else {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (submission: Submission) => {
    const status = submission.status;
    const processingStatus = submission.processing_status;

    if (status === 'finalized') {
      return <Badge className="bg-green-100 text-green-800">Finalized</Badge>;
    } else if (status === 'ai_graded') {
      return <Badge className="bg-blue-100 text-blue-800">AI Graded</Badge>;
    } else if (processingStatus === 'error') {
      return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    } else if (processingStatus === 'processing') {
      return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-lg font-medium">Loading submissions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Submissions ({filteredSubmissions.length})</span>
            <div className="flex items-center gap-2">
              {selectedSubmissions.length > 0 && (
                <Button
                  onClick={handleBatchProcess}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  Process with AI ({selectedSubmissions.length})
                </Button>
              )}
            </div>
          </CardTitle>
          
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ai_graded">AI Graded</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {submissions.length === 0 
                ? "No submissions yet. Upload essays to get started."
                : "No submissions match your filters."
              }
            </div>
          ) : (
            <div className="space-y-1">
              {/* Select All Header */}
              <div className="flex items-center gap-3 p-3 border-b font-medium text-sm text-gray-600">
                <Checkbox
                  checked={selectedSubmissions.length === filteredSubmissions.length}
                  onCheckedChange={handleSelectAll}
                />
                <span>Student Name</span>
                <span className="ml-auto">Status</span>
                <span className="w-20">Grade</span>
                <span className="w-24">Actions</span>
              </div>

              {/* Submissions List */}
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    checked={selectedSubmissions.includes(submission.id)}
                    onCheckedChange={(checked) => 
                      handleSelectSubmission(submission.id, checked as boolean)
                    }
                  />
                  
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{submission.student_name}</div>
                      <div className="text-sm text-gray-500">
                        Submitted {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(submission)}
                    {getStatusBadge(submission)}
                  </div>

                  <div className="w-20 text-center">
                    {submission.ai_grade && (
                      <span className="font-bold text-lg">{submission.ai_grade}</span>
                    )}
                  </div>

                  <div className="w-24">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BatchProcessingModal
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
        statuses={processingStatuses}
        result={processingResult}
        isProcessing={isProcessing}
      />
    </>
  );
};

export default SubmissionsList;
