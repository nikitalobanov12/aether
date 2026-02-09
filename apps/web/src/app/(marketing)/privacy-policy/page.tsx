import { Button } from '~/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
					
					<h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
					
					<p className="text-xl text-muted-foreground mb-12 text-center">
						<strong>Effective Date:</strong> June 25, 2025<br />
						<strong>Last Updated:</strong> June 25, 2025
					</p>

					<h2>Introduction</h2>
					<p>
						Welcome to Aether (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our productivity application and related services (the &quot;Service&quot;).
					</p>
					<p>
						Aether is a hybrid desktop and web application that helps users manage tasks, set goals, and optimize productivity through AI-powered scheduling and insights.
					</p>

					<h2>Information We Collect</h2>

					<h3>Personal Information You Provide</h3>
					<ul>
						<li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
						<li><strong>Profile Information:</strong> First name, last name, timezone, and other optional profile details</li>
						<li><strong>User Preferences:</strong> Theme settings, language preferences, date/time formats, working hours, and application configuration settings</li>
					</ul>

					<h3>Task and Productivity Data</h3>
					<ul>
						<li><strong>Tasks:</strong> Task titles, descriptions, due dates, time estimates, priorities, categories, progress, and completion status</li>
						<li><strong>Goals:</strong> Goal titles, descriptions, target values, progress tracking, categories (health, career, personal, financial, education, relationships, creative, spiritual), deadlines, and achievement data</li>
						<li><strong>Boards:</strong> Board names, descriptions, colors, and organizational structures</li>
						<li><strong>Time Tracking:</strong> Sprint sessions, timer usage, focus time, and productivity patterns</li>
						<li><strong>Subtasks:</strong> Subtask details, completion status, and hierarchical relationships</li>
					</ul>

					<h3>Usage and Analytics Data</h3>
					<ul>
						<li><strong>Application Usage:</strong> Feature usage patterns, interaction data, session duration, and performance metrics</li>
						<li><strong>Device Information:</strong> Platform type (desktop/web), operating system, browser information (for web version)</li>
						<li><strong>Error Logs:</strong> Technical error reports and diagnostic information for application improvement</li>
					</ul>

					<h3>AI Processing Data</h3>
					<ul>
						<li><strong>Scheduling Context:</strong> Working hours, energy levels, task priorities, and scheduling preferences</li>
						<li><strong>AI Interactions:</strong> Prompts, AI-generated suggestions, scheduling requests, and user feedback on AI recommendations</li>
						<li><strong>Performance Analytics:</strong> AI accuracy metrics and user satisfaction with AI suggestions</li>
					</ul>

					<h2>Third-Party Integrations</h2>

					<h3>Neon PostgreSQL (Database) + Better Auth (Authentication)</h3>
					<ul>
						<li><strong>Purpose:</strong> Secure data storage, user authentication, and real-time synchronization</li>
						<li><strong>Data Shared:</strong> All user account information, tasks, goals, preferences, and application data</li>
						<li><strong>Privacy Policy:</strong> <a href="https://neon.tech/privacy">Neon Privacy Policy</a></li>
					</ul>

					<h3>Google Services</h3>
					<h4>Google Calendar Integration:</h4>
					<ul>
						<li>Access calendar events and create new events from your tasks</li>
						<li>Read calendar metadata to avoid scheduling conflicts</li>
						<li>OAuth 2.0 secure authentication with consent-based access</li>
					</ul>

					<h4>Google Tasks Integration:</h4>
					<ul>
						<li>Import existing Google Tasks into Aether</li>
						<li>Read task lists and task data</li>
					</ul>

					<h4>Limited Use Disclosure</h4>
					<p>
						The use of information received from Google APIs will adhere to the{' '}
						<a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use_requiremen" target="_blank" rel="noopener noreferrer">
							Google API Services User Data Policy
						</a>
						, including the Limited Use requirements.
					</p>

					<ul>
						<li><strong>Data Shared:</strong> Task information marked for calendar sync, scheduled dates and times</li>
						<li><strong>Permissions:</strong> Read-only access to calendars and tasks; event creation only when explicitly requested</li>
						<li><strong>Privacy Policy:</strong> <a href="https://policies.google.com/privacy">Google Privacy Policy</a></li>
					</ul>

					<h3>Hugging Face Inference API</h3>
					<ul>
						<li><strong>Purpose:</strong> Task scheduling optimization, time estimation, and productivity insights</li>
						<li><strong>Data Processing:</strong> Task titles and descriptions (personal details are filtered out), user scheduling preferences and working hours, goal information for context-aware scheduling, board and project context for better scheduling decisions</li>
						<li><strong>Data Security:</strong> All AI requests are processed through secure server-side functions</li>
						<li><strong>Data Retention:</strong> AI requests are processed in real-time and not stored by the AI provider</li>
						<li><strong>Privacy Policy:</strong> <a href="https://huggingface.co/privacy">Hugging Face Privacy Policy</a></li>
					</ul>

					<h2>How We Use Your Information</h2>

					<h3>Core Application Features</h3>
					<ul>
						<li>Provide task management, goal tracking, and productivity features</li>
						<li>Synchronize data across your devices (desktop and web)</li>
						<li>Maintain your user preferences and application settings</li>
						<li>Enable collaboration features and data sharing (when applicable)</li>
					</ul>

					<h3>AI-Powered Features</h3>
					<ul>
						<li><strong>Intelligent Scheduling:</strong> Optimize task scheduling based on your preferences, working hours, and goals</li>
						<li><strong>Time Estimation:</strong> Provide accurate time estimates for tasks based on historical data and AI analysis</li>
						<li><strong>Productivity Insights:</strong> Generate personalized recommendations for improving productivity</li>
						<li><strong>Natural Language Processing:</strong> Convert natural language input into structured tasks</li>
					</ul>

					<h3>Service Improvement</h3>
					<ul>
						<li>Analyze usage patterns to improve application performance and user experience</li>
						<li>Debug technical issues and provide customer support</li>
						<li>Develop new features based on user needs and feedback</li>
					</ul>

					<h3>Communication</h3>
					<ul>
						<li>Send important service updates and security notifications</li>
						<li>Provide customer support and respond to your inquiries</li>
						<li>Share feature updates and productivity tips (with your consent)</li>
					</ul>

					<h2>Data Security and Storage</h2>

					<h3>Security Measures</h3>
					<ul>
						<li><strong>Encryption:</strong> All data is encrypted in transit (HTTPS/TLS) and at rest</li>
						<li><strong>Authentication:</strong> Secure authentication using industry-standard protocols (OAuth 2.0, PKCE flow)</li>
						<li><strong>Access Controls:</strong> Role-based access controls and principle of least privilege</li>
						<li><strong>AI Security:</strong> AI processing occurs in secure, isolated server-side functions with no data persistence</li>
					</ul>

					<h3>Data Storage</h3>
					<ul>
						<li><strong>Primary Storage:</strong> Data is stored in PostgreSQL (Neon) with strong security guarantees</li>
						<li><strong>Geographic Location:</strong> Data is stored in secure data centers with compliance certifications</li>
						<li><strong>Backups:</strong> Regular automated backups with encryption and secure storage</li>
						<li><strong>Data Isolation:</strong> Row-level security ensures user data is isolated and accessible only to authorized users</li>
					</ul>

					<h3>AI Data Processing</h3>
					<ul>
						<li><strong>Secure Processing:</strong> AI requests are processed through secure server-side functions with user authentication</li>
						<li><strong>No AI Data Storage:</strong> Hugging Face processes requests in real-time without storing your data</li>
						<li><strong>Data Minimization:</strong> Only necessary task context is sent to AI services, with personal details filtered out</li>
						<li><strong>User Control:</strong> AI features can be disabled entirely through user preferences</li>
					</ul>

					<h2>Your Rights and Choices</h2>

					<h3>Data Access and Control</h3>
					<ul>
						<li><strong>Access:</strong> View and download all your personal data through the application</li>
						<li><strong>Correction:</strong> Update your personal information and preferences at any time</li>
						<li><strong>Deletion:</strong> Delete your account and all associated data</li>
						<li><strong>Portability:</strong> Export your data in standard formats (JSON, CSV)</li>
					</ul>

					<h3>Privacy Controls</h3>
					<ul>
						<li><strong>AI Features:</strong> Enable or disable AI-powered scheduling and suggestions</li>
						<li><strong>Third-Party Integrations:</strong> Control what data is shared with Google Calendar and Tasks</li>
						<li><strong>Data Sharing:</strong> Opt out of usage analytics and performance monitoring</li>
						<li><strong>Communication:</strong> Control notification preferences and marketing communications</li>
					</ul>

					<h3>Account Management</h3>
					<ul>
						<li><strong>Account Deletion:</strong> Permanently delete your account and all data through the application settings</li>
						<li><strong>Data Retention:</strong> Data is deleted within 30 days of account deletion</li>
						<li><strong>Service Termination:</strong> Right to terminate service at any time with immediate data deletion</li>
					</ul>

					<h2>Data Retention</h2>

					<h3>Active Accounts</h3>
					<ul>
						<li>Personal data is retained as long as your account is active</li>
						<li>Task and goal data is retained to provide historical insights and trends</li>
						<li>AI interaction data is not stored beyond the immediate processing session</li>
					</ul>

					<h3>Account Deletion</h3>
					<ul>
						<li>All personal data is permanently deleted within 30 days of account deletion</li>
						<li>Anonymized usage statistics may be retained for service improvement</li>
						<li>Backups containing deleted data are purged according to our backup retention schedule (maximum 90 days)</li>
					</ul>

					<h3>Legal Compliance</h3>
					<ul>
						<li>Data may be retained longer if required by law or legal proceedings</li>
						<li>Security incident logs may be retained for up to 1 year for security monitoring</li>
					</ul>

					<h2>International Data Transfers</h2>
					<ul>
						<li>Data may be transferred to and processed in countries other than your country of residence</li>
						<li>We ensure appropriate safeguards are in place for international transfers</li>
						<li>Neon, Hugging Face, and Google services may process data in various global regions</li>
						<li>All transfers comply with applicable data protection laws (GDPR, CCPA, etc.)</li>
					</ul>

					<h2>Children&apos;s Privacy</h2>
					<ul>
						<li>Our Service is not intended for children under 13 years of age</li>
						<li>We do not knowingly collect personal information from children under 13</li>
						<li>If we discover we have collected information from a child under 13, we will delete it immediately</li>
						<li>Parents who believe their child has provided personal information should contact us immediately</li>
					</ul>

					<h2>Changes to This Privacy Policy</h2>
					<ul>
						<li>We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements</li>
						<li>Material changes will be communicated through the application or via email</li>
						<li>The &quot;Last Updated&quot; date indicates when the policy was last revised</li>
						<li>Continued use of the Service after policy changes constitutes acceptance of the updated policy</li>
					</ul>

					<h2>Regional Privacy Rights</h2>

					<h3>European Union (GDPR)</h3>
					<p>If you are in the EU, you have additional rights under the General Data Protection Regulation:</p>
					<ul>
						<li><strong>Lawful Basis:</strong> We process your data based on contract performance, legitimate interests, and consent</li>
						<li><strong>Data Protection Officer:</strong> Contact information available upon request</li>
						<li><strong>Supervisory Authority:</strong> Right to lodge complaints with your local data protection authority</li>
					</ul>

					<h3>California (CCPA)</h3>
					<p>If you are a California resident, you have rights under the California Consumer Privacy Act:</p>
					<ul>
						<li><strong>Right to Know:</strong> Details about personal information categories and sources</li>
						<li><strong>Right to Delete:</strong> Request deletion of personal information</li>
						<li><strong>Right to Opt-Out:</strong> Opt out of sale of personal information (we do not sell personal information)</li>
						<li><strong>Non-Discrimination:</strong> We will not discriminate for exercising CCPA rights</li>
					</ul>

					<h2>Contact Information</h2>
					<p>For privacy-related questions, concerns, or requests:</p>
					<ul>
						<li><strong>Email:</strong> <a href="mailto:nikita@nikitalobanov.com">nikita@nikitalobanov.com</a></li>
						<li><strong>Website:</strong> <a href="https://www.aethertask.com">https://www.aethertask.com</a></li>
					</ul>

					<h3>Data Protection Requests:</h3>
					<ul>
						<li><strong>Account deletion:</strong> Use the settings page in the application</li>
						<li><strong>Data export:</strong> Available through the application settings</li>
						<li><strong>Other requests:</strong> Contact <a href="mailto:nikita@nikitalobanov.com">nikita@nikitalobanov.com</a></li>
					</ul>

					<h2>Data Processing Transparency</h2>

					<h3>AI Processing Details</h3>
					<ul>
						<li><strong>Model Used:</strong> Hugging Face open-source models for task scheduling and time estimation</li>
						<li><strong>Data Sent:</strong> Task titles, descriptions, user preferences, working hours (personal identifiers removed)</li>
						<li><strong>Processing Location:</strong> Hugging Face&apos;s secure AI infrastructure</li>
						<li><strong>Response Time:</strong> Real-time processing, no data storage by AI provider</li>
						<li><strong>User Control:</strong> Full opt-out available through settings</li>
					</ul>

					<h3>Database Operations</h3>
					<ul>
						<li><strong>Provider:</strong> Neon PostgreSQL</li>
						<li><strong>Security:</strong> Row-level security, encryption at rest and in transit</li>
						<li><strong>Backup:</strong> Automated daily backups, encrypted storage</li>
						<li><strong>Access:</strong> Only authenticated users can access their own data</li>
					</ul>

					<div className="mt-12 p-6 bg-muted/50 rounded-lg">
						<p className="text-muted-foreground leading-relaxed">
							This Privacy Policy is designed to be transparent about our data practices while ensuring your privacy and security are protected. We are committed to responsible data handling and giving you control over your personal information.
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
