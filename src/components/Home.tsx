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
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

const problemSolutionData = [
	{
		id: 'calendar-sync',
		problemTitle: 'Calendar Sync That Breaks',
		problemQuote:
			'Todoist\'s calendar sync is broken. Tasks appear in the app but not in Google Calendar. Or they create duplicates.',
		solutionTitle: 'Your Calendar and Tasks, Finally in Sync',
		solutionDescription:
			'Unlike other apps, our calendar integration works. Complete a task here, and it disappears from your calendar. Instantly. No duplicates. No sync delays.',
	},
	{
		id: 'accomplishments',
		problemTitle: 'Accomplishments Disappear',
		problemQuote:
			'I complete a task and… it vanishes. How am I supposed to feel motivated? I have no idea what I did this week.',
		solutionTitle: 'See What You Actually Accomplished',
		solutionDescription:
			'We built a weekly review showing everything you completed, grouped by goal, with your progress tracked. Finally, motivation backed by data.',
	},
	{
		id: 'goals',
		problemTitle: 'Tasks Don\'t Connect to Goals',
		problemQuote:
			'Todoist is a giant flat list. Where do my tasks fit in my actual life?',
		solutionTitle: 'Goals → Projects → Daily Tasks. Connected.',
		solutionDescription:
			'Create your big-picture goals. Break them into projects. Then focus on today\'s tasks. See exactly how your daily work contributes to what matters.',
	},
	{
		id: 'ai-takeover',
		problemTitle: 'AI That Takes Over',
		problemQuote:
			'Motion\'s AI scheduled my entire day without asking. It said I should work 2-4pm but I have a meeting at 2:30pm.',
		solutionTitle: 'Smart Suggestions, Not Forced Scheduling',
		solutionDescription:
			'AI should help you think, not think for you. Our app suggests how to break down tasks, highlights what\'s due, and asks if you want help prioritizing. But you\'re always in control.',
	},
	{
		id: 'pricing',
		problemTitle: 'Too Expensive',
		problemQuote:
			'Sunsama is $18/month. Morgen is $25/month. Both have bugs. I\'m paying premium prices for features Todoist has at 1/5 the cost.',
		solutionTitle: 'Full-Featured for $8/Month',
		solutionDescription:
			'We offer everything—calendar sync, goal hierarchy, completed task history, optional AI—for $8/month. Same price as a coffee.',
	},
];

const howItWorksSteps = [
	{ icon: Target, label: 'Create goals' },
	{ icon: FolderOpen, label: 'Break into projects' },
	{ icon: ListTodo, label: 'Add daily tasks' },
	{ icon: Calendar, label: 'See tasks + calendar together' },
	{ icon: CheckCircle2, label: 'Check off. See progress.' },
];

