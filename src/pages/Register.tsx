import { OnboardingWizard } from "@/components/OnboardingWizard";

export default function Register() {
  return (
    <main className="min-h-screen bg-[#ECE6F0] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        <OnboardingWizard />
      </div>
    </main>
  )
}