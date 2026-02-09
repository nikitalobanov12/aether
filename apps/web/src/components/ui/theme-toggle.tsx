"use client";

import { Moon, Sun } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark'>('dark');
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const isDarkMode = document.documentElement.classList.contains('dark');
		setTheme(isDarkMode ? 'dark' : 'light');
	}, []);

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);

		if (newTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}

		localStorage.setItem('aether-theme', newTheme);
	};

	if (!mounted) {
		return (
			<Button variant="outline" size="icon" className="h-9 w-9">
				<Sun className="h-4 w-4" />
				<span className="sr-only">Toggle theme</span>
			</Button>
		);
	}

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={toggleTheme}
			className="h-9 w-9"
		>
			{theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
