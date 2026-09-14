import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";

export default function PainelPage() {
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  );
}
