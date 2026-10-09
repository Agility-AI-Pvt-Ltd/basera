import { AboutSection } from './components/about/AboutSection';
import { CommunityFab } from './components/CommunityFab';
import { FooterSection } from './components/footer/FooterSection';
import { HeroSection } from './components/HeroSection';
import { PhoneSection } from './components/phone/PhoneSection';
import { TestimonialsSection } from './components/testimonials/TestimonialsSection';

export default function App() {
  return (
    <div className="page">
      <main id="top">
        <HeroSection />
        <AboutSection />
        <TestimonialsSection />
        <PhoneSection />
      </main>
      <FooterSection />
      <CommunityFab />
    </div>
  );
}
