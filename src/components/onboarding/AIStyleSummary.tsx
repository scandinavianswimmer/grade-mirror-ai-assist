
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Brain, Edit } from 'lucide-react';
import { generateStyleSummary, saveAIProfile } from '@/lib/onboardingApi';

interface AIStyleSummaryProps {
  userId: string;
  onComplete: () => void;
}

const AIStyleSummary = ({ userId, onComplete }: AIStyleSummaryProps) => {
  const { toast } = useToast();
  const [summary, setSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateSummary = useCallback(async () => {
    setGenerating(true);
    try {
      const generatedSummary = await generateStyleSummary(userId);
      setSummary(generatedSummary);
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Could not analyze your grading style. Please try again.",
        variant: "destructive"
      });
      // Fallback summary
      setSummary("Based on your uploaded examples, you appear to have a balanced grading approach with attention to both content and structure. You provide constructive feedback that helps students improve their writing skills.");
    } finally {
      setGenerating(false);
    }
  }, [toast, userId]);

  useEffect(() => {
    generateSummary();
  }, [generateSummary]);

  const handleSave = async () => {
    if (!summary.trim()) {
      toast({
        title: "Missing summary",
        description: "Please provide a grading style summary.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await saveAIProfile(userId, summary);
      toast({
        title: "AI profile saved!",
        description: "Your grading style has been recorded."
      });
      onComplete();
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save your AI profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (generating) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold mb-2">Analyzing Your Grading Style</h3>
        <p className="text-gray-600">
          Our AI is reviewing your uploaded examples to understand your grading preferences...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Your AI Grading Style</h3>
        <p className="text-gray-600">
          Based on your uploaded examples, we've created a summary of your grading approach. 
          You can edit this to better reflect your preferences.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Grading Style Summary</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {isEditing ? (
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={6}
            placeholder="Describe your grading style and preferences..."
            className="mb-4"
          />
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
          </div>
        )}

        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditing(false)}>
              Save Changes
            </Button>
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={generateSummary} disabled={generating}>
          Regenerate Summary
        </Button>
        <Button onClick={handleSave} disabled={loading || !summary.trim()} className="flex-1">
          {loading ? 'Saving...' : 'Continue to Test'}
        </Button>
      </div>
    </div>
  );
};

export default AIStyleSummary;
