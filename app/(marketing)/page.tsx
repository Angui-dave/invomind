import { CtaBanner } from "@/components/marketing/cta-banner";
import { FaqSection } from "@/components/marketing/faq-section";
import {
  FeaturesSection,
  HowItWorksSection,
} from "@/components/marketing/features-section";
import { FreeToolsBanner } from "@/components/marketing/free-tools-banner";
import { HeroSection } from "@/components/marketing/hero-section";
import { MetricsBar } from "@/components/marketing/metrics-bar";
import { PricingSection } from "@/components/marketing/pricing-section";
import { SecuritySection } from "@/components/marketing/security-section";
import { StickyCta } from "@/components/marketing/sticky-cta";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <MetricsBar />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <SecuritySection />
      <FaqSection />
      <FreeToolsBanner />
      <CtaBanner />
      <StickyCta />
    </>
  );
}
