import { Button } from '~/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<img
							src="/logo.svg"
							alt="Aether"
							className="h-8 w-8"
						/>
						<span className="text-xl font-bold">Aether</span>
					</div>
					<Button asChild variant="outline">
						<Link href="/">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Home
						</Link>
					</Button>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-12">
				<div className="max-w-4xl mx-auto [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-12 [&>h2]:mb-6 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-8 [&>h3]:mb-4 [&>h4]:text-lg [&>h4]:font-medium [&>h4]:mt-6 [&>h4]:mb-3 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-2 [&>ul]:mb-6 [&>ul]:leading-relaxed [&_a]:text-blue-600 [&_a]:hover:underline">
					
					<h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
					
					<p className="text-xl text-muted-foreground mb-12 text-center">
						<strong>Effective Date:</strong> June 25, 2025<br />
						<strong>Last Updated:</strong> June 25, 2025
					</p>

					<h2>Introduction</h2>
					<p>
						Welcome to Aether! These Terms of Service govern your use of the Aether productivity application and related services.
					</p>
					<p>
						By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, then you may not access the Service.
					</p>

					<h2>Acceptance of Terms</h2>
					<p>
						By downloading, installing, or using Aether, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
					</p>
					<ul>
						<li>You must be at least 13 years old to use our Service</li>
						<li>If you are under 18, you must have parental or guardian consent</li>
						<li>You are responsible for ensuring compliance with local laws and regulations</li>
						<li>These Terms constitute a legally binding agreement between you and Aether</li>
						<li>Your continued use of the Service constitutes acceptance of any modifications to these Terms</li>
					</ul>

					<h2>Description of Service</h2>
					<p>
						Aether is a hybrid desktop and web productivity application that helps users manage tasks, set goals, and optimize productivity through AI-powered scheduling and insights. Our Service includes:
					</p>
					<ul>
						<li><strong>Task Management:</strong> Create, organize, prioritize, and track your tasks with advanced categorization and progress tracking</li>
						<li><strong>Goal Setting:</strong> Set and track personal and professional goals across multiple categories</li>
						<li><strong>AI-Powered Features:</strong> Intelligent task scheduling, time estimation, and productivity insights using Hugging Face Inference API</li>
						<li><strong>Board Organization:</strong> Organize tasks into customizable boards with colors and descriptions</li>
						<li><strong>Time Tracking:</strong> Sprint sessions, focus timers, and productivity pattern analysis</li>
						<li><strong>Google Calendar Integration:</strong> Sync tasks with your Google Calendar and create calendar events</li>
						<li><strong>Google Tasks Integration:</strong> Import existing Google Tasks into Aether</li>
						<li><strong>Cross-Platform Support:</strong> Desktop applications for Windows, macOS, and Linux, plus web-based access</li>
						<li><strong>Data Synchronization:</strong> Real-time sync across all your devices using secure cloud infrastructure</li>
						<li><strong>Collaboration Features:</strong> Share and collaborate on tasks and projects when applicable</li>
					</ul>

					<h2>User Accounts and Registration</h2>

					<h3>Account Creation</h3>
					<ul>
						<li>You may need to create an account to access certain features of the Service</li>
						<li>You must provide accurate, current, and complete information during registration</li>
						<li>You are responsible for maintaining the confidentiality of your account credentials</li>
						<li>You must use a valid email address and maintain access to it</li>
						<li>One person or legal entity may not maintain more than one account without our permission</li>
					</ul>

					<h3>Account Security</h3>
					<ul>
						<li>You are responsible for all activities that occur under your account</li>
						<li>You must use a strong, unique password and keep it confidential</li>
						<li>You must immediately notify us of any unauthorized use of your account</li>
						<li>We are not liable for any loss or damage arising from unauthorized account access</li>
						<li>You may be held liable for losses incurred by us or others due to unauthorized account use</li>
					</ul>

					<h3>Account Termination</h3>
					<ul>
						<li>You may terminate your account at any time through the application settings</li>
						<li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
						<li>Upon termination, your data will be deleted according to our Privacy Policy</li>
						<li>Some provisions of these Terms survive account termination</li>
					</ul>

					<h2>Acceptable Use Policy</h2>

					<h3>Permitted Uses</h3>
					<p>You may use the Service for:</p>
					<ul>
						<li>Personal task management and productivity improvement</li>
						<li>Professional project management within your organization</li>
						<li>Educational purposes and academic project management</li>
						<li>Small team collaboration where supported</li>
					</ul>

					<h3>Prohibited Uses</h3>
					<p>You agree not to use the Service to:</p>
					<ul>
						<li>Violate any applicable laws, regulations, or third-party rights</li>
						<li>Transmit any harmful, offensive, defamatory, or inappropriate content</li>
						<li>Attempt to gain unauthorized access to our systems, other users&apos; accounts, or related networks</li>
						<li>Use the Service for any unlawful or fraudulent activities</li>
						<li>Distribute malware, viruses, or other harmful computer code</li>
						<li>Engage in any activity that disrupts or interferes with the Service</li>
						<li>Reverse engineer, decompile, or attempt to extract source code from our applications</li>
						<li>Use automated scripts or bots to access the Service without permission</li>
						<li>Resell, distribute, or commercially exploit the Service without authorization</li>
						<li>Store or transmit content that infringes on intellectual property rights</li>
						<li>Use the Service to spam, harass, or send unsolicited communications</li>
					</ul>

					<h2>Third-Party Integrations</h2>

					<h3>Google Services Integration</h3>
					<p>Aether integrates with Google services including Calendar and Tasks. By using these integrations:</p>
					<ul>
						<li>You must have a valid Google account and comply with Google&apos;s Terms of Service</li>
						<li>You authorize Aether to access your Google services as specified in our Privacy Policy</li>
						<li>You understand that Google&apos;s privacy and data handling policies apply to your interactions with Google services</li>
						<li>You can revoke access permissions at any time through your Google account settings</li>
						<li>We are not responsible for Google&apos;s services or any issues arising from their use</li>
					</ul>

					<h3>AI-Powered Features</h3>
					<p>Our AI features are powered by Hugging Face. By using AI features:</p>
					<ul>
						<li>You consent to processing of your task data for scheduling and productivity insights</li>
						<li>You understand that AI suggestions are automated and may not always be accurate</li>
						<li>You retain full control over accepting or rejecting AI recommendations</li>
						<li>You can disable AI features entirely through your user preferences</li>
						<li>We do not guarantee the accuracy, completeness, or suitability of AI-generated content</li>
					</ul>

					<h2>User Content and Data</h2>

					<h3>Your Content</h3>
					<ul>
						<li>You retain ownership of all content you create, upload, or store in the Service</li>
						<li>You grant us a limited license to use your content solely to provide the Service</li>
						<li>You are responsible for the accuracy, legality, and appropriateness of your content</li>
						<li>You must have the right to use and share any content you upload</li>
						<li>You must not upload content that violates third-party rights or applicable laws</li>
					</ul>

					<h3>Content Backup and Export</h3>
					<ul>
						<li>You are responsible for backing up your important data</li>
						<li>We provide data export functionality through the application</li>
						<li>We maintain regular backups but do not guarantee data recovery</li>
						<li>You can export your data in standard formats like JSON and CSV at any time</li>
					</ul>

					<h3>Content Removal</h3>
					<ul>
						<li>We reserve the right to remove content that violates these Terms</li>
						<li>We may remove content without notice if required by law or to protect the Service</li>
						<li>You can delete your own content at any time through the application</li>
						<li>Deleted content may remain in backups for up to 90 days before permanent deletion</li>
					</ul>

					<h2>Privacy and Data Protection</h2>
					<p>
						Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect your information. By using Aether, you consent to the collection and use of your information as described in our Privacy Policy.
					</p>
					<ul>
						<li>We implement industry-standard security measures to protect your data</li>
						<li>Your data is encrypted in transit and at rest</li>
						<li>We comply with applicable data protection laws including GDPR and CCPA</li>
						<li>You have rights regarding your personal data as outlined in our Privacy Policy</li>
						<li>We do not sell your personal information to third parties</li>
					</ul>

					<h2>Service Availability and Support</h2>

					<h3>Service Availability</h3>
					<ul>
						<li>We strive to maintain high service availability but do not guarantee 100% uptime</li>
						<li>Aether may be unavailable due to maintenance, updates, or technical issues</li>
						<li>We will provide reasonable notice of planned maintenance when possible</li>
						<li>Service availability may vary by geographic location</li>
					</ul>

					<h3>Support</h3>
					<ul>
						<li>We provide customer support through email and our website</li>
						<li>Support response times may vary based on the nature of your inquiry</li>
						<li>We do not guarantee specific response times or resolution timeframes</li>
						<li>Support is provided in English and may be available in other languages</li>
					</ul>

					<h2>Subscription and Payment Terms</h2>

					<h3>Service Plans</h3>
					<ul>
						<li>Aether may offer both free and paid service plans</li>
						<li>Paid plans may include additional features, storage, or functionality</li>
						<li>Service plans and pricing may change with reasonable notice</li>
						<li>Some features may require a paid subscription</li>
					</ul>

					<h3>Payment and Billing</h3>
					<ul>
						<li>Paid subscriptions are billed in advance on a recurring basis</li>
						<li>You authorize us to charge your chosen payment method</li>
						<li>You are responsible for maintaining valid payment information</li>
						<li>All fees are non-refundable unless otherwise specified</li>
						<li>Failure to pay may result in service suspension or termination</li>
					</ul>

					<h3>Cancellation and Refunds</h3>
					<ul>
						<li>You may cancel your subscription at any time through your account settings</li>
						<li>Cancellation takes effect at the end of your current billing period</li>
						<li>No refunds are provided for partial billing periods</li>
						<li>You retain access to paid features until the end of your billing period</li>
					</ul>

					<h2>Intellectual Property Rights</h2>

					<h3>Our Rights</h3>
					<ul>
						<li>Aether, its logo, and associated trademarks are our intellectual property</li>
						<li>Aether, including its software, design, and functionality, is protected by copyright and other laws</li>
						<li>You may not use our intellectual property without explicit permission</li>
						<li>All rights not expressly granted to you are reserved by us</li>
					</ul>

					<h3>Your Rights</h3>
					<ul>
						<li>You retain all rights to content you create using Aether</li>
						<li>You may use Aether in accordance with these Terms</li>
						<li>You may not claim ownership of Aether or its components</li>
						</ul>

					<h3>Feedback and Suggestions</h3>
					<ul>
						<li>Any feedback or suggestions you provide may be used by us without restriction</li>
						<li>You do not retain ownership rights in feedback provided to us</li>
						<li>We are not obligated to implement any feedback or suggestions</li>
					</ul>

					<h2>Disclaimers and Limitation of Liability</h2>

					<h3>Service Disclaimers</h3>
					<ul>
						<li>Aether is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind</li>
						<li>We do not warrant that Aether will be uninterrupted, error-free, or secure</li>
						<li>We do not guarantee the accuracy, completeness, or usefulness of content</li>
						<li>AI-generated content and suggestions are provided without warranty</li>
						<li>Third-party integrations are subject to the availability and policies of third parties</li>
					</ul>

					<h3>Limitation of Liability</h3>
					<ul>
						<li>Our liability is limited to the maximum extent permitted by law</li>
						<li>We are not liable for indirect, incidental, special, or consequential damages</li>
						<li>Our total liability shall not exceed the amount you paid for Aether in the 12 months preceding the claim</li>
						<li>These limitations apply regardless of the theory of liability</li>
						<li>Some jurisdictions may not allow these limitations</li>
					</ul>

					<h2>Indemnification</h2>
					<p>
						You agree to indemnify, defend, and hold harmless Aether, its officers, directors, employees, and agents from any claims, damages, losses, or expenses including legal fees arising from:
					</p>
					<ul>
						<li>Your use of Aether</li>
						<li>Your violation of these Terms</li>
						<li>Your violation of any third-party rights</li>
						<li>Content you submit, post, or transmit through Aether</li>
						<li>Your negligent or wrongful conduct</li>
					</ul>

					<h2>Governing Law and Dispute Resolution</h2>

					<h3>Governing Law</h3>
					<ul>
						<li>These Terms are governed by the laws of Canada</li>
						<li>Any disputes will be resolved in the courts of Canada</li>
						<li>You consent to the jurisdiction of Canadian courts</li>
					</ul>

					<h3>Dispute Resolution</h3>
					<ul>
						<li>We encourage resolving disputes through direct communication first</li>
						<li>If informal resolution fails, disputes may be resolved through binding arbitration</li>
						<li>Class action lawsuits and jury trials are waived where legally permitted</li>
						<li>Some jurisdictions may not allow arbitration requirements</li>
					</ul>

					<h2>Modifications to Terms</h2>
					<ul>
						<li>We may modify these Terms at any time with reasonable notice</li>
						<li>Material changes will be communicated through the application or via email</li>
						<li>Your continued use of Aether constitutes acceptance of modified Terms</li>
						<li>If you do not agree to modified Terms, you must discontinue using Aether</li>
						<li>The most current version of these Terms will always be available on our website</li>
					</ul>

					<h2>Termination</h2>

					<h3>Termination by You</h3>
					<ul>
						<li>You may terminate your account at any time through the application settings</li>
						<li>Termination is effective immediately upon account deletion</li>
						<li>You remain responsible for any charges incurred before termination</li>
					</ul>

					<h3>Termination by Us</h3>
					<ul>
						<li>We may terminate or suspend your account for violations of these Terms</li>
						<li>We may terminate Aether entirely with reasonable notice</li>
						<li>Upon termination, your data will be handled according to our Privacy Policy</li>
						<li>We will provide data export opportunities before termination when possible</li>
					</ul>

					<h3>Effect of Termination</h3>
					<ul>
						<li>Upon termination, your right to use Aether ceases immediately</li>
						<li>Provisions regarding liability, indemnification, and dispute resolution survive termination</li>
						<li>Your data will be deleted according to our data retention policies</li>
					</ul>

					<h2>Miscellaneous</h2>

					<h3>Entire Agreement</h3>
					<p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and Aether.</p>

					<h3>Severability</h3>
					<p>If any provision of these Terms is found unenforceable, the remaining provisions remain in full force and effect.</p>

					<h3>Assignment</h3>
					<p>We may assign these Terms to any affiliate, subsidiary, or successor. You may not assign your rights or obligations without our consent.</p>

					<h3>Waiver</h3>
					<p>Our failure to enforce any provision does not constitute a waiver of that provision or any other provision.</p>

					<h3>Force Majeure</h3>
					<p>We are not liable for any failure to perform our obligations due to circumstances beyond our reasonable control.</p>

					<h2>Contact Information</h2>
					<p>For questions about these Terms of Service, please contact us:</p>
					<ul>
						<li><strong>Email:</strong> <a href="mailto:nikita@nikitalobanov.com">nikita@nikitalobanov.com</a></li>
						<li><strong>Website:</strong> <a href="https://www.aethertask.com">https://www.aethertask.com</a></li>
						<li><strong>Support:</strong> <a href="mailto:nikita@nikitalobanov.com">nikita@nikitalobanov.com</a></li>
					</ul>

					<div className="mt-12 p-6 bg-muted/50 rounded-lg">
						<p className="text-muted-foreground leading-relaxed">
							These Terms of Service are designed to protect both Aether and our users while ensuring fair and transparent use of our app. We are committed to providing a secure, reliable, and user-friendly productivity platform.
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
