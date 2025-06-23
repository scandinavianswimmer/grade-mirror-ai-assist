
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Edit, Star, Brain, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const GradingPreview = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [finalGrade, setFinalGrade] = useState("A-");
  const [overallFeedback, setOverallFeedback] = useState(
    "This is a well-structured essay that demonstrates strong analytical thinking and clear writing. Your thesis is compelling and well-supported throughout the paper. The use of textual evidence is appropriate and effectively integrated. Consider expanding on your conclusion to more explicitly connect your analysis to broader themes in the work."
  );
  const { toast } = useToast();

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
            <Badge className="bg-green-100 text-green-800">AI Confidence: 87%</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Essay */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-full">
              <h2 className="text-lg font-semibold mb-4">Student Submission</h2>
              <div className="prose max-w-none">
                <div className="relative">
                  <p className="mb-4">
                    In Shakespeare's Hamlet, the theme of appearance versus reality permeates throughout the entire play, 
                    creating a complex web of deception that ultimately leads to tragedy. 
                    <span className="bg-yellow-100 px-1 rounded cursor-pointer relative group">
                      The protagonist's struggle to distinguish between what seems to be true and what actually is true
                      <span className="absolute left-0 top-full mt-1 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        Great insight into the central conflict
                      </span>
                    </span> 
                    serves as the driving force behind much of the play's action.
                  </p>
                  
                  <p className="mb-4">
                    From the very beginning, we see this theme established with the ghost of Hamlet's father. 
                    <span className="bg-yellow-100 px-1 rounded cursor-pointer relative group">
                      Hamlet questions whether the ghost is real or a figment of his imagination
                      <span className="absolute left-0 top-full mt-1 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        Excellent textual support
                      </span>
                    </span>, 
                    and whether its claims about Claudius are true. This uncertainty sets the tone for the entire play.
                  </p>
                  
                  <p className="mb-4">
                    The play-within-a-play scene exemplifies this theme perfectly. Hamlet uses "The Mousetrap" to test 
                    Claudius's guilt, attempting to make reality visible through performance. 
                    <span className="bg-red-100 px-1 rounded cursor-pointer relative group">
                      The irony is that Hamlet uses fiction to reveal truth
                      <span className="absolute left-0 top-full mt-1 bg-orange-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        Consider developing this paradox further
                      </span>
                    </span>, 
                    blurring the lines between appearance and reality even further.
                  </p>
                  
                  <p>
                    In conclusion, Shakespeare masterfully weaves the theme of appearance versus reality throughout Hamlet, 
                    creating a tragedy that forces both characters and audience to question the nature of truth itself.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Grading Panel */}
          <div className="space-y-6">
            {/* Rubric */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Grading Rubric</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Thesis & Argument</span>
                  <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Textual Evidence</span>
                  <Badge className="bg-green-100 text-green-800">Proficient</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Organization</span>
                  <Badge className="bg-green-100 text-green-800">Proficient</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Writing Quality</span>
                  <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                </div>
              </div>
            </Card>

            {/* AI Grade */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">AI Suggested Grade</h3>
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

              <div className="space-y-3">
                <Button onClick={handleFinalize} className="w-full">
                  <Check className="w-4 h-4 mr-2" />
                  Accept & Finalize Grade
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send to LMS
                </Button>
              </div>
            </Card>

            {/* AI Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <p>Strong analytical thinking demonstrated throughout</p>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <p>Good use of textual evidence to support claims</p>
                </div>
                <div className="flex items-start gap-2">
                  <Edit className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p>Conclusion could be more developed</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingPreview;
