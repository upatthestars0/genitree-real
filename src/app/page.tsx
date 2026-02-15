import Link from "next/link";
import {
  Shield,
  Lock,
  TreePine,
  Heart,
  Brain,
  ArrowRight,
  Dna,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <TreePine className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold tracking-tight">
              GeniTree
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            <Dna className="h-4 w-4 text-primary" />
            Understand your genetic health story
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Your Health Tree.
            <br />
            <span className="text-primary">Rooted in Genetics.</span>
            <br />
            Guided by Intelligence.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Track your family medical history, understand hereditary health
            risks, and get personalized test recommendations -- all in one
            private, intelligent platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="gap-2 text-base">
                Build My Health Tree
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-t bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight">
              How it Works
            </h2>
            <p className="text-muted-foreground">
              Three simple steps to understand your health legacy
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Heart,
                title: "Share Your Story",
                description:
                  "Tell us about yourself, your family, and your health history through our guided onboarding.",
              },
              {
                step: "02",
                icon: TreePine,
                title: "Build Your Tree",
                description:
                  "We map your family medical history into a visual health tree that highlights hereditary patterns.",
              },
              {
                step: "03",
                icon: Brain,
                title: "Get Insights",
                description:
                  "Receive personalized health insights, test recommendations, and medication awareness tips.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border bg-card p-8 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 text-xs font-semibold tracking-widest text-primary">
                  STEP {item.step}
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-t py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight">
              Your Privacy, Our Priority
            </h2>
            <p className="text-muted-foreground">
              Your health data is sensitive. We treat it that way.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Lock,
                title: "End-to-End Encrypted",
                description:
                  "All your health data is encrypted at rest and in transit using industry-standard protocols.",
              },
              {
                icon: Shield,
                title: "GDPR Ready",
                description:
                  "Full data portability and the right to be forgotten. Your data, your control.",
              },
              {
                icon: Activity,
                title: "Private by Design",
                description:
                  "We never sell or share your data. No ads, no third-party trackers, ever.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl border bg-card p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary/5 py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Start Building Your Health Tree
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join thousands who are taking control of their genetic health story.
            Free to get started.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="gap-2 text-base">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <TreePine className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">GeniTree</span>
          </div>
          <p>&copy; {new Date().getFullYear()} GeniTree. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
