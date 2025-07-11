import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Mic, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function PodcastGenerator() {
  const [title, setTitle] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a podcast title",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to generate podcasts');
      }

      // Call the edge function to generate podcast
      const { data, error } = await supabase.functions.invoke('generate-podcast', {
        body: {
          title: title.trim(),
          inputNotes: inputNotes.trim(),
          userId: user.id
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error('Failed to generate podcast');
      }

      toast({
        title: "Success!",
        description: "Your podcast script has been generated successfully.",
      });

      // Navigate to the generated podcast
      navigate(`/podcast/${data.podcast.id}`);

    } catch (error) {
      console.error('Error generating podcast:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate podcast",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mic className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Podcast Generator</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Generate AI-powered podcast scripts for AEC industry insights
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Create New Episode
              </CardTitle>
              <CardDescription>
                Enter your podcast topic and any additional notes to generate a professional script
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Episode Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., The $150M Shockwave: Why Early Estimates Fail"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any specific topics, examples, or context you want included in the episode..."
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isGenerating}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Script...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Podcast Script
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <Card>
            <CardHeader>
              <CardTitle>What You'll Get</CardTitle>
              <CardDescription>
                Our AI generates comprehensive podcast content tailored for AEC professionals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <h4 className="font-medium">Professional Script</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete 15-20 minute episode script with natural flow and timing cues
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <h4 className="font-medium">Industry Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    AEC-specific content with real-world examples and technical accuracy
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <h4 className="font-medium">Tool Recommendations</h4>
                  <p className="text-sm text-muted-foreground">
                    Mentions of relevant AI tools like Togal.ai, Alice Tech, and nPlan
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <h4 className="font-medium">Voice Direction</h4>
                  <p className="text-sm text-muted-foreground">
                    Tone and delivery suggestions for professional narration
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <h4 className="font-medium">Social Media Ready</h4>
                  <p className="text-sm text-muted-foreground">
                    Episode summary and hashtags for easy promotion
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}