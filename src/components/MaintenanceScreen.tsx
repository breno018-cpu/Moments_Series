import { Wrench } from "lucide-react";

interface MaintenanceScreenProps {
  message?: string;
}

export function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-[#07080c] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/[0.04] border border-white/10 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
          <Wrench className="w-8 h-8 animate-spin" />
        </div>
        <h1 className="text-2xl font-black">Sistema em Manutenção</h1>
        <p className="text-sm text-slate-300">
          {message || "Estamos atualizando nossos servidores para trazer novidades incríveis. Voltaremos em breve!"}
        </p>
      </div>
    </div>
  );
}
