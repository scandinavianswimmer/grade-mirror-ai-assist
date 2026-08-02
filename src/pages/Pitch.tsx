import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SCHOOL_CONTACT_EMAIL, SCHOOL_CONTACT_SUBJECT } from '@/lib/pricingPlans';
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
  Feather,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const salesContactHref = SCHOOL_CONTACT_EMAIL
  ? `mailto:${SCHOOL_CONTACT_EMAIL}?subject=${encodeURIComponent(SCHOOL_CONTACT_SUBJECT)}`
  : null;

const Pitch = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleStartFree = () => {
    navigate('/auth?mode=signup');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <a href="#pitch-main" className="skip-link">Skip to main content</a>

      {/* Navigation */}
      <nav aria-label="Primary" className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-5 lg:gap-8">
            <Link
              to="/"
              className="flex items-center gap-2 text-primary transition-colors hover:text-primary/80"
              aria-label="Mr Selby overview"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Feather className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap font-display text-2xl font-semibold tracking-tight">Mr Selby</span>
            </Link>
            <div className="hidden md:flex space-x-6 text-sm">
              <a href="#product" className="story-link text-muted-foreground hover:text-foreground transition-colors">Product</a>
              <a href="#how-it-works" className="story-link text-muted-foreground hover:text-foreground transition-colors">How it works</a>
              <a href="#results" className="story-link text-muted-foreground hover:text-foreground transition-colors">Results</a>
              <a href="#security" className="story-link text-muted-foreground hover:text-foreground transition-colors">Security</a>
              <a href="#pricing" className="story-link text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#faq" className="story-link text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <Button onClick={handleSignIn} variant="ghost" size="sm" className="hover-scale">Sign in</Button>
            <Button onClick={handleStartFree} size="sm" className="hover-scale relative overflow-hidden">
              <span className="relative z-10">Try free</span>
            </Button>
          </div>
        </div>
      </nav>

      <main id="pitch-main" tabIndex={-1}>
      {/* Hero Section */}
      <section id="product" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Teacher-controlled grading co-pilot
          </p>
          <h1 className="mb-6 text-4xl font-bold text-foreground md:text-6xl">
            Thoughtful grading support, shaped by how you teach.
          </h1>

          <p className="mx-auto mb-6 max-w-3xl text-xl leading-relaxed text-muted-foreground animate-fade-in">
            Mr Selby reads the assignment, follows your rubric, and drafts clear feedback in your
            voice—so you can spend less time on repetitive grading and more time teaching.
          </p>

          <p className="mb-12 text-2xl font-semibold text-foreground animate-fade-in">
            You review every comment, adjust every score, and stay the final word.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-12 text-left max-w-2xl mx-auto">
            {[
              "Drafts inline, teacher‑tone comments that learn from your edits",
              "Finds your rubric and instructions, aligns feedback, and proposes scores",
              "Extracts text from student uploads and returns downloadable, annotated essays",
              "Summarizes strengths, next steps, and a feedback synopsis you approve"
            ].map((point, index) => (
              <div key={index} className={`flex items-start space-x-3 animate-fade-in hover-scale transition-all duration-300`} 
                   style={{ animationDelay: `${index * 0.1}s` }}>
                <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0 animate-pulse" />
                <span className="text-muted-foreground">{point}</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button onClick={handleStartFree} size="lg" className="text-lg px-8 hover-scale relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center">
                Grade your first assignment
                <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Button>
            {salesContactHref ? (
              <Button asChild variant="outline" size="lg" className="text-lg px-8 hover-scale relative overflow-hidden group">
                <a href={salesContactHref}>
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                  <span className="relative z-10">Book a 10‑minute walkthrough</span>
                </a>
              </Button>
            ) : (
              <Button disabled variant="outline" size="lg" className="text-lg px-8">
                Walkthroughs opening soon
              </Button>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-8 animate-fade-in">Start with sample work. No credit card.</p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {[
              "In‑app",
              "Teacher‑controlled", 
              "Rubric‑aligned",
              "Built for ELA & Humanities"
            ].map((badge, index) => (
              <Badge key={index} variant="secondary" className="animate-fade-in hover-scale cursor-default"
                     style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
                {badge}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Origin story */}
      <section aria-labelledby="why-the-name" className="border-y border-border/70 bg-card/65 px-4 py-14">
        <div className="container mx-auto grid max-w-4xl gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10">
          <div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Feather className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Why the name?</p>
          </div>
          <div>
            <h2 id="why-the-name" className="text-3xl font-semibold text-foreground md:text-4xl">
              Named for a teacher who made the work matter.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Mr Selby is named in gratitude for a favorite teacher whose care in teaching,
              designing assignments, and grading them set the standard behind this product.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The name is a personal tribute, not a claim of affiliation or endorsement.
            </p>
          </div>
        </div>
      </section>

      {/* Scroll Story */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 animate-fade-in">
            The real problem isn't you. It's the workload.
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-in">
            You write the lessons. You hold the room together. And then the pile of essays whispers, "You're behind." 
            You're not behind. You're carrying too much.
          </p>
          
          <p className="text-2xl font-semibold text-primary mb-12 animate-fade-in animate-pulse">
            Mr Selby shoulders the repetitive work so you can show up where you matter most.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            {[
              "Less mechanical marking",
              "More real conversations",
              "More sleep"
            ].map((badge, index) => (
              <Badge key={index} variant="outline" className="px-4 py-2 text-base hover-scale animate-fade-in"
                     style={{ animationDelay: `${index * 0.2}s` }}>
                {badge}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After comparison */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            The Day Feels Different
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 text-center">Before Mr Selby</h3>
              {[
                { icon: Clock, text: "10:14 PM: still grading" },
                { icon: MessageSquare, text: "Same comment, different student" },
                { icon: FileText, text: "Rubric check, copy‑paste, repeat" },
                { icon: Clock, text: "\"One more stack\" steals your weekend" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3 text-muted-foreground animate-fade-in hover-scale transition-all duration-300"
                     style={{ animationDelay: `${index * 0.1}s` }}>
                  <item.icon className="w-5 h-5 animate-pulse" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 text-center">With Mr Selby</h3>
              {[
                { icon: CheckCircle2, text: "A review queue instead of a blank page" },
                { icon: MessageSquare, text: "Comments drafted in your voice" },
                { icon: Star, text: "Rubric‑aligned score proposals ready" },
                { icon: Download, text: "Downloadable, annotated essays + summary" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3 text-primary animate-fade-in hover-scale transition-all duration-300 group"
                     style={{ animationDelay: `${index * 0.1}s` }}>
                  <item.icon className="w-5 h-5 group-hover:animate-pulse" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
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
            How it works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8 mt-16">
            {[
              {
                step: "1",
                title: "Upload",
                description: "Add the student files; Mr Selby extracts the text—no retyping, no extra tabs."
              },
              {
                step: "2", 
                title: "Align",
                description: "Mr Selby finds your instructions and rubric, then drafts inline comments and proposes rubric-aligned scores."
              },
              {
                step: "3",
                title: "Review", 
                description: "Approve, tweak, or dismiss. Mr Selby learns your tone and tightens its drafts every time."
              },
              {
                step: "4",
                title: "Deliver",
                description: "Export a downloadable, annotated essay plus a clean feedback summary for students and guardians."
              }
            ].map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg hover-scale transition-all duration-300 animate-fade-in group"
                   style={{ animationDelay: `${index * 0.2}s` }}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:animate-pulse transition-all duration-300 hover:scale-110">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-lg text-muted-foreground mt-12">
            You stay the teacher. Mr Selby does the heavy lifting.
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            Built for the way teachers work
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
                title: "Rubric‑aligned scoring.",
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
                description: "No juggling tabs or tools. Mr Selby lives inside your app."
              },
              {
                icon: ArrowRight,
                title: "Learns from you.",
                description: "Every tweak teaches Mr Selby your style and standards."
              },
              {
                icon: Download,
                title: "Ready to share.",
                description: "Download annotated PDFs for LMS, conferences, or portfolios."
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg hover-scale transition-all duration-300 animate-fade-in group relative overflow-hidden"
                   style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-6 relative z-10">
                  <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:animate-pulse transition-all duration-300" />
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section — intentionally non-interactive until a real release recording exists. */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-xl font-semibold text-foreground mb-8 animate-fade-in">Product walkthrough</h2>
          
          <p className="text-xl text-muted-foreground mb-8 animate-fade-in">
            "Remember when teaching felt like teaching—not triage at midnight?"
          </p>
          
          <div className="bg-card rounded-lg p-8 shadow-lg hover-scale transition-all duration-300 animate-fade-in group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-6 relative">
              <div className="text-center">
                <Play className="w-16 h-16 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Live-release recording pending</p>
                <p className="text-sm text-muted-foreground">The demo will show Upload → Align → Review → Deliver.</p>
              </div>
            </div>
            <p className="text-muted-foreground relative z-10">Your voice. Your standards. Your evening back.</p>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section id="results" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            Results
          </h2>
          
          <h3 className="text-xl font-semibold text-center text-muted-foreground mb-12">
            What the workflow is designed to improve
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              "Time back for planning, feedback conferences, and life outside school",
              "Feedback organized for quicker student review",
              "Less decision fatigue with strong drafts and aligned score proposals",
              "A consistent place to inspect alignment and the supporting evidence"
            ].map((outcome, index) => (
              <div key={index} className="flex items-start space-x-3 animate-fade-in hover-scale transition-all duration-300"
                   style={{ animationDelay: `${index * 0.15}s` }}>
                <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0 animate-pulse" />
                <span className="text-lg text-muted-foreground">{outcome}</span>
              </div>
            ))}
          </div>
          
          <p className="text-center text-xl text-foreground mt-12">
            Measure these outcomes against your own baseline; Mr Selby keeps the underlying activity auditable.
          </p>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            Security & control
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: "By default, you approve every comment and score.",
                description: "Unattended publishing remains off unless you explicitly opt in."
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
              <div key={index} className="flex items-start space-x-4 animate-fade-in hover-scale transition-all duration-300 group"
                   style={{ animationDelay: `${index * 0.1}s` }}>
                <item.icon className="w-8 h-8 text-primary mt-1 flex-shrink-0 group-hover:animate-pulse" />
                <div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-center text-lg text-muted-foreground mt-12">
            Before a school rollout, validate the deployed configuration against your district's requirements.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            Start free. Upgrade when you're ready.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 justify-center">
            <Card className="hover:shadow-lg hover-scale transition-all duration-300 animate-fade-in group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-6 text-center relative z-10">
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">Free</h3>
                <p className="text-muted-foreground mb-6">
                  Start with synthetic or de-identified assignments. No credit card.
                </p>
                <Button onClick={handleStartFree} className="w-full hover-scale relative overflow-hidden group/button">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">Start free</span>
                </Button>
                <p className="text-sm text-muted-foreground mt-4">Upgrade only when you're ready</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg hover-scale transition-all duration-300 animate-fade-in group relative overflow-hidden"
                  style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-6 text-center relative z-10">
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">School/District</h3>
                <p className="text-muted-foreground mb-6">
                  Volume pricing + onboarding support.
                </p>
                {salesContactHref ? (
                  <Button asChild variant="outline" className="w-full hover-scale relative overflow-hidden group/button">
                    <a href={salesContactHref}>
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                      <span className="relative z-10">Contact sales</span>
                    </a>
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="w-full">
                    School inquiries opening soon
                  </Button>
                )}
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
                question: "Does Mr Selby replace the teacher?",
                answer: "No. Mr Selby drafts; you decide. It supports your workflow rather than substituting for your judgment."
              },
              {
                question: "Will comments sound generic?",
                answer: "Mr Selby learns from your edits, so feedback keeps sounding like you and gets closer to your voice over time."
              },
              {
                question: "Can I use my own rubrics?",
                answer: "Yes. Mr Selby finds your rubric and proposes rubric‑aligned scores that you can accept or adjust."
              },
              {
                question: "Does it work for ELA and History?",
                answer: "Yes—Mr Selby is built for essay‑driven courses first, with broader subject support planned."
              },
              {
                question: "What about privacy?",
                answer: "We support district privacy practices. You control retention and exports, and you can delete your data."
              },
              {
                question: "How hard is it to start?",
                answer: "The core workflow is three steps: upload, review, and export."
              }
            ].map((faq, index) => (
              <Card key={index} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-6">
                  <button
                    id={`faq-trigger-${index}`}
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={expandedFaq === index}
                    aria-controls={`faq-panel-${index}`}
                    className="flex min-h-11 w-full items-center justify-between gap-4 rounded-sm text-left"
                  >
                    <h3 className="text-lg font-semibold">{faq.question}</h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-5 h-5 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                  <p
                    id={`faq-panel-${index}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${index}`}
                    hidden={expandedFaq !== index}
                    className="text-muted-foreground mt-4"
                  >
                    {faq.answer}
                  </p>
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
            Give thoughtful feedback without giving up every evening.
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12">
            You stay the teacher. Mr Selby helps carry the stack.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button onClick={handleStartFree} size="lg" className="text-lg px-8">
              Create your teacher workspace
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            {salesContactHref ? (
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <a href={salesContactHref}>Book a 10‑minute walkthrough</a>
              </Button>
            ) : (
              <Button disabled variant="outline" size="lg" className="text-lg px-8">
                Walkthroughs opening soon
              </Button>
            )}
          </div>
          
          <p className="text-muted-foreground">
            No credit card. You keep control.
          </p>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-8">
            <a href="#product" className="hover:text-foreground transition-colors">Product</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <Link to="/privacy" className="underline-offset-4 hover:text-foreground hover:underline transition-colors">Privacy</Link>
            <Link to="/terms" className="underline-offset-4 hover:text-foreground hover:underline transition-colors">Terms</Link>
            {salesContactHref && (
              <a href={salesContactHref} className="hover:text-foreground transition-colors">Contact</a>
            )}
          </nav>
          
          <div className="text-center text-sm text-muted-foreground">
            Mr Selby · Teacher-controlled grading support · Launch preview
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pitch;
