import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

export default function PixPaymentError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Erro no Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Ocorreu um erro ao processar seu pagamento via PIX.</p>
            <p className="text-sm text-muted-foreground">Isso pode ter acontecido por diversos motivos:</p>
          </div>

          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
              <p className="text-sm flex-1">Tempo limite para pagamento expirado</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
              <p className="text-sm flex-1">Problema na comunicação com o sistema de pagamento</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
              <p className="text-sm flex-1">Dados bancários incorretos ou inválidos</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/")} className="w-full gap-2 bg-gradient-hero hover:opacity-90" size="lg">
              <Home className="h-4 w-4" />
              Voltar ao Catálogo
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full gap-2" size="lg">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Precisa de ajuda? Entre em contato com nosso{" "}
              <a
                href={`https://wa.me/5581991768142?text=${encodeURIComponent("Olá! Tive um problema com o pagamento PIX.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                suporte via WhatsApp
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
