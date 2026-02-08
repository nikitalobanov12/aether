import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
	Target,
	FolderOpen,
	ListTodo,
	Calendar,
	CheckCircle2,
	Check,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { useState, useEffect, useSyncExternalStore } from 'react';

// Animation variants for reduced duplication
const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: { opacity: 1, y: 0 },
};

const fadeIn: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
};

const headerCtaVariants: Variants = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.8 },
};

// Default transition for consistency
const defaultTransition = { duration: 0.6, ease: 'easeOut' as const };
const fastTransition = { duration: 0.2 };

// Media query hook using matchMedia (SSR-safe, no resize listener)
function subscribeToMediaQuery(callback: () => void) {
	const mql = window.matchMedia('(max-width: 767px)');
	mql.addEventListener('change', callback);
	return () => mql.removeEventListener('change', callback);
}

function getMediaQuerySnapshot() {
	return window.matchMedia('(max-width: 767px)').matches;
}

function getServerSnapshot() {
	return false; // Default to desktop on SSR to avoid hydration mismatch
}

function useIsMobile() {
	return useSyncExternalStore(
		subscribeToMediaQuery,
		getMediaQuerySnapshot,
		getServerSnapshot
	);
}

// Hook to track if component is mounted (for hydration-safe animations)
function useHasMounted() {
	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => {
		setHasMounted(true);
	}, []);
	return hasMounted;
}

const howItWorksSteps = [
	{ icon: Target, label: 'Define your goals' },
	{ icon: FolderOpen, label: 'Break into projects' },
	{ icon: ListTodo, label: 'Sequence daily tasks' },
	{ icon: Calendar, label: 'See tasks + calendar unified' },
	{ icon: CheckCircle2, label: 'Review progress weekly' },
];



const pricingPlans = [
	{
		name: 'Free',
		cost: '$0',
		period: '/forever',
		features: ['50 tasks', '2 goals', 'Calendar sync', 'Weekly review'],
		highlighted: false,
	},
	{
		name: 'Pro',
		cost: '$8',
		period: '/mo',
		yearlyNote: '($80/yr)',
		features: [
			'Unlimited tasks',
			'Unlimited goals',
			'Priority support',
			'Advanced AI features',
			'Early access to new features',
		],
		highlighted: true,
		badge: 'Best Value',
	},
];

