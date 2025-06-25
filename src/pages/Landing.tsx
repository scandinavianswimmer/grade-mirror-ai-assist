
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Brain, Clock, TrendingUp } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-green-700 mb-6">
            Grade Smarter, Not Harder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            GradeLift is an AI assistant that learns from your actual grading — not generic rubrics. 
            Free up your evenings, give students deeper feedback, and show your admins you're working at your best.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 text-lg rounded-lg">
              Start Free Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-green-700" />
                </div>
                <CardTitle className="text-xl font-semibold">Teacher-Trained AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Each AI model is privately trained from your previously graded assignments — 
                  nothing is shared, and the model stays yours.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-green-700" />
                </div>
                <CardTitle className="text-xl font-semibold">Better, Faster Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get back 5+ hours a week. Let students submit early drafts for richer, 
                  real-time feedback without doubling your workload.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-green-700" />
                </div>
                <CardTitle className="text-xl font-semibold">Built for Admin Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Improve learning outcomes while preserving autonomy. Admins see trends and 
                  performance without intruding on your workflow.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="bg-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">More Feedback = More Growth</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Students improve faster when essays are actually read. GradeLift scales your effort 
            without reducing quality — and shows students you're truly invested.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">FAQ</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                Is this really free for individual teachers?
              </AccordionTrigger>
              <AccordionContent>
                Yes. The core grading tools are free for teachers grading up to 100 essays/month.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                How is my AI model different?
              </AccordionTrigger>
              <AccordionContent>
                Your grading model is trained only from your files. Nothing is shared across teachers.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Can I edit the AI's output?
              </AccordionTrigger>
              <AccordionContent>
                Absolutely — you have full control over the feedback that's shared with students.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Do students benefit from this?
              </AccordionTrigger>
              <AccordionContent>
                Yes. More frequent and personalized feedback makes a huge difference — 
                especially for rough drafts.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Can schools integrate this into our LMS?
              </AccordionTrigger>
              <AccordionContent>
                Yes. Our enterprise plan integrates with Google Classroom, Canvas, and more.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-green-700 py-12 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Grading?</h2>
          <p className="text-green-100 mb-6">Join thousands of teachers already using AI to provide better feedback.</p>
          <Link to="/auth">
            <Button size="lg" variant="outline" className="bg-white text-green-700 hover:bg-gray-100 px-8 py-3">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
