import { useState } from 'react';

import { LandingFooter } from './LandingFooter';
import { LandingHeader } from './LandingHeader';
import { AdoptSection } from './sections/AdoptSection';
import { CareSection } from './sections/CareSection';
import { CollarSection } from './sections/CollarSection';
import { CommunitySection } from './sections/CommunitySection';
import { GetAppSection } from './sections/GetAppSection';
import { HeroSection } from './sections/HeroSection';
import { NearbyPetsSection } from './sections/NearbyPetsSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import './stitch.css';

type CareTab = 'health' | 'training' | 'nutrition';

export function StitchLandingPage() {
  const [activeSpecies, setActiveSpecies] = useState('All');
  const [careTab, setCareTab] = useState<CareTab>('health');

  return (
    <div className="stitch-landing scroll-smooth bg-background text-on-surface font-body-md text-body-md selection:bg-primary-fixed selection:text-on-primary-fixed">
      <LandingHeader />
      <main className="w-full pt-16 lg:pt-20 bg-background">
        <div className="flex flex-col w-full">
          <HeroSection activeSpecies={activeSpecies} onSpeciesChange={setActiveSpecies} />
          <NearbyPetsSection />
          <AdoptSection />
          <CareSection activeTab={careTab} onTabChange={setCareTab} />
          <CommunitySection />
          <CollarSection />
          <TestimonialsSection />
          <GetAppSection />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
