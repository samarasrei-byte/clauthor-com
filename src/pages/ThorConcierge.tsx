/**
 * Rota /thor — wrapper full-screen do chat concierge.
 * Toda a lógica está em <ThorConciergeChat />.
 */
import ThorConciergeChat from "@/components/landing/ThorConciergeChat";

export default function ThorConcierge() {
  return (
    <main className="min-h-dvh bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <ThorConciergeChat source="thor_guide" minHeight="min-h-[520px]" />
      </div>
    </main>
  );
}
