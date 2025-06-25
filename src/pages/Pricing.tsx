
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const features = [
    {
      name: "Custom AI trained on your essays",
      free: true,
      enterprise: true
    },
    {
      name: "Essay grading limit",
      free: "100 essays/month",
      enterprise: "Unlimited"
    },
    {
      name: "LMS integrations (Google Classroom, Canvas)",
      free: false,
      enterprise: true
    },
    {
      name: "Team dashboards & oversight",
      free: false,
      enterprise: true
    },
    {
      name: "Priority onboarding & support",
      free: "Community only",
      enterprise: "Dedicated onboarding & admin training"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-green-700 mb-6">
            Plans That Grow With You
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whether you're a single teacher or an admin supporting 100+ educators, 
            we've got a plan to support your goals.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">Free Teacher</CardTitle>
              <div className="text-4xl font-bold text-green-700 mt-4">$0</div>
              <p className="text-gray-600 mt-2">Perfect for individual teachers</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  Custom AI trained on your essays
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  100 essays/month limit
                </li>
                <li className="flex items-center">
                  <X className="w-5 h-5 text-red-500 mr-3" />
                  LMS integrations
                </li>
                <li className="flex items-center">
                  <X className="w-5 h-5 text-red-500 mr-3" />
                  Team dashboards
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  Community support
                </li>
              </ul>
              <Link to="/auth" className="block mt-8">
                <Button className="w-full bg-green-700 hover:bg-green-800 text-white">
                  Start Free
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative border-green-500 border-2">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">Enterprise Plan</CardTitle>
              <div className="text-4xl font-bold text-green-700 mt-4">Custom</div>
              <p className="text-gray-600 mt-2">For schools and districts</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  Custom AI trained on your essays
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  Unlimited essays
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  Full LMS integrations
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  Team dashboards & analytics
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  Dedicated support & training
                </li>
              </ul>
              <Link to="/enterprise" className="block mt-8">
                <Button className="w-full bg-green-700 hover:bg-green-800 text-white">
                  Contact Sales
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">
            Detailed Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 bg-white rounded-lg">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-4 text-left font-semibold">Feature</th>
                  <th className="p-4 text-left font-semibold">Free Teacher</th>
                  <th className="p-4 text-left font-semibold">Enterprise Plan</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="p-4 font-medium">{feature.name}</td>
                    <td className="p-4">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )
                      ) : (
                        feature.free
                      )}
                    </td>
                    <td className="p-4">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )
                      ) : (
                        feature.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-700 py-16 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-green-100 mb-8 text-lg">
            Join thousands of teachers who are already grading smarter with GradeLift.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="outline" className="bg-white text-green-700 hover:bg-gray-100">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/enterprise">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-green-600">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
