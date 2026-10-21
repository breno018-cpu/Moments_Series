import series1 from "@/assets/series-1.jpg";
import series2 from "@/assets/series-2.jpg";
import series3 from "@/assets/series-3.jpg";
import series4 from "@/assets/series-4.jpg";
import series5 from "@/assets/series-5.jpg";
import series6 from "@/assets/series-6.jpg";
import heroSeries from "@/assets/hero-series.jpg";

export interface Series {
  id: string;
  title: string;
  genre: string;
  year: number;
  rating: number;
  description: string;
  longDescription: string;
  image: string;
  trailer: string;
  price: number;
  seasons: number;
  episodes: number;
}

export const seriesData: Series[] = [
  {
    id: "1",
    title: "Sombras do Destino",
    genre: "Fantasia Sombria",
    year: 2024,
    rating: 9.2,
    description: "Uma jornada épica através de um mundo onde magia e mistério se entrelaçam.",
    longDescription: "Em um reino onde as sombras escondem segredos ancestrais, um herói improvável deve desvendar os mistérios de seu próprio destino. Entre tempestades místicas e profecias esquecidas, cada escolha pode mudar o curso da história. Uma saga épica que mistura fantasia sombria com elementos de suspense psicológico.",
    image: heroSeries,
    trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    price: 49.90,
    seasons: 3,
    episodes: 24,
  },
  {
    id: "2",
    title: "Neon Futures",
    genre: "Ficção Científica",
    year: 2024,
    rating: 8.8,
    description: "Um futuro cyberpunk onde a tecnologia redefine a humanidade.",
    longDescription: "Em uma metrópole futurista banhada em luzes de neon, hackers e corporações travam uma guerra silenciosa pelo controle da informação. Quando um desenvolvedor descobre um código que pode mudar tudo, ele se vê preso em uma conspiração que questiona a própria natureza da consciência humana.",
    image: series1,
    trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    price: 44.90,
    seasons: 2,
    episodes: 16,
  },
  {
    id: "3",
    title: "Cidade das Sombras",
    genre: "Crime e Suspense",
    year: 2024,
    rating: 9.0,
    description: "Um detetive investiga crimes que desafiam a lógica nas ruas sombrias da cidade.",
    longDescription: "Nas ruas mais obscuras da metrópole, onde a lei mal alcança, um detetive veterano persegue um serial killer que parece estar sempre um passo à frente. Entre becos escuros e segredos enterrados, ele descobre que alguns crimes escondem verdades que vão além da imaginação.",
    image: series2,
    trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    price: 39.90,
    seasons: 4,
    episodes: 32,
  },
  {
    id: "4",
    title: "Corações em Chamas",
    genre: "Romance e Drama",
    year: 2023,
    rating: 8.5,
    description: "Uma história de amor impossível que desafia o tempo e as circunstâncias.",
    longDescription: "Duas almas destinadas a se encontrarem em diferentes momentos da vida. Entre encontros e despedidas, eles descobrem que o amor verdadeiro pode superar qualquer obstáculo. Uma narrativa emocionante que explora os desafios das relações modernas com sensibilidade e profundidade.",
    image: series3,
    trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    price: 34.90,
    seasons: 2,
    episodes: 20,
  },
  {
    id: "5",
    title: "A Casa Maldita",
    genre: "Terror",
    year: 2024,
    rating: 8.7,
    description: "Segredos macabros espreitam nas paredes de uma mansão abandonada.",
    longDescription: "Uma família se muda para uma mansão vitoriana aparentemente perfeita, sem saber que ela abriga horrores inimagináveis. À medida que eventos inexplicáveis começam a ocorrer, eles descobrem que a casa tem vontade própria e não pretende deixá-los partir.",
    image: series4,
    trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    price: 42.90,
    seasons: 1,
    episodes: 10,
  },
  {
    id: "6",
    title: "Operação Extrema",
    genre: "Ação",
    year: 2024,
    rating: 8.9,
    description: "Missões impossíveis, explosões épicas e adrenalina pura.",
    longDescription: "Uma equipe de elite é chamada para missões que outros consideram impossíveis. Com explosões espetaculares, cenas de ação coreografadas e reviravoltas inesperadas, cada episódio é uma montanha-russa de adrenalina que mantém o espectador no limite da cadeira.",
    image: series5,
    trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    price: 46.90,
    seasons: 3,
    episodes: 30,
  },
  {
    id: "7",
    title: "Risadas na Cidade",
    genre: "Comédia",
    year: 2024,
    rating: 8.3,
    description: "O cotidiano hilário de amigos vivendo aventuras urbanas.",
    longDescription: "Acompanhe um grupo de amigos inseparáveis enquanto navegam pelos desafios da vida adulta na cidade grande. Entre situações cômicas, mal-entendidos hilários e momentos de verdadeira amizade, esta série prova que às vezes a melhor terapia é uma boa risada.",
    image: series6,
    trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    price: 29.90,
    seasons: 5,
    episodes: 50,
  },
];
