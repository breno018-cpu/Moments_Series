import axios from "axios";

async function testWhatsAppGateway() {
  const baseURL = "http://localhost:3000";
  const apiKey = "pxl_master_08a16f5e64dabd5d12af10644f22ada83fe46206272d093d";
  const sessionId = "OPE-01";
  const phone = "37999323791";

  console.log(`[TESTE] Conectando ao WhatsApp Gateway em ${baseURL}...`);
  console.log(`[TESTE] Disparando simulação de compra aprovada para o número: ${phone}`);

  const payload = {
    sessionId,
    event: "PAYMENT_APPROVED",
    customerName: "Lauren / Teste Moments",
    customerPhone: phone,
    orderId: "TEST-" + Math.floor(100000 + Math.random() * 900000),
    totalAmount: 19.90,
    items: [
      "Série Teste VIP: https://moments.app.br/serie/exemplo-acesso-vip",
      "Episódios 1 ao 12 em Alta Definição: https://moments.app.br/acesso/player?token=demo123"
    ],
    trackingUrl: "https://moments.app.br/acesso/player?token=demo123",
    customMessage: "🎉 Olá Lauren! Seu pagamento teste de R$ 19,90 foi aprovado com sucesso no Moments Séries!\n\n🍿 *Seu link de acesso exclusivo à série está liberado:* https://moments.app.br/acesso/player?token=demo123\n\nAproveite e assista direto no seu celular ou navegador!",
    labels: ["Já Comprou", "Cliente Ativo", "Teste Simulação"]
  };

  try {
    const res = await axios.post(`${baseURL}/api/sales/notify`, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      timeout: 10000
    });

    console.log("\n✅ [SUCESSO] Resposta do WhatsApp Gateway:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error("\n❌ [RESPOSTA DE ERRO DO SERVIDOR]:", error.response.status, error.response.data);
    } else {
      console.error("\n❌ [ERRO DE CONEXÃO]:", error.message);
    }
  }
}

testWhatsAppGateway();
