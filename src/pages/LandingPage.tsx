import { useNavigate } from 'react-router-dom';
import HeroSection from '@/components/landing/HeroSection';
import PainPointsSection from '@/components/landing/PainPointsSection';
import BeliefBreakSection from '@/components/landing/BeliefBreakSection';
import AgitationSection from '@/components/landing/AgitationSection';
import SolutionSection from '@/components/landing/SolutionSection';
import DemoSection from '@/components/landing/DemoSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import DifferentialsSection from '@/components/landing/DifferentialsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import UrgencySection from '@/components/landing/UrgencySection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import FloatingCTA from '@/components/landing/FloatingCTA';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import TrustBar from '@/components/landing/TrustBar';
import TargetAudienceSection from '@/components/landing/TargetAudienceSection';

export default function LandingPage() {
  const navigate = useNavigate();
  const handleLogin = () => navigate('/login');
  const handleWhatsApp = () => window.open('https://wa.me/5500000000000?text=Quero%20ver%20o%20sistema%20funcionando', '_blank');

  return (
    <div className="min-h-screen bg-background overflow-x-hidden dark scroll-smooth">
      <LandingHeader onLogin={handleLogin} onWhatsApp={handleWhatsApp} />
      <HeroSection onLogin={handleLogin} onWhatsApp={handleWhatsApp} />
      <TrustBar />
      <PainPointsSection />
      <BeliefBreakSection />
      <AgitationSection onWhatsApp={handleWhatsApp} />
      <SolutionSection />
      <TargetAudienceSection />
      <DemoSection />
      <BenefitsSection onWhatsApp={handleWhatsApp} />
      <DifferentialsSection />
      <TestimonialsSection />
      <PricingSection onLogin={handleLogin} />
      <FAQSection />
      <UrgencySection onWhatsApp={handleWhatsApp} />
      <FinalCTASection onLogin={handleLogin} onWhatsApp={handleWhatsApp} />
      <LandingFooter />
      <FloatingCTA onWhatsApp={handleWhatsApp} />
    </div>
  );
}
