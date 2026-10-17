import { seriesData } from "@/data/series";

const FIRST_NAMES = [
  "Ana", "Carlos", "Maria", "João", "Fernanda", "Pedro", "Juliana", "Lucas",
  "Camila", "Rafael", "Beatriz", "Diego", "Larissa", "Bruno", "Natália",
];

// Generate deterministic fake reviews per series
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export interface FakeReview {
  name: string;
  rating: number;
  text: string;
  daysAgo: number;
}

const REVIEW_TEXTS = [
  "Incrível! Cada episódio melhor que o anterior.",
  "Não consegui parar de assistir, maratonei tudo!",
  "Produção impecável, super recomendo.",
  "A melhor série que vi esse ano, sem dúvidas.",
  "Superou todas as expectativas. Vale cada centavo!",
  "Enredo envolvente do início ao fim.",
  "Qualidade cinematográfica absurda.",
  "Comprei sem pensar e não me arrependi!",
  "Já recomendei pra toda minha família.",
  "Entretenimento de altíssima qualidade.",
];

export function getReviewsForSerie(serieId: string): FakeReview[] {
  const h = hashCode(serieId);
  const count = 2 + (h % 3); // 2-4 reviews
  const reviews: FakeReview[] = [];

  for (let i = 0; i < count; i++) {
    const idx = (h + i * 7) % FIRST_NAMES.length;
    const textIdx = (h + i * 13) % REVIEW_TEXTS.length;
    reviews.push({
      name: FIRST_NAMES[idx],
      rating: 4 + ((h + i) % 2), // 4 or 5
      text: REVIEW_TEXTS[textIdx],
      daysAgo: 1 + ((h + i * 3) % 14),
    });
  }

  return reviews;
}

export function getBuyerCount(serieId: string): string {
  const serie = seriesData.find((s) => s.id === serieId);
  if (!serie) return "0";
  // Show a slightly inflated "last 24h" count
  const h = hashCode(serieId);
  const recent = 15 + (h % 45);
  return `${recent}`;
}

export function isTopSeller(serieId: string): boolean {
  const serie = seriesData.find((s) => s.id === serieId);
  return !!serie && serie.vendas_count >= 2000;
}
