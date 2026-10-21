import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LegalDialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function LegalDialog({ title, isOpen, onClose, children }: LegalDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0c0d14] border-white/10 text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-slate-300 space-y-3 leading-relaxed mt-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
