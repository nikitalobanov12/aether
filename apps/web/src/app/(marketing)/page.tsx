"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import Link from "next/link";
import {
  Target,
  FolderOpen,
  ListTodo,
  Calendar,
  CheckCircle2,
  Check,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  Clock,
  Brain,
  RefreshCw,
  Eye,
  Layers,
} from "lucide-react";
import { motion, type Variants } from "motion/react";

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  },
};

const howItWorksSteps = [
  { icon: Target, label: "Set your goals", description: "What do you want to achieve?" },
  { icon: FolderOpen, label: "Break them into projects", description: "Split big goals into smaller pieces" },
  { icon: ListTodo, label: "Add daily tasks", description: "Focus on what to do next" },
  { icon: Calendar, label: "See it all together", description: "Tasks and events in one view" },
  { icon: CheckCircle2, label: "Review your week", description: "See what you got done" },
];

const pricingPlans = [
  {
    name: "Free",
    cost: "$0",
    period: "/mo",
    features: ["50 Tasks", "2 Goals", "Basic sync", "7-day history"],
    highlighted: false,
  },
  {
    name: "Pro",
    cost: "$8",
    period: "/mo",
    features: [
      "Unlimited tasks & goals",
      "Real-time bi-directional sync",
      "Weekly reviews & full history",
      "AI-powered suggestions",
      "Priority support",
    ],
    highlighted: true,
    comparisonTag: "Less than half the cost of competitors",
  },
];

const features = [
  {
    icon: Zap,
    title: "Two-Way Sync",
    description: "Add something in Aether and it shows up in Google Calendar. Change it in your calendar and Aether updates too. No copying. No duplicates.",
  },
  {
    icon: Target,
    title: "Goals to Tasks",
    description: "See how your daily tasks connect to your bigger goals. Every task you check off moves you forward on something that matters.",
  },
  {
    icon: Eye,
    title: "See Your Progress",
    description: "Finished tasks don't just disappear. Weekly reviews show you what you actually got done. Watch your goals move forward over time.",
  },
  {
    icon: Shield,
    title: "You Stay in Control",
    description: "AI gives suggestions when you ask for them. It never takes over. No auto-scheduling. No surprises. Your calendar, your rules.",
  },
];

