import { useState } from 'react';
import { FileText, Loader2, PenLine, ShieldCheck, Upload } from 'lucide-react';

import Navbar from '@/components/Navbar';
import TrainingDataManager from '@/components/TrainingDataManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromFile } from '@/lib/fileUpload';
import { supabase } from '@/lib/supabase';

const Training = () => {
  const [uploadingType, setUploadingType] = useState<'assignment' | 'rubric' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadFile = async (file: File, bucket: string) => {
    if (!user) throw new Error('Not authenticated');
    const fileExtension = file.name.split('.').pop();
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExtension}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) throw error;
    return filePath;
  };

  const handleUploadExample = (dataType: 'assignment' | 'rubric') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;

      setUploadingType(dataType);
      try {
        const filePath = await uploadFile(file, 'training-data');
        // Validate that the selected document can be read before recording it as an example.
        await extractTextFromFile(file);

        const { error } = await supabase.from('training_data').insert({
          user_id: user.id,
          data_type: dataType,
          title: file.name,
          file_url: filePath,
          processed: false,
        });
        if (error) throw error;

        toast({
          title: 'Feedback example added',
          description: 'It is saved in your feedback style library. Its processing status appears below.',
        });
      } catch (error) {
        console.error('Feedback example upload failed:', error);
        toast({
          title: 'Could not add that example',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setUploadingType(null);
      }
    };

    input.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">Feedback style</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Help drafts sound more like you.</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Add examples of assignments, rubrics, and feedback you have already written. Mr Selby
            uses them as context for future first passes; you still review every consequential decision.
          </p>
        </header>

        <section aria-labelledby="add-examples-heading" className="mt-9">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 id="add-examples-heading" className="font-display text-2xl font-semibold">Add an example</h2>
              <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX, or TXT. Use de-identified material whenever possible.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <PenLine className="h-5 w-5" aria-hidden="true" />
                </span>
                <CardTitle className="mt-4 font-display text-xl">A graded paper</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="min-h-12 leading-6 text-muted-foreground">
                  Add a paper that shows the kind of margin notes, summary feedback, or scoring you use.
                </p>
                <Button
                  className="mt-5 min-h-11 gap-2"
                  onClick={() => handleUploadExample('assignment')}
                  disabled={uploadingType !== null}
                >
                  {uploadingType === 'assignment' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Adding…</>
                  ) : (
                    <><Upload className="h-4 w-4" aria-hidden="true" /> Add a graded paper</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-suggestion">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <CardTitle className="mt-4 font-display text-xl">A rubric</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="min-h-12 leading-6 text-muted-foreground">
                  Add a rubric you use often so future drafts start from your actual criteria and language.
                </p>
                <Button
                  variant="outline"
                  className="mt-5 min-h-11 gap-2"
                  onClick={() => handleUploadExample('rubric')}
                  disabled={uploadingType !== null}
                >
                  {uploadingType === 'rubric' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Adding…</>
                  ) : (
                    <><Upload className="h-4 w-4" aria-hidden="true" /> Add a rubric</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex gap-3 rounded-lg border border-border bg-secondary/45 p-4 text-sm leading-6">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p>
              <strong className="font-semibold text-foreground">Use examples you are allowed to share.</strong>{' '}
              Remove names and identifying details first. You can rename or delete anything in this library below.
            </p>
          </div>
        </section>

        <section aria-labelledby="saved-examples-heading" className="mt-10">
          <h2 id="saved-examples-heading" className="sr-only">Saved feedback examples</h2>
          <TrainingDataManager />
        </section>
      </main>
    </div>
  );
};

export default Training;
