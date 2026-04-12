import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  ArrowRight,
  BarChart3,
  Shield,
  Zap,
  Users,
  Package,
  TrendingUp,
  Star,
  Brain,
  Truck,
  CreditCard,
  ChevronRight,
  Globe,
  Clock,
  Headphones,
  Building2,
  AlertTriangle,
  XCircle,
  Play,
  MessageCircle,
  CheckCircle2,
  Timer,
  Target,
  Gauge,
  Factory,
  ShieldCheck,
  Rocket,
} from 'lucide-react';
import { usePlans } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import HeroSection from '@/components/landing/HeroSection';
import PainPointsSection from '@/components/landing/PainPointsSection';
import AgitationSection from '@/components/landing/AgitationSection';
import SolutionSection from '@/components/landing/SolutionSection';
import DemoSection from '@/components/landing/DemoSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import DifferentialsSection from '@/components/landing/DifferentialsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
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
    <div className="min-h-screen bg-background overflow-x-hidden dark">
      <LandingHeader onLogin={handleLogin} onWhatsApp={handleWhatsApp} />
      <HeroSection onLogin={handleLogin} onWhatsApp={handleWhatsApp} />
      <TrustBar />
      <PainPointsSection />
      <AgitationSection onWhatsApp={handleWhatsApp} />
      <SolutionSection />
      <DemoSection />
      <BenefitsSection onWhatsApp={handleWhatsApp} />
      <DifferentialsSection />
      <TestimonialsSection />
      <PricingSection onLogin={handleLogin} />
      <UrgencySection onWhatsApp={handleWhatsApp} />
      <FinalCTASection onLogin={handleLogin} onWhatsApp={handleWhatsApp} />
      <LandingFooter />
      <FloatingCTA onWhatsApp={handleWhatsApp} />
    </div>
  );
}
