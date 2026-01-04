import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export function PricingPage() {
  return (
    <div className="container max-w-6xl py-16 px-4">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that fits your trust. All plans include our core features, 
            unlimited assessments, and dedicated support.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription>Perfect for small trusts</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">£299</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 5 schools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Core analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 20 users</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Email support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Standard security features</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link to="/auth/login">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Professional Plan */}
          <Card className="border-2 border-teal-600 relative">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Professional</CardTitle>
              <CardDescription>For growing trusts</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">£599</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 15 schools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Advanced analytics & reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 50 users</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Priority email & phone support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Enhanced security & SSO</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Custom assessment templates</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/auth/login">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <CardDescription>For large trusts</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">Custom</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited schools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Custom analytics & dashboards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited users</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">24/7 priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">API access & integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Custom training & onboarding</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link to="/auth/login">Contact Sales</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <section className="space-y-8 pt-8">
          <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect 
                at the start of your next billing cycle.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                Yes, we offer a 30-day free trial for all plans. No credit card required to 
                start your trial.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, debit cards, and can arrange direct bank 
                transfers for annual subscriptions.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Are there any setup fees?</h3>
              <p className="text-muted-foreground">
                No setup fees for Starter and Professional plans. Enterprise plans may include 
                a one-time onboarding fee depending on customization needs.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">What happens to my data if I cancel?</h3>
              <p className="text-muted-foreground">
                You can export all your data at any time. After cancellation, we retain your 
                data for 90 days in case you want to reactivate your account.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Do you offer annual billing?</h3>
              <p className="text-muted-foreground">
                Yes, annual billing is available with a 15% discount. Contact our sales team 
                for details.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-teal-50 to-amber-50 rounded-xl p-8 md:p-12 text-center border border-teal-100">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our team is here to help you find the right plan for your trust.
          </p>
          <Button asChild size="lg">
            <Link to="/auth/login">Contact Our Team</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}

