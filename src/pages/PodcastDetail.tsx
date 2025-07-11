import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Copy, Share2, Mic, Calendar, Hash } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PodcastEpisode {
  id: string;
  title: string;
  input_notes?: string;
  script: string;
  summary: string;
  tags: string[];
  voice_style: string;
  audio_url?: string;
  transcript?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PodcastDetail() {
  const { id } = useParams<{ id: string }>();
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchEpisode();
  }, [id]);

  const fetchEpisode = async () => {
    try {
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEpisode(data);
    } catch (error) {
      console.error('Error fetching episode:', error);
      toast({
        title: "Error",
        description: "Failed to load podcast episode",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold mb-4">Episode Not Found</h1>
          <p className="text-muted-foreground">The podcast episode you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="h-6 w-6 text-primary" />
            <Badge variant="secondary">{episode.status}</Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">{episode.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(episode.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Script */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Podcast Script</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(episode.script, 'Script')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAsText(episode.script, `${episode.title}-script.txt`)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {episode.script}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Input Notes */}
            {episode.input_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Original Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {episode.input_notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Episode Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed mb-4">{episode.summary}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(episode.summary, 'Summary')}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Summary
                </Button>
              </CardContent>
            </Card>

            {/* Voice Style */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Direction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {episode.voice_style}
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            {episode.tags && episode.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Social Media Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {episode.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => copyToClipboard(episode.tags.join(' '), 'Tags')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Tags
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => downloadAsText(
                    `${episode.title}\n\n${episode.summary}\n\n${episode.script}`,
                    `${episode.title}-complete.txt`
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Complete
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const shareText = `Check out this podcast episode: ${episode.title}\n\n${episode.summary}`;
                    copyToClipboard(shareText, 'Share text');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Share Text
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}