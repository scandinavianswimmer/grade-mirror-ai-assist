
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Edit, Star, Brain, Loader2, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { generateGradingFeedback, type GradingResponse } from "@/lib/geminiApi";
import { useAuth } from "@/components/AuthProvider";
import type { ReactNode } from "react";

// Render essay text with highlighted comment spans as React nodes — never raw HTML (C8).
// Text content is escaped by React; the comment is shown via the safe title attribute.
const renderWithHighlights = (
  text: string,
  comments: { text: string; comment: string }[],
): ReactNode[] => {
  let nodes: ReactNode[] = [text];
  comments.forEach((c, ci) => {
    if (!c.text) return;
    const next: ReactNode[] = [];
    nodes.forEach((node, ni) => {
      if (typeof node !== "string") { next.push(node); return; }
      const idx = node.indexOf(c.text);
      if (idx === -1) { next.push(node); return; }
      const before = node.slice(0, idx);
      const after = node.slice(idx + c.text.length);
      if (before) next.push(before);
      next.push(
        <span
          key={`hl-${ci}-${ni}-${idx}`}
          className="bg-yellow-100 px-1 rounded cursor-help"
          title={c.comment}
        >
          {c.text}
        </span>,
      );
      if (after) next.push(after);
    });
    nodes = next;
  });
  return nodes;
};

const GradingPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<GradingResponse | null>(null);
  // No fabricated defaults — these populate only from a real AI response (H17).
  const [finalGrade, setFinalGrade] = useState("");
  const [overallFeedback, setOverallFeedback] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Sample essay and rubric for demo
  const sampleEssay = `In Shakespeare's Hamlet, the theme of appearance versus reality permeates throughout the entire play, creating a complex web of deception that ultimately leads to tragedy. The protagonist's struggle to distinguish between what seems to be true and what actually is true serves as the driving force behind much of the play's action.

From the very beginning, we see this theme established with the ghost of Hamlet's father. Hamlet questions whether the ghost is real or a figment of his imagination, and whether its claims about Claudius are true. This uncertainty sets the tone for the entire play.

The play-within-a-play scene exemplifies this theme perfectly. Hamlet uses "The Mousetrap" to test Claudius's guilt, attempting to make reality visible through performance. The irony is that Hamlet uses fiction to reveal truth, blurring the lines between appearance and reality even further.

In conclusion, Shakespeare masterfully weaves the theme of appearance versus reality throughout Hamlet, creating a tragedy that forces both characters and audience to question the nature of truth itself.`;

  const sampleRubric = `Literary Analysis Rubric:
- Thesis & Argument (25%): Clear, compelling thesis with strong supporting arguments
- Textual Evidence (25%): Appropriate use of quotes and examples from the text
- Organization (25%): Logical structure with smooth transitions
- Writing Quality (25%): Grammar, style, and clarity of expression`;

  const handleGenerateAIFeedback = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to generate AI feedback.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await generateGradingFeedback(
        sampleEssay,
        sampleRubric,
        user.id
      );
      
      setAiResponse(response);
      setFinalGrade(response.suggestedGrade);
      setOverallFeedback(response.overallFeedback);
      
      toast({
        title: "AI feedback generated!",
        description: `Generated with ${Math.round(response.confidence * 100)}% confidence`,
      });
    } catch (error) {
      console.error('Error generating feedback:', error);
      toast({
        title: "Failed to generate feedback",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = () => {
    toast({
      title: "Grade finalized!",
      description: "Feedback and grade have been saved and will be synced to your LMS.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Grading Preview</h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline">Essay Assignment #3</Badge>
            <Badge variant="outline">Student: John Smith</Badge>
            {aiResponse && (
              <Badge className="bg-green-100 text-green-800">
                AI Confidence: {Math.round(aiResponse.confidence * 100)}%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Essay */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Student Submission</h2>
                <Button 
                  onClick={handleGenerateAIFeedback}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating AI Feedback...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Generate AI Feedback
                    </>
                  )}
                </Button>
              </div>
              
              <div className="prose max-w-none">
                <div className="relative">
                  {sampleEssay.split(/\n{2,}/).map((para, i) => (
                    <p key={`para-${i}`} className="mb-4">
                      {renderWithHighlights(para, aiResponse?.inlineComments ?? [])}
                    </p>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Grading Panel */}
          <div className="space-y-6">
            {/* Rubric breakdown — from the actual AI response, never hardcoded ratings (H16/M67) */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Rubric Breakdown</h3>
              {aiResponse?.rubricBreakdown && aiResponse.rubricBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {aiResponse.rubricBreakdown.map((item, i) => (
                    <div key={i} className="flex justify-between items-center gap-3">
                      <span className="text-sm">{item.criterion}</span>
                      <Badge variant="secondary">{item.score}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Run AI feedback to see a rubric-aligned breakdown.</p>
              )}
            </Card>

            {/* AI Grade */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">AI Suggested Grade</h3>
                {aiResponse && (
                  <RefreshCw 
                    className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={handleGenerateAIFeedback}
                  />
                )}
              </div>
              
              <div className="mb-4">
                <Label htmlFor="grade">Final Grade</Label>
                <Input
                  id="grade"
                  value={finalGrade}
                  onChange={(e) => setFinalGrade(e.target.value)}
                  className="mt-1 text-2xl font-bold text-center"
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="feedback">Overall Feedback</Label>
                <Textarea
                  id="feedback"
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  className="mt-1"
                  rows={6}
                />
              </div>

              {aiResponse?.reasoning && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>AI Reasoning:</strong> {aiResponse.reasoning}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button onClick={handleFinalize} className="w-full">
                  <Check className="w-4 h-4 mr-2" />
                  Accept & Finalize Grade
                </Button>
              </div>
            </Card>

            {/* AI Insights */}
            {aiResponse && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
                <div className="space-y-3 text-sm">
                  {aiResponse.inlineComments.slice(0, 3).map((comment, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <p>{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingPreview;
