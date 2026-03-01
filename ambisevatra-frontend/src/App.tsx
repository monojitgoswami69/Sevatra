import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import { UserProvider } from './context/UserContext';

import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import SosActivation from './pages/SosActivation';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import Profile from './pages/Profile';
import BookingHistory from './pages/BookingHistory';
import AmbulanceConfirmed from './pages/AmbulanceConfirmed';
import Faq from './pages/Faq';
import BookAmbulance from './pages/BookAmbulance';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="relative flex min-h-screen w-full flex-col font-sans bg-neutral-gray dark:bg-background-dark overflow-x-hidden text-text-dark dark:text-white">
          <Header />

          {/* Main Content */}
          <main className="relative z-10 flex flex-col flex-grow w-full items-center">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/book-ambulance" element={<BookAmbulance />} />
              <Route path="/sos-activation" element={<SosActivation />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/booking-history" element={<BookingHistory />} />
              <Route path="/ambulance-confirmed" element={<AmbulanceConfirmed />} />
              <Route path="/faq" element={<Faq />} />
            </Routes>
          </main>


          <Chatbot />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
