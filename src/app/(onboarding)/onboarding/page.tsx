import { ChurchOnboardingForm } from "@/components/onboarding/church-onboarding-form";
import { redirectIfOnboardingComplete } from "@/lib/auth/require-onboarding-complete-server";

export const metadata = {
  title: "Set up your church",
  description: "Complete FaithConnectHub onboarding for your ministry.",
};

export default async function OnboardingPage() {
  await redirectIfOnboardingComplete();
  return <ChurchOnboardingForm />;
}