const keyFeatures = [
	'Works with Google Calendar (bi-directional)',
	'"Next Up" task sequencing',
	'Goal-aligned hierarchy',
	'Weekly review + completed history',
	'Minimalist design',
	'Optional AI help',
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
	const [isMobile, setIsMobile] = useState(false);
	const [showHeaderCTA, setShowHeaderCTA] = useState(false);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			setShowHeaderCTA(window.scrollY > 500);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<motion.header
				className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
				initial={{ y: -100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.6, ease: 'easeOut' }}
			>
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<motion.div
						className="flex items-center gap-3"
						initial={{ x: isMobile ? 0 : -20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
					>
						<img src="/logo.svg" alt="Aether" className="h-8 w-8" />
						<span className="text-xl font-bold">Aether</span>
					</motion.div>

					<motion.nav
						className="hidden md:flex items-center gap-8"
						initial={{ y: -20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
					>
						<a
							href="#problems"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							Problems We Solve
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
						initial={{ x: isMobile ? 0 : 20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
					>
						<ThemeToggle />
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{
								opacity: showHeaderCTA ? 1 : 0,
								scale: showHeaderCTA ? 1 : 0.8,
							}}
							transition={{ duration: 0.2 }}
						>
							{showHeaderCTA && (
								<Button asChild size="sm" className="hidden sm:inline-flex">
									<a
										href="https://app.aethertask.com"
										target="_blank"
										rel="noopener noreferrer"
									>
										Start free
									</a>
								</Button>
							)}
						</motion.div>
					</motion.div>
				</div>
			</motion.header>

			{/* Hero Section - Centered */}
			<section className="relative py-24 lg:py-32">
				<div className="container mx-auto px-4">
					<motion.div
						className="text-center max-w-3xl mx-auto"
						initial={{ opacity: 0, y: isMobile ? 20 : 40 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
					>
						<Badge variant="secondary" className="mb-6 text-sm">
							Calendar + tasks + goals in one place
						</Badge>

						<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1]">
							Organize Your Goals.
							<br />
							<span className="text-primary">Execute Your Day.</span>
						</h1>

						<p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
							Finally—a task planner that syncs with your calendar, shows what's next, and lets you see what you accomplished.
						</p>

						<motion.div
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className="inline-block mb-8"
						>
							<Button asChild size="lg" className="px-8 text-base">
								<a
									href="https://app.aethertask.com"
									target="_blank"
									rel="noopener noreferrer"
								>
									Start free
								</a>
							</Button>
						</motion.div>

						<div className="flex flex-wrap justify-center gap-4 text-sm">
							<Badge variant="outline" className="py-1.5 px-3">
								Google Calendar sync
							</Badge>
							<Badge variant="outline" className="py-1.5 px-3">
								Goal hierarchy
							</Badge>
							<Badge variant="outline" className="py-1.5 px-3">
								$8/mo Pro
							</Badge>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Pain Points Section */}
			<section id="problems" className="py-24 bg-muted/30">
				<div className="container mx-auto px-4">
					<motion.div
						className="text-center mb-16"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: 'easeOut' }}
						viewport={{ once: true, margin: '-50px' }}
					>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Problems We Solve
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Real frustrations from real users. We built Aether to fix them.
						</p>
					</motion.div>

					<div className="space-y-6 max-w-5xl mx-auto">
						{problemSolutionData.map((item, index) => (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.5,
									delay: index * 0.1,
									ease: 'easeOut',
								}}
								viewport={{ once: true, margin: '-50px' }}
							>
								<Card className="overflow-hidden">
									<div className="grid md:grid-cols-2">
										{/* Problem side - red tint */}
										<div className="p-6 md:p-8 bg-red-500/5 border-r border-border/50">
											<div className="flex items-center gap-2 mb-3">
												<div className="h-2 w-2 rounded-full bg-red-500" />
												<span className="text-xs font-medium uppercase tracking-wider text-red-600 dark:text-red-400">
													Problem
												</span>
											</div>
											<h3 className="text-lg font-semibold mb-3 text-red-700 dark:text-red-300">
												{item.problemTitle}
											</h3>
											<p className="text-muted-foreground italic text-sm leading-relaxed">
												"{item.problemQuote}"
											</p>
										</div>

										{/* Solution side - teal tint */}
										<div className="p-6 md:p-8 bg-teal-500/5">
											<div className="flex items-center gap-2 mb-3">
												<div className="h-2 w-2 rounded-full bg-teal-500" />
												<span className="text-xs font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400">
													Solution
												</span>
											</div>
											<h3 className="text-lg font-semibold mb-3 text-teal-700 dark:text-teal-300">
												{item.solutionTitle}
											</h3>
											<p className="text-muted-foreground text-sm leading-relaxed">
												{item.solutionDescription}
											</p>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-24">
				<div className="container mx-auto px-4">
					<motion.div
						className="text-center mb-16"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: 'easeOut' }}
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
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.5,
									delay: index * 0.1,
									ease: 'easeOut',
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

			{/* Key Features Section */}
			<section id="features" className="py-24 bg-muted/30">
				<div className="container mx-auto px-4">
					<motion.div
						className="text-center mb-16"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: 'easeOut' }}
						viewport={{ once: true, margin: '-50px' }}
					>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Key Features
						</h2>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
						{keyFeatures.map((feature, index) => (
							<motion.div
								key={feature}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.4,
									delay: index * 0.08,
									ease: 'easeOut',
								}}
								viewport={{ once: true, margin: '-50px' }}
							>
								<Card className="h-full">
									<CardContent className="p-4 flex items-center gap-3">
										<div className="flex-shrink-0">
											<Check className="h-5 w-5 text-primary" />
										</div>
										<span className="text-sm font-medium">{feature}</span>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section id="pricing" className="py-24">
				<div className="container mx-auto px-4">
					<motion.div
						className="text-center mb-16"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: 'easeOut' }}
						viewport={{ once: true, margin: '-50px' }}
					>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Simple Pricing. No Surprises.
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Sunsama charges $18/mo. Morgen charges $25/mo. We think that's too much.
						</p>
					</motion.div>

					<div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
						{pricingPlans.map((plan, index) => (
							<motion.div
								key={plan.name}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.5,
									delay: index * 0.1,
									ease: 'easeOut',
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
												Start free
											</a>
										</Button>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>

					<motion.p
						className="text-center text-sm text-muted-foreground mt-8"
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.3 }}
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
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: 'easeOut' }}
						viewport={{ once: true, margin: '-50px' }}
					>
						<h2 className="text-3xl md:text-4xl font-bold mb-6">
							Your Goals Deserve a System That Works
						</h2>
						<p className="text-xl text-muted-foreground mb-8">
							Stop using disconnected tools. Start seeing how your daily tasks connect to your life goals.
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
									Start free
								</a>
							</Button>
						</motion.div>
						<p className="text-sm text-muted-foreground mt-4">
							Free forever. No credit card required.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border/40 py-12">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6">
						<div className="flex items-center gap-3">
							<img src="/logo.svg" alt="Aether" className="h-6 w-6" />
							<span className="font-semibold">Aether</span>
						</div>

						<div className="flex items-center gap-6 text-sm">
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
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
