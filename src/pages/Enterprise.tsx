
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Enterprise = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    message: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission to Supabase
    toast({
      title: "Inquiry Submitted",
      description: "We'll reach out to you within 24 hours to discuss your school's needs.",
    });
    setFormData({ name: '', email: '', school: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-green-700 mb-6">
            Want GradeLift at Your School?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We offer site-wide access, LMS integration, admin dashboards, and support for 
            entire teaching teams. Submit your info below and we'll reach out.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 px-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Enterprise Inquiry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="school">School or District *</Label>
                <Input
                  id="school"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">Message / Use Case</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your school's needs, number of teachers, current LMS, etc."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-700 hover:bg-green-800 text-white py-3"
              >
                Submit Inquiry
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">
            Enterprise Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>LMS Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Seamlessly connect with Google Classroom, Canvas, Schoology, and more. 
                Grades sync automatically.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Dashboards</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Track usage, outcomes, and teacher satisfaction across your entire district 
                with comprehensive analytics.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dedicated Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Priority onboarding, training sessions, and ongoing support for administrators 
                and teaching staff.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Training</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Professional development workshops to help your team maximize the benefits 
                of AI-assisted grading.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Enterprise;
