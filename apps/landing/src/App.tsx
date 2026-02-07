import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from '@/components/Home';
import { PrivacyPolicy } from '@/components/PrivacyPolicy';
import { TermsOfService } from '@/components/TermsOfService';
import './App.css';

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/privacy-policy" element={<PrivacyPolicy />} />
				<Route path="/terms-of-service" element={<TermsOfService />} />
			</Routes>
		</Router>
	);
}

export default App;
