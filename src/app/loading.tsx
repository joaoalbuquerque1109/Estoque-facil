import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/25 backdrop-blur-[2px]">
      <Loader2 className="h-10 w-10 animate-spin text-white" />
    </main>
  );
}
