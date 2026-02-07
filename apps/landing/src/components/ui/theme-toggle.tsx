import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark'>('light');

	useEffect(() => {
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

		// Persist theme preference
		localStorage.setItem('theme', newTheme);
	};

	// Load theme preference on mount - default to dark
	useEffect(() => {
		const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

		// Default to dark if no preference saved
		const initialTheme = savedTheme || 'dark';
		setTheme(initialTheme);

		if (initialTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, []);

	return (
		<Button
			variant='outline'
			size='icon'
			onClick={toggleTheme}
			className='h-9 w-9'
		>
			{theme === 'light' ? <Moon className='h-4 w-4' /> : <Sun className='h-4 w-4' />}
			<span className='sr-only'>Toggle theme</span>
		</Button>
	);
}