export function Home() {
	const isMobile = useIsMobile();
	const hasMounted = useHasMounted();
	const [showHeaderCTA, setShowHeaderCTA] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setShowHeaderCTA(window.scrollY > 500);
		};
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Use mounted state and isMobile for hydration-safe responsive animations
	// On server/initial render, default to desktop behavior (no x offset)
	const responsiveXOffset = hasMounted && isMobile ? 0 : 20;

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<motion.header
				className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
				initial={{ y: -100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={defaultTransition}
			>
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<motion.div
						className="flex items-center gap-3"
						initial={{ x: -responsiveXOffset, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ ...defaultTransition, delay: 0.2 }}
					>
						<img src="/favicon.svg" alt="Aether" className="h-9 w-9 rounded-lg" />
						<span className="text-xl font-bold tracking-tight">Aether</span>
					</motion.div>

					<motion.nav
						className="hidden md:flex items-center gap-8"
						initial={{ y: -20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ ...defaultTransition, delay: 0.3 }}
					>
						<a
							href="#problems"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							Why Aether
						</a>
						<a
							href="#features"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							Features
						</a>
						<a
							href="#pricing"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							Pricing
						</a>
						<a
							href="https://github.com/nikitalobanov/aether-landing-page"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							Changelog
						</a>
					</motion.nav>

					<motion.div
						className="flex items-center gap-3"
						initial={{ x: responsiveXOffset, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ ...defaultTransition, delay: 0.4 }}
					>
						<ThemeToggle />
						<AnimatePresence>
							{showHeaderCTA && (
								<motion.div
									variants={headerCtaVariants}
									initial="hidden"
									animate="visible"
									exit="exit"
									transition={fastTransition}
								>
									<Button asChild size="sm" className="hidden sm:inline-flex">
										<a
											href="https://app.aethertask.com"
											target="_blank"
											rel="noopener noreferrer"
										>
											Start for Free
										</a>
									</Button>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</div>
			</motion.header>

			{/* Main Content */}
			<main>
				{/* Hero Section */}
				<section className="relative py-20 lg:py-28 overflow-hidden">
					<div className="container mx-auto px-4">
						{/* Hero Copy */}
						<motion.div
							className="text-center max-w-4xl mx-auto mb-16 lg:mb-20"
							variants={fadeInUp}
							initial="hidden"
							animate="visible"
							transition={{ duration: 0.8, ease: 'easeOut' }}
						>
							<h1
								className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 leading-[1.05]"
								style={{ letterSpacing: '-0.02em' }}
							>
								Stop switching apps.
								<br />
								<span className="text-primary">Start finishing work.</span>
							</h1>

							<p className="font-text text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
								The first workspace that treats your Calendar, Tasks, and Goals as one single system. No broken syncs. No AI clutter. Just focus.
							</p>

							<motion.div
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="inline-block mb-3"
							>
								<Button asChild size="lg" className="px-10 py-6 text-base font-medium">
									<a
										href="https://app.aethertask.com"
										target="_blank"
										rel="noopener noreferrer"
									>
										Start Building for Free
									</a>
								</Button>
							</motion.div>

							<p className="font-text text-sm text-muted-foreground">
								No credit card required
							</p>
						</motion.div>

					{/* Hero Image with Glow */}
						<motion.div
							className="relative max-w-5xl mx-auto"
							initial={{ opacity: 0, y: 60 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
						>
							{/* Glow orb behind hero image */}
							<div
								className="glow-orb glow-orb--primary glow-orb--lg animate-pulse-glow"
								style={{
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
									width: '70%',
									height: '70%',
									filter: 'blur(100px)',
									opacity: 0.6,
								}}
							/>

							{/* Hero mockup frame */}
							<div className="hero-mockup-frame relative z-content">
								<div className="hero-mockup-inner">
									<img
										src="/screenshots/hero-app.webp"
										alt="Aether app showing unified calendar, tasks, and goals"
										className="w-full h-auto block"
										loading="eager"
									/>
								</div>
							</div>

							{/* Caption under hero image */}
							<motion.p
								className="font-text text-center text-sm text-muted-foreground mt-6"
								variants={fadeIn}
								initial="hidden"
								animate="visible"
								transition={{ ...defaultTransition, delay: 0.8 }}
							>
								Actually syncs with Google Calendar in real-time.
							</motion.p>
						</motion.div>
					</div>
				</section>

				{/* Frankenstein Section */}
				<section id="problems" className="py-24 lg:py-32 bg-muted/30">
					<div className="container mx-auto px-4">
						<div className="max-w-4xl mx-auto text-center">
							{/* Headline */}
							<motion.h2
								className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
								variants={fadeInUp}
								initial="hidden"
								whileInView="visible"
								transition={{ ...defaultTransition, duration: 0.7 }}
								viewport={{ once: true, margin: '-50px' }}
							>
								You are trying to run your life with a Frankenstein stack.
							</motion.h2>

							{/* Subtext */}
							<motion.p
								className="font-text text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
								variants={fadeInUp}
								initial="hidden"
								whileInView="visible"
								transition={{ ...defaultTransition, duration: 0.7, delay: 0.15 }}
								viewport={{ once: true, margin: '-50px' }}
							>
								You have long-term goals in Notion. Daily tasks in Todoist. Meetings in Google Calendar. They don't talk to each other. You spend half your day just moving data around.
							</motion.p>

							{/* Logo Chain Visual */}
							<motion.div
								className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-12"
								variants={fadeIn}
								initial="hidden"
								whileInView="visible"
								transition={{ ...defaultTransition, duration: 0.8, delay: 0.3 }}
								viewport={{ once: true, margin: '-50px' }}
							>
								{/* Notion placeholder */}
								<motion.div
									className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 border-muted-foreground/30 bg-muted/50 grayscale opacity-60"
									initial={{ opacity: 0, scale: 0.8 }}
									whileInView={{ opacity: 0.6, scale: 1 }}
									transition={{ duration: 0.4, delay: 0.4 }}
									viewport={{ once: true }}
								>
									<span className="text-xs md:text-sm font-semibold text-muted-foreground">N</span>
								</motion.div>

								{/* Broken link */}
								<motion.svg
									className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground/50"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									initial={{ opacity: 0 }}
									whileInView={{ opacity: 1 }}
									transition={{ duration: 0.3, delay: 0.5 }}
									viewport={{ once: true }}
								>
									<path d="M9 17H7A5 5 0 0 1 7 7" />
									<path d="M15 7h2a5 5 0 0 1 4 8" />
									<line x1="8" y1="12" x2="12" y2="12" />
								</motion.svg>

								{/* Todoist placeholder */}
								<motion.div
									className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 border-muted-foreground/30 bg-muted/50 grayscale opacity-60"
									initial={{ opacity: 0, scale: 0.8 }}
									whileInView={{ opacity: 0.6, scale: 1 }}
									transition={{ duration: 0.4, delay: 0.55 }}
									viewport={{ once: true }}
								>
									<span className="text-xs md:text-sm font-semibold text-muted-foreground">T</span>
								</motion.div>

								{/* Broken link */}
								<motion.svg
									className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground/50"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									initial={{ opacity: 0 }}
									whileInView={{ opacity: 1 }}
									transition={{ duration: 0.3, delay: 0.65 }}
									viewport={{ once: true }}
								>
									<path d="M9 17H7A5 5 0 0 1 7 7" />
									<path d="M15 7h2a5 5 0 0 1 4 8" />
									<line x1="8" y1="12" x2="12" y2="12" />
								</motion.svg>

								{/* GCal placeholder */}
								<motion.div
									className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 border-muted-foreground/30 bg-muted/50 grayscale opacity-60"
									initial={{ opacity: 0, scale: 0.8 }}
									whileInView={{ opacity: 0.6, scale: 1 }}
									transition={{ duration: 0.4, delay: 0.7 }}
									viewport={{ once: true }}
								>
									<span className="text-xs md:text-sm font-semibold text-muted-foreground">G</span>
								</motion.div>

								{/* Arrow to Aether */}
								<motion.svg
									className="w-8 h-8 md:w-10 md:h-10 text-primary mx-2"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									initial={{ opacity: 0, x: -10 }}
									whileInView={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.85 }}
									viewport={{ once: true }}
								>
									<line x1="5" y1="12" x2="19" y2="12" />
									<polyline points="12 5 19 12 12 19" />
								</motion.svg>

								{/* Aether logo - glowing */}
								<motion.div
									className="relative"
									initial={{ opacity: 0, scale: 0.8 }}
									whileInView={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.5, delay: 0.95 }}
									viewport={{ once: true }}
								>
									<div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg" />
									<div className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 border-primary bg-background shadow-lg shadow-primary/20">
										<img
											src="/favicon.svg"
											alt="Aether"
											className="h-8 w-8 md:h-9 md:w-9"
										/>
									</div>
								</motion.div>
							</motion.div>

							{/* Pivot statement */}
							<motion.p
								className="text-xl md:text-2xl font-semibold text-foreground"
								variants={fadeInUp}
								initial="hidden"
								whileInView="visible"
								transition={{ ...defaultTransition, duration: 0.7, delay: 0.5 }}
								viewport={{ once: true, margin: '-50px' }}
							>
								It's time to stop being a "Project Manager" for your own life.
							</motion.p>
						</div>
					</div>
				</section>

				{/* How It Works Section */}
				<section className="py-24">
					<div className="container mx-auto px-4">
						<motion.div
							className="text-center mb-16"
							variants={fadeInUp}
							initial="hidden"
							whileInView="visible"
							transition={defaultTransition}
							viewport={{ once: true, margin: '-50px' }}
						>
							<h2 className="text-3xl md:text-4xl font-bold mb-4">
								How It Works
							</h2>
						</motion.div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
							{howItWorksSteps.map((step, index) => (
								<motion.div
									key={step.label}
									className="text-center"
									variants={fadeInUp}
									initial="hidden"
									whileInView="visible"
									transition={{
										...defaultTransition,
										duration: 0.5,
										delay: index * 0.1,
									}}
									viewport={{ once: true, margin: '-50px' }}
								>
									<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
										<step.icon className="h-8 w-8" />
									</div>
									<div className="text-sm font-medium text-muted-foreground mb-2">
										Step {index + 1}
									</div>
									<p className="font-medium">{step.label}</p>
								</motion.div>
							))}
						</div>
					</div>
				</section>

				{/* Key Features Section - Bento Grid */}
				<section id="features" className="py-24 bg-muted/30">
					<div className="container mx-auto px-4">
						<motion.div
							className="text-center mb-16"
							variants={fadeInUp}
							initial="hidden"
							whileInView="visible"
							transition={defaultTransition}
							viewport={{ once: true, margin: '-50px' }}
						>
							<h2 className="text-3xl md:text-4xl font-bold mb-4">
								Key Features
							</h2>
						</motion.div>

						{/* Bento Grid Container */}
						<div className="glass-card p-4 md:p-6 max-w-5xl mx-auto">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
								{/* Sync Card - Large, spans 2 columns */}
								<motion.div
									className="md:col-span-2 glass-card p-6 md:p-8 flex flex-col justify-between min-h-[280px]"
									variants={fadeInUp}
									initial="hidden"
									whileInView="visible"
									transition={{ ...defaultTransition, duration: 0.5, delay: 0 }}
									viewport={{ once: true, margin: '-50px' }}
								>
									<div>
										<h3 className="text-2xl md:text-3xl font-bold mb-3">
											Bidirectional Sync. Zero Delays.
										</h3>
										<p className="font-text text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg">
											Create a task in Aether and it appears in Google Calendar instantly. Move a meeting in GCal and your task list updates. No lag, no conflicts, no manual refresh.
										</p>
									</div>
									{/* Micro-UI: Calendar icon with sync arrows and green check */}
									<div className="flex items-center gap-4 mt-6">
										<div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
											<Calendar className="h-5 w-5 text-muted-foreground" />
											<svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<path d="M7 16V4M7 4L3 8M7 4l4 4" />
												<path d="M17 8v12m0 0 4-4m-4 4-4-4" />
											</svg>
											<div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
												<Check className="h-3.5 w-3.5 text-primary" />
											</div>
										</div>
										<span className="text-sm font-medium text-muted-foreground italic">
											It just works.
										</span>
									</div>
								</motion.div>

								{/* Stacked Column - Hierarchy & Motivation */}
								<div className="flex flex-col gap-4 md:gap-6">
									{/* Hierarchy Card */}
									<motion.div
										className="glass-card p-5 md:p-6 flex-1 min-h-[130px] flex flex-col justify-between"
										variants={fadeInUp}
										initial="hidden"
										whileInView="visible"
										transition={{ ...defaultTransition, duration: 0.5, delay: 0.1 }}
										viewport={{ once: true, margin: '-50px' }}
									>
										<div>
											<h3 className="text-lg md:text-xl font-bold mb-2">
												Goals → Projects → Tasks.
											</h3>
											<p className="font-text text-muted-foreground text-sm leading-relaxed">
												Everything connects. See how today's work ladders up to what actually matters.
											</p>
										</div>
										{/* Micro-UI: Goals tree visualization */}
										<div className="flex items-center gap-2 mt-4">
											<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
												<Target className="h-4 w-4 text-primary" />
												<span className="text-foreground font-medium">Goal</span>
												<span className="text-muted-foreground/60">→</span>
												<FolderOpen className="h-3.5 w-3.5" />
												<span className="text-muted-foreground/60">→</span>
												<ListTodo className="h-3.5 w-3.5" />
											</div>
										</div>
									</motion.div>

									{/* Motivation Card */}
									<motion.div
										className="glass-card p-5 md:p-6 flex-1 min-h-[130px] flex flex-col justify-between"
										variants={fadeInUp}
										initial="hidden"
										whileInView="visible"
										transition={{ ...defaultTransition, duration: 0.5, delay: 0.2 }}
										viewport={{ once: true, margin: '-50px' }}
									>
										<div>
											<h3 className="text-lg md:text-xl font-bold mb-2">
												Visual Momentum.
											</h3>
											<p className="font-text text-muted-foreground text-sm leading-relaxed">
												See your completed tasks stack up. Weekly reviews show you how far you've come.
											</p>
										</div>
										{/* Micro-UI: Done history strip */}
										<div className="flex items-center gap-1.5 mt-4">
											{[...Array(7)].map((_, i) => (
												<div
													key={i}
													className={`h-6 w-3 rounded-sm ${
														i < 5
															? 'bg-primary/80'
															: i === 5
																? 'bg-primary/40'
																: 'bg-muted-foreground/20'
													}`}
													title={i < 5 ? 'Completed' : i === 5 ? 'In progress' : 'Upcoming'}
												/>
											))}
											<span className="text-xs text-muted-foreground ml-2">This week</span>
										</div>
									</motion.div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Pricing Section */}
				<section id="pricing" className="py-24">
					<div className="container mx-auto px-4">
						<motion.div
							className="text-center mb-16"
							variants={fadeInUp}
							initial="hidden"
							whileInView="visible"
							transition={defaultTransition}
							viewport={{ once: true, margin: '-50px' }}
						>
							<h2 className="text-3xl md:text-4xl font-bold mb-4">
								Premium Tools Shouldn't Cost a Utility Bill.
							</h2>
							<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
								Sunsama charges $20/mo. Morgen charges $15/mo. We think that's too much for solo users.
							</p>
						</motion.div>

						<div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
							{pricingPlans.map((plan, index) => (
								<motion.div
									key={plan.name}
									variants={fadeInUp}
									initial="hidden"
									whileInView="visible"
									transition={{
										...defaultTransition,
										duration: 0.5,
										delay: index * 0.1,
									}}
									viewport={{ once: true, margin: '-50px' }}
								>
									<Card
										className={`relative h-full ${
											plan.highlighted
												? 'border-2 border-primary shadow-lg shadow-primary/10'
												: ''
										}`}
									>
										{plan.badge && (
											<div className="absolute -top-3 left-1/2 -translate-x-1/2">
												<Badge className="bg-primary text-primary-foreground">
													{plan.badge}
												</Badge>
											</div>
										)}
										<CardContent className="p-8">
											<div className="text-center mb-8">
												<h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
												<div className="flex items-baseline justify-center gap-1 mb-1">
													<span className="text-4xl font-bold">{plan.cost}</span>
													<span className="text-muted-foreground">
														{plan.period}
													</span>
												</div>
												{plan.yearlyNote && (
													<p className="text-sm text-muted-foreground">
														{plan.yearlyNote}
													</p>
												)}
											</div>

											<div className="space-y-3 mb-8">
												{plan.features.map((feature) => (
													<div key={feature} className="flex items-center gap-3">
														<Check className="h-4 w-4 text-primary flex-shrink-0" />
														<span className="text-sm">{feature}</span>
													</div>
												))}
											</div>

											<Button
												asChild
												className="w-full"
												variant={plan.highlighted ? 'default' : 'outline'}
											>
												<a
													href="https://app.aethertask.com"
													target="_blank"
													rel="noopener noreferrer"
												>
													{plan.highlighted ? 'Start Free Trial' : 'Get Started'}
												</a>
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
							transition={{ ...defaultTransition, delay: 0.3 }}
							viewport={{ once: true }}
						>
							No credit card required. Cancel anytime.
						</motion.p>
					</div>
				</section>

				{/* Final CTA */}
				<section className="py-24 bg-muted/30">
					<div className="container mx-auto px-4">
						<motion.div
							className="text-center max-w-3xl mx-auto"
							variants={fadeInUp}
							initial="hidden"
							whileInView="visible"
							transition={defaultTransition}
							viewport={{ once: true, margin: '-50px' }}
						>
							<h2 className="text-3xl md:text-4xl font-bold mb-6">
								Your Goals Deserve a System That Works.
							</h2>
							<p className="text-xl text-muted-foreground mb-8">
								Join 500+ early adopters who stopped juggling disconnected tools and started seeing how daily tasks connect to life goals.
							</p>
							<motion.div
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="inline-block"
							>
								<Button asChild size="lg" className="px-8 py-6 text-lg">
									<a
										href="https://app.aethertask.com"
										target="_blank"
										rel="noopener noreferrer"
									>
										Get Started — Free Forever Plan
									</a>
								</Button>
							</motion.div>
							<p className="text-sm text-muted-foreground mt-4">
								Pro plan available for just $8/mo. No credit card required.
							</p>
						</motion.div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t border-border/40 py-12">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6">
						<div className="flex items-center gap-3">
							<img src="/favicon.svg" alt="Aether" className="h-7 w-7 rounded-md" />
							<span className="font-semibold">Aether</span>
						</div>

						<nav aria-label="Footer" className="flex items-center gap-6 text-sm">
							<a
								href="https://www.aethertask.com/privacy-policy"
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								Privacy
							</a>
							<a
								href="https://www.aethertask.com/terms-of-service"
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								Terms
							</a>
							<a
								href="https://github.com/nikitalobanov/aether-landing-page"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								Changelog
							</a>
						</nav>
					</div>
				</div>
			</footer>
		</div>
	);
}
