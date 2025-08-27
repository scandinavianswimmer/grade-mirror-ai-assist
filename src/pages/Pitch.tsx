import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  Shield, 
  FileText, 
  MessageSquare,
  Download,
  Play,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Pitch = () => {
  const [beforeAfter, setBeforeAfter] = useState<'before' | 'after'>('before');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold text-primary">aiTA</div>
            <div className="hidden md:flex space-x-6 text-sm">
              <a href="#product" className="text-muted-foreground hover:text-foreground transition-colors">Product</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
              <a href="#results" className="text-muted-foreground hover:text-foreground transition-colors">Results</a>
              <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Security</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">Sign in</Button>
            <Button size="sm">Start free</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            You're not "falling behind." You're carrying the weight of a whole classroom.
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-in">
            The late-night grading. The copy-and-paste feedback. The guilt when family time loses to the stack on your desk. 
            It's not that you're not enough—you're being asked to do the work of three people.
          </p>
          
          <p className="text-2xl font-semibold text-foreground mb-12 animate-fade-in">
            aiTA gives you your evenings back—without compromising the feedback your students deserve.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-12 text-left max-w-2xl mx-auto">
            {[
              "Drafts inline, teacher-tone comments that learn from your edits",
              "Finds your rubric and instructions, aligns feedback, and proposes scores",
              "Extracts text from student uploads and returns downloadable, annotated essays",
              "Summarizes strengths, next steps, and a feedback synopsis you approve"
            ].map((point, index) => (
              <div key={index} className="flex items-start space-x-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">{point}</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="text-lg px-8">
              Start free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Book a 10-min walkthrough
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary">In-app</Badge>
            <Badge variant="secondary">Teacher-controlled</Badge>
            <Badge variant="secondary">Rubric-aligned</Badge>
            <Badge variant="secondary">Built for ELA & Humanities</Badge>
          </div>
        </div>
      </section>

      {/* Scroll Story */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            The real problem isn't you. It's the workload.
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            You write the lessons. You hold the room together. And then the pile of essays whispers, "You're behind." 
            You're not behind. You're carrying too much.
          </p>
          
          <p className="text-2xl font-semibold text-primary mb-12">
            aiTA shoulders the repetitive work so you can show up where you matter most.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Badge variant="outline" className="px-4 py-2 text-base">Less mechanical marking</Badge>
            <Badge variant="outline" className="px-4 py-2 text-base">More real conversations</Badge>
            <Badge variant="outline" className="px-4 py-2 text-base">More sleep</Badge>
          </div>
        </div>
      </section>

      {/* Before/After Switcher */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            The Day Feels Different
          </h2>
          
          <div className="flex justify-center mb-12">
            <div className="bg-muted rounded-full p-1 flex">
              <button
                onClick={() => setBeforeAfter('before')}
                className={`px-6 py-2 rounded-full transition-all ${
                  beforeAfter === 'before' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Before aiTA
              </button>
              <button
                onClick={() => setBeforeAfter('after')}
                className={`px-6 py-2 rounded-full transition-all ${
                  beforeAfter === 'after' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                After aiTA
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {beforeAfter === 'before' ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <Clock className="w-5 h-5" />
                    <span>10:14 PM: still grading</span>
                  </div>
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <MessageSquare className="w-5 h-5" />
                    <span>Same comment, different student</span>
                  </div>
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <FileText className="w-5 h-5" />
                    <span>Rubric check, copy-paste, repeat</span>
                  </div>
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <Clock className="w-5 h-5" />
                    <span>Weekend disappears to "just one more stack"</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-primary">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>4:30 PM: laptop closed</span>
                  </div>
                  <div className="flex items-center space-x-3 text-primary">
                    <MessageSquare className="w-5 h-5" />
                    <span>Comments drafted in your voice</span>
                  </div>
                  <div className="flex items-center space-x-3 text-primary">
                    <Star className="w-5 h-5" />
                    <span>Rubric-true, score proposals ready</span>
                  </div>
                  <div className="flex items-center space-x-3 text-primary">
                    <Download className="w-5 h-5" />
                    <span>Downloadable, annotated essays + summary</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <p className="text-center text-xl font-semibold text-foreground mt-12">
            Keep your standards. Lose the grind.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Feedback that sounds like you—delivered faster.
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8 mt-16">
            {[
              {
                step: "1",
                title: "Upload",
                description: "Add the student files; aiTA extracts the text—no retyping, no extra tabs."
              },
              {
                step: "2", 
                title: "Align",
                description: "aiTA finds your instructions and rubric, then drafts inline comments and proposes rubric-aligned scores."
              },
              {
                step: "3",
                title: "Review", 
                description: "Approve, tweak, or dismiss. aiTA learns your tone and tightens its drafts every time."
              },
              {
                step: "4",
                title: "Deliver",
                description: "Export a downloadable, annotated essay plus a clean feedback summary for students and guardians."
              }
            ].map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-lg text-muted-foreground mt-12">
            You stay the teacher. aiTA does the heavy lifting.
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            Benefits that map to feelings
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Your voice, preserved.",
                description: "Comments match your tone. You never sound like a robot."
              },
              {
                icon: Star,
                title: "Rubric-true scoring.",
                description: "Aligned proposals you can defend—and edit in seconds."
              },
              {
                icon: FileText,
                title: "Inline + summary, together.",
                description: "Students get line-by-line guidance and a clear next-steps snapshot."
              },
              {
                icon: CheckCircle2,
                title: "All in one place.",
                description: "No juggling tabs or tools. aiTA lives inside your app."
              },
              {
                icon: ArrowRight,
                title: "Learns from you.",
                description: "Every tweak teaches aiTA your style and standards."
              },
              {
                icon: Download,
                title: "Ready to share.",
                description: "Download annotated PDFs for LMS, conferences, or portfolios."
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-xl text-muted-foreground mb-8">
            "Remember when teaching felt like teaching—not triage at midnight?"
          </p>
          
          <div className="bg-card rounded-lg p-8 shadow-lg">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-6">
              <div className="text-center">
                <Play className="w-16 h-16 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Demo Video</p>
                <p className="text-sm text-muted-foreground">Upload → Align → Review → Export</p>
              </div>
            </div>
            <p className="text-muted-foreground">Your voice. Your standards. Your evening back.</p>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section id="results" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            Outcomes teachers actually feel
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              "Time back for planning, parent emails, and life outside school",
              "Better student uptake because feedback is clear and in your voice", 
              "Less decision fatigue with strong drafts and aligned score proposals",
              "Confidence that your grading aligns with expectations and is documented"
            ].map((outcome, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">{outcome}</span>
              </div>
            ))}
          </div>
          
          <p className="text-center text-xl text-foreground mt-12">
            No hype—just meaningful hours returned to your week.
          </p>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            You stay in control. Your data stays yours.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: "You approve every comment and score.",
                description: "aiTA suggests; you decide."
              },
              {
                icon: Shield,
                title: "Private by design.",
                description: "Built to support school privacy practices and district policies."
              },
              {
                icon: FileText,
                title: "Data handling transparency.",
                description: "Clear settings for retention and deletion."
              },
              {
                icon: ArrowRight,
                title: "Works with your workflow.",
                description: "No LMS lock-in; export and share on your terms."
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                <item.icon className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-center text-lg text-muted-foreground mt-12">
            If you have requirements, we'll meet them. That's our job.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            Start free. Upgrade when you're ready.
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-4">Free</h3>
                <p className="text-muted-foreground mb-6">
                  Try aiTA with your real assignments. No credit card.
                </p>
                <Button className="w-full">Start Free</Button>
                <p className="text-sm text-muted-foreground mt-4">Cancel anytime</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow border-primary">
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <p className="text-muted-foreground mb-6">
                  For teachers who want it every week.
                </p>
                <Button className="w-full">Upgrade to Pro</Button>
                <p className="text-sm text-muted-foreground mt-4">Cancel anytime</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-4">School/District</h3>
                <p className="text-muted-foreground mb-6">
                  Volume pricing + onboarding support.
                </p>
                <Button variant="outline" className="w-full">Contact Sales</Button>
                <p className="text-sm text-muted-foreground mt-4">Custom terms</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {[
              {
                question: "Will aiTA replace me?",
                answer: "No. aiTA drafts; you approve. It's a power tool, not a substitute."
              },
              {
                question: "Will comments sound generic?",
                answer: "aiTA learns from your edits, so feedback keeps sounding like you."
              },
              {
                question: "Can I use my own rubrics?",
                answer: "Yes. aiTA pulls your rubric and proposes aligned scores you can edit."
              },
              {
                question: "Does it work for ELA and History?",
                answer: "Yes—built for essay-driven courses first, with more subjects coming."
              },
              {
                question: "What about privacy?",
                answer: "We support district privacy practices. You control retention and exports."
              },
              {
                question: "How hard is it to start?",
                answer: "Upload, review, export. Most teachers are comfortable in minutes."
              }
            ].map((faq, index) => (
              <Card key={index} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-6">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold">{faq.question}</h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <p className="text-muted-foreground mt-4">{faq.answer}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Stop choosing between great feedback and a life outside school.
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12">
            Teach with a full heart—aiTA carries the stack.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="text-lg px-8">
              Start free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Book a 10-min walkthrough
            </Button>
          </div>
          
          <p className="text-muted-foreground">
            No credit card. You keep control.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-8">
            <a href="#product" className="hover:text-foreground transition-colors">Product</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            <a href="#terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#privacy" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Copyright © aiTA
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pitch;