// Pain points - the reality of fragmented productivity
const painPoints = [
  {
    icon: RefreshCw,
    title: "The Copy-Paste Problem",
    description: "Every time you copy a meeting to your task list, or update a project in three different apps, you lose time and energy. You end up spending more time managing your tools than doing actual work.",
  },
  {
    icon: Brain,
    title: "Everything is Scattered",
    description: "Your goals are in Notion. Your tasks are in Todoist. Your time is in Google Calendar. Nothing connects. You get things done, but you lose track of why they matter.",
  },
  {
    icon: Clock,
    title: "Busy But Not Moving Forward",
    description: "You check off tasks all day. You feel busy. But at the end of the week, you can not point to what actually got better. The work just disappears into a completed list.",
  },
  {
    icon: Layers,
    title: "Too Many Apps",
    description: "Notion for docs. Todoist for tasks. Google Calendar for time. Maybe more. Each app does one thing well. But none of them talk to each other. And you are the one connecting them all.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle grid pattern background */}
      <div className="fixed inset-0 pointer-events-none grid-pattern opacity-50" />

      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <img src="/favicon.svg" alt="Aether" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-xl tracking-tight">Aether</span>
          </motion.div>

          <motion.nav
            className="hidden md:flex items-center gap-1"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {["The Problem", "Features", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                {item}
              </a>
            ))}
            <a
              href="https://github.com/nikitalobanov/aether"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
            >
              GitHub
            </a>
          </motion.nav>

          <motion.div
            className="flex items-center gap-3"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <ThemeToggle />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Start Free</Link>
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-28">
          <div className="container mx-auto px-4">
            {/* Hero Copy */}
            <motion.div
              className="text-center max-w-4xl mx-auto mb-16 lg:mb-20"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Now in public beta
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.08] tracking-tight"
              >
                Your productivity stack
                <br />
                <span className="text-primary">finally speaks the same language.</span>
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
              >
                Calendar, tasks, and goals in one workspace. Real bi-directional sync. 
                No more app-hopping. No more manual updates. No AI taking over your schedule.
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button asChild size="lg" className="px-8 py-6 text-base font-medium">
                  <Link href="/login">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  No credit card required
                </p>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              className="relative max-w-5xl mx-auto"
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              {/* Image frame */}
              <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl shadow-black/10 dark:shadow-black/30">
                <img
                  src="/screenshots/hero-app.webp"
                  alt="Aether app showing unified calendar, tasks, and goals"
                  className="w-full h-auto block"
                  loading="eager"
                />
              </div>

              {/* Caption */}
              <motion.p
                className="text-center text-sm text-muted-foreground mt-6"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.8 }}
              >
                Real bi-directional sync with Google Calendar. Changes flow both ways, instantly.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* The Fragmentation Problem - Expanded Copy Section */}
        <section id="the-problem" className="py-24 lg:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <motion.div
                className="mb-16"
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                <Badge variant="outline" className="mb-4">
                  The Problem
                </Badge>
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-8 leading-tight">
                  The modern productivity stack
                  <br />
                  <span className="text-muted-foreground">is a house of cards.</span>
                </h2>
                
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    You did not plan to become the person who moves data between apps. It just happened. 
                    First you needed a calendar. Then a better task manager. Then something for goals. 
                    Then project tracking. Each tool solved one problem and created another: 
                    <strong className="text-foreground"> keeping them all in sync.</strong>
                  </p>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Now you are the connection between all your tools. You copy meeting notes into tasks. 
                    You update project status in three places. You open four apps just to plan your day. 
                    You spend more time managing the system than doing the work.
                  </p>
                </div>
              </motion.div>

              {/* Tool Chain Visual with Real Logos */}
              <motion.div
                className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-16 p-8 rounded-2xl bg-background border border-border"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {/* Notion */}
                <motion.div 
                  variants={scaleIn}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white dark:bg-zinc-800 border border-border flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                    <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#fff"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.917 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000"/>
                    </svg>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Notion</span>
                </motion.div>

                {/* Broken link */}
                <motion.div variants={fadeIn} className="text-muted-foreground/40">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 17H7A5 5 0 0 1 7 7" strokeLinecap="round"/>
                    <path d="M15 7h2a5 5 0 0 1 4 8" strokeLinecap="round"/>
                    <line x1="8" y1="12" x2="11" y2="12" strokeLinecap="round"/>
                  </svg>
                </motion.div>

                {/* Todoist */}
                <motion.div 
                  variants={scaleIn}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white dark:bg-zinc-800 border border-border flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#E44332">
                      <path d="M21 0H3a3 3 0 0 0-3 3v18a3 3 0 0 0 3 3h18a3 3 0 0 0 3-3V3a3 3 0 0 0-3-3zm-1.5 14.32a.488.488 0 0 1-.25.42l-6.46 3.88a1.5 1.5 0 0 1-1.58 0l-6.46-3.88a.488.488 0 0 1-.25-.42.5.5 0 0 1 .75-.43l6.5 3.9a.5.5 0 0 0 .5 0l6.5-3.9a.5.5 0 0 1 .75.43zm0-4.16a.488.488 0 0 1-.25.42l-6.46 3.88a1.5 1.5 0 0 1-1.58 0l-6.46-3.88a.488.488 0 0 1-.25-.42.5.5 0 0 1 .75-.43l6.5 3.9a.5.5 0 0 0 .5 0l6.5-3.9a.5.5 0 0 1 .75.43zm0-4.16a.488.488 0 0 1-.25.42l-6.46 3.88a1.5 1.5 0 0 1-1.58 0L4.75 6.42a.488.488 0 0 1-.25-.42.5.5 0 0 1 .75-.43l6.5 3.9a.5.5 0 0 0 .5 0l6.5-3.9a.5.5 0 0 1 .75.43z"/>
                    </svg>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Todoist</span>
                </motion.div>

                {/* Broken link */}
                <motion.div variants={fadeIn} className="text-muted-foreground/40">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 17H7A5 5 0 0 1 7 7" strokeLinecap="round"/>
                    <path d="M15 7h2a5 5 0 0 1 4 8" strokeLinecap="round"/>
                    <line x1="8" y1="12" x2="11" y2="12" strokeLinecap="round"/>
                  </svg>
                </motion.div>

                {/* Google Calendar */}
                <motion.div 
                  variants={scaleIn}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white dark:bg-zinc-800 border border-border flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z" opacity="0"/>
                      <path fill="#EA4335" d="M12 2C6.48 2 2 6.48 2 12h4c0-3.31 2.69-6 6-6V2z"/>
                      <path fill="#FBBC05" d="M2 12c0 5.52 4.48 10 10 10v-4c-3.31 0-6-2.69-6-6H2z"/>
                      <path fill="#34A853" d="M12 22c5.52 0 10-4.48 10-10h-4c0 3.31-2.69 6-6 6v4z"/>
                      <path fill="#4285F4" d="M22 12c0-5.52-4.48-10-10-10v4c3.31 0 6 2.69 6 6h4z"/>
                      <path fill="#1A73E8" d="M12 8v4l3 2"/>
                      <circle fill="#1A73E8" cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Calendar</span>
                </motion.div>

                {/* Arrow to Aether */}
                <motion.div 
                  variants={fadeIn}
                  className="text-primary mx-3"
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>

                {/* Aether */}
                <motion.div 
                  variants={scaleIn}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <img src="/favicon.svg" alt="Aether" className="w-8 h-8" />
                  </div>
                  <span className="text-xs text-primary font-semibold">Aether</span>
                </motion.div>
              </motion.div>
            </div>

            {/* Pain Points Grid */}
            <motion.div
              className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {painPoints.map((point, index) => (
                <motion.div
                  key={point.title}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-background border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                        <point.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-display text-lg mb-2">{point.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {point.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* The Shift - Transition Section */}
        <section className="py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-8 leading-tight">
                There is a better way.
              </h2>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                What if your tools actually worked together instead of just sitting next to each other?
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                When you add a task in Aether, it shows up in your calendar. When you move a meeting, 
                your task list updates. When you finish work, you can see it move your goals forward. 
                Not through some AI that thinks it knows better than you. Through 
                <strong className="text-foreground"> real sync that keeps you in control.</strong>
              </p>

              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Real-time sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>No duplicates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>You are in charge</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="py-24 lg:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center max-w-3xl mx-auto mb-16"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <Badge variant="outline" className="mb-4">
                Features
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4">
                Built for people who actually use their tools.
              </h2>
              <p className="text-lg text-muted-foreground">
                Not for demo day. Not for investors. For the daily grind of getting things done.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-background border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-8">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-display text-xl mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The Anti-Motion Statement */}
        <section className="py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                className="text-center mb-16"
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6">
                  We are not trying to run your life.
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Some tools promise to schedule your day using AI. They look at your habits, 
                  move your tasks around, and tell you when to work on what. Sounds great. 
                  But in practice, it feels like losing control of your own calendar.
                </p>
              </motion.div>

              <motion.div
                className="grid md:grid-cols-2 gap-6 mb-12"
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {/* Them */}
                <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
                  <CardContent className="p-8">
                    <Badge variant="secondary" className="mb-4">Their approach</Badge>
                    <h3 className="font-display text-xl mb-3">Auto-schedule everything</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      &quot;Let AI decide when you work on what. Trust the algorithm. We know your 
                      optimal focus time better than you do.&quot;
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-4 italic">
                      ...until it schedules deep work during your lunch break.
                    </p>
                  </CardContent>
                </Card>

                {/* Us */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-8">
                    <Badge className="mb-4 bg-primary text-primary-foreground">Our approach</Badge>
                    <h3 className="font-display text-xl mb-3">Show, do not decide</h3>
                    <p className="text-foreground leading-relaxed">
                      &quot;Here is your schedule. Here is what you said you would do. Here is how it 
                      connects to your goals. You decide what happens next.&quot;
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                      AI helps when you ask. Otherwise, it stays out of the way.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.p
                className="text-center text-lg text-muted-foreground max-w-2xl mx-auto"
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                The best productivity tool gives you clarity, not control. 
                You know your priorities. We just make them easier to see.
              </motion.p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 lg:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center max-w-3xl mx-auto mb-16"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <Badge variant="outline" className="mb-4">
                How it works
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4">
                From ambition to action.
              </h2>
              <p className="text-lg text-muted-foreground">
                Five steps. One connected system. Zero context-switching tax.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={step.label}
                  className="relative"
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Connector line */}
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-[2px] bg-gradient-to-r from-border to-transparent" />
                  )}
                  
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background border border-border text-foreground mb-4 relative">
                      <step.icon className="h-7 w-7" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="font-display text-lg mb-1">{step.label}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The Weekly Review Pitch */}
        <section className="py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                className="grid md:grid-cols-2 gap-12 items-center"
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                <div>
                  <h2 className="font-display text-3xl md:text-4xl mb-6">
                    What happened this week?
                  </h2>
                  <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                    Most task apps work one way. You add tasks, check them off, and they 
                    disappear. A week later, you can not remember what you finished. You just 
                    remember being busy.
                  </p>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    Aether shows you what happened. Which goals moved forward. Which projects 
                    got attention. Which tasks you finished and which ones kept getting pushed back.
                  </p>
                  <p className="text-lg text-foreground font-medium">
                    Productivity is not just about doing more. It is about knowing that what 
                    you did actually mattered.
                  </p>
                </div>
                
                <div className="relative">
                  <div className="rounded-xl border border-border bg-background p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-display text-lg">This Week</h4>
                      <span className="text-sm text-muted-foreground">Jan 6 – 12</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Launch website redesign</span>
                          <span className="text-primary font-medium">+23%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-[67%] bg-primary rounded-full" />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Q1 Planning</span>
                          <span className="text-primary font-medium">+15%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-[45%] bg-primary rounded-full" />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Learn TypeScript</span>
                          <span className="text-primary font-medium">+8%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-[28%] bg-primary rounded-full" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tasks completed</span>
                        <span className="font-mono font-medium">23</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 lg:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center max-w-3xl mx-auto mb-16"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <Badge variant="outline" className="mb-4">
                Pricing
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4">
                Premium features.
                <br />
                <span className="text-muted-foreground">Fair pricing.</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Sunsama charges $18/mo. Morgen charges $14/mo. Motion charges $19/mo.
                <br />
                We think that is too much for a productivity tool.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card className={`h-full relative ${plan.highlighted ? "border-primary shadow-lg" : ""}`}>
                    {plan.comparisonTag && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground whitespace-nowrap">
                          {plan.comparisonTag}
                        </Badge>
                      </div>
                    )}
                    
                    {plan.highlighted && (
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-xl pointer-events-none" />
                    )}
                    
                    <CardContent className="p-8 relative">
                      <div className="text-center mb-8">
                        <h3 className="font-display text-2xl mb-2">{plan.name}</h3>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="font-display text-5xl font-semibold">{plan.cost}</span>
                          <span className="text-muted-foreground">{plan.period}</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        asChild
                        className="w-full"
                        variant={plan.highlighted ? "default" : "outline"}
                        size="lg"
                      >
                        <Link href="/login">
                          {plan.highlighted ? "Start Free Trial" : "Get Started"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="text-center text-sm text-muted-foreground mt-8"
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              No credit card required. 14-day free trial on Pro. Cancel anytime.
            </motion.p>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 
                variants={fadeInUp}
                className="font-display text-3xl md:text-4xl lg:text-5xl mb-6"
              >
                Stop being the glue between your apps.
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              >
                Your productivity tools should work together. Not against each other. 
                Join 500+ people who stopped jumping between apps.
              </motion.p>
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button asChild size="lg" className="px-10 py-6 text-lg">
                  <Link href="/login">
                    Try Aether Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.p 
                variants={fadeIn}
                className="text-sm text-muted-foreground mt-6"
              >
                Free forever tier available. Pro is $8/mo.
              </motion.p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="Aether" className="h-7 w-7 rounded-md" />
              <span className="font-display font-semibold">Aether</span>
            </div>

            <nav aria-label="Footer" className="flex items-center gap-8 text-sm">
              <Link
                href="/privacy-policy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms-of-service"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <a
                href="https://github.com/nikitalobanov/aether"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </nav>

            <p className="text-sm text-muted-foreground">
              © 2026 Aether. Built with focus.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
