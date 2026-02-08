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
		id: 'frankenstein',
		problemTitle: '3 Apps to Do 1 Job',
		problemQuote:
			'My goals live in Notion. My tasks in Todoist. My calendar in Google. None of them talk to each other.',
		solutionTitle: 'One Cohesive Timeline',
		solutionDescription:
			'Aether replaces the "Frankenstein Stack." Goals, projects, daily tasks, and your calendar — all in one place. Stop managing your system and start doing the work.',
	},
	{
		id: 'calendar-sync',
		problemTitle: 'Sync That Creates Duplicates',
		problemQuote:
			'Todoist\'s calendar sync is broken. Tasks appear in the app but not in Google Calendar. Or they create duplicates. Every. Single. Time.',
		solutionTitle: 'Bi-Directional Sync. Zero Duplicates.',
		solutionDescription:
			'We didn\'t just "add integration." We rebuilt the sync engine. Change a time in Aether — updates Google Calendar instantly. Complete a task — removes it from your calendar. No ghost tasks.',
	},
	{
		id: 'goals',
		problemTitle: 'Flat Lists, No Context',
		problemQuote:
			'Todoist is a giant flat list. I\'m checking boxes but I have no idea if I\'m making progress on what actually matters.',
		solutionTitle: 'Goals → Projects → Daily Tasks.',
		solutionDescription:
			'Most to-do lists are flat. Aether understands context. Define your Q1 Goals. Break them into Projects. Sequence your Daily Tasks. When you sit down to work, you\'re moving the needle on what matters.',
	},
	{
		id: 'accomplishments',
		problemTitle: 'Completed Tasks Vanish',
		problemQuote:
			'I complete a task and it vanishes into the void. How am I supposed to feel motivated? I have no idea what I did this week.',
		solutionTitle: 'Don\'t Just Do the Work. See the Work.',
		solutionDescription:
			'Aether keeps a "Done" history that feeds into your Weekly Review. See exactly where your time went and end your week feeling accomplished, not drained.',
	},
	{
		id: 'ai-takeover',
		problemTitle: 'AI That Takes Over Your Day',
		problemQuote:
			'Motion\'s AI scheduled my entire day without asking. It put a work block over my lunch break and rearranged my afternoon.',
		solutionTitle: 'AI That Suggests. Never Decides.',
		solutionDescription:
			'You are the boss. The AI is the assistant. We suggest subtasks and help prioritize a heavy day, but we will never auto-schedule over your lunch or rearrange your calendar without permission.',
	},
	{
		id: 'pricing',
		problemTitle: 'Premium Price for Basic Features',
		problemQuote:
			'Sunsama is $20/month. Morgen is $15/month. I\'m paying premium prices for what should be table-stakes features.',
		solutionTitle: 'Full-Featured for $8/Month.',
		solutionDescription:
			'We built Aether for bootstrappers, freelancers, and solo founders. Calendar sync, goal hierarchy, weekly review, optional AI — all for $8/month. Pricing like a utility, not a luxury.',
	},
];

const howItWorksSteps = [
	{ icon: Target, label: 'Define your goals' },
	{ icon: FolderOpen, label: 'Break into projects' },
	{ icon: ListTodo, label: 'Sequence daily tasks' },
	{ icon: Calendar, label: 'See tasks + calendar unified' },
	{ icon: CheckCircle2, label: 'Review progress weekly' },
];

const keyFeatures = [
	'Bi-directional Google Calendar sync',
	'"Next Up" task sequencing',
	'Goals → Projects → Tasks hierarchy',
	'Weekly review + completion history',
	'AI that suggests, never decides',
	'$8/mo — not $20',
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
						<img src="/favicon.svg" alt="Aether" className="h-9 w-9 rounded-lg" />
						<span className="text-xl font-bold tracking-tight">Aether</span>
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
										Start for Free
									</a>
								</Button>
							)}
						</motion.div>
					</motion.div>
				</div>
			</motion.header>

			{/* Hero Section */}
			<section className="relative py-20 lg:py-28 overflow-hidden">
				<div className="container mx-auto px-4">
					{/* Hero Copy */}
					<motion.div
						className="text-center max-w-4xl mx-auto mb-16 lg:mb-20"
						initial={{ opacity: 0, y: isMobile ? 20 : 40 }}
						animate={{ opacity: 1, y: 0 }}
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
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.6, delay: 0.8 }}
						>
							Actually syncs with Google Calendar in real-time.
						</motion.p>
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
							Why Are You Using 3 Apps to Do 1 Job?
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Real frustrations. Real users. We built Aether to fix every one of them.
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

			{/* Footer */}
			<footer className="border-t border-border/40 py-12">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6">
						<div className="flex items-center gap-3">
							<img src="/favicon.svg" alt="Aether" className="h-7 w-7 rounded-md" />
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
