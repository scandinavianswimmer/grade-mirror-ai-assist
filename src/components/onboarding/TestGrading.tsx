
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, CheckCircle } from 'lucide-react';
import { testAIGrading } from '@/lib/onboardingApi';

interface TestGradingProps {
  userId: string;
  onComplete: () => void;
}

const TestGrading = ({ userId, onComplete }: TestGradingProps) => {
  const { toast } = useToast();
  const [essay, setEssay] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const sampleEssay = `The American Revolution was a significant turning point in world history. It began in 1775 when tensions between Great Britain and thirteen American colonies reached a breaking point. The colonists were upset about taxation without representation in Parliament.

Several key events led to the revolution including the Boston Tea Party in 1773 and the Boston Massacre in 1770. These events created anger among the colonists who felt their rights were being violated.

The war officially ended in 1783 with the Treaty of Paris. This established the United States as an independent nation and changed the course of world history forever.`;

  const handleGenerate = async () => {
    if (!essay.trim()) {
      toast({
        title: "No essay provided",
        description: "Please enter an essay to grade.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await testAIGrading(userId, essay);
      setFeedback(result.feedback);
      setGrade(result.grade);
      setHasGenerated(true);
      toast({
        title: "Feedback generated!",
        description: "Review the AI's grading based on your style."
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Could not generate feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const useSampleEssay = () => {
    setEssay(sampleEssay);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Review a first pass</h3>
        <p className="text-gray-600">
          Use the fictional paper below to check a drafted score and feedback before adding student work.
        </p>
      </div>

      {/* Essay Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="essay">Student Essay</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={useSampleEssay}
            >
              Use fictional paper
            </Button>
          </div>
          <Textarea
            id="essay"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Paste a fictional or de-identified paper here…"
            rows={8}
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !essay.trim()}
            className="w-full"
          >
            {loading ? 'Drafting feedback…' : 'Draft score and feedback'}
          </Button>
        </div>
      </Card>

      {/* AI Feedback Results */}
      {hasGenerated && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold">First pass ready for review</h4>
            </div>

            {grade && (
              <div>
                <Label className="text-sm font-medium">Draft score</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-lg">
                    {grade}
                  </Badge>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Draft feedback</Label>
              <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{feedback}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Check this wording against the paper. In the review workspace, you can accept, edit,
                or dismiss each note before approving the result.
              </p>
              
              <Button onClick={onComplete} className="w-full">
                Continue to Today
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!hasGenerated && (
        <div className="text-center text-gray-500 text-sm">
          Generate feedback above to continue with the setup process.
        </div>
      )}
    </div>
  );
};

export default TestGrading;
