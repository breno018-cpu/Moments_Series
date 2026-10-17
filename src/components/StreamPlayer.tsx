import { useState } from "react";

interface StreamPlayerProps {
  url: string;
  title?: string;
  className?: string;
}

// Integrated player. Renders an iframe (UpCloud embed) inside the site,
// never opening a new tab. Isolated via sandbox for safety.
export const StreamPlayer = ({ url, title, className }: StreamPlayerProps) => {
  const [loaded, setLoaded] = useState(false);

  if (!url) {
    return (
      <div className={"aspect-video w-full bg-black/60 flex items-center justify-center text-white/60 text-sm " + (className ?? "")}>
        Nenhuma URL de streaming configurada.
      </div>
    );
  }

  return (
    <div className={"relative aspect-video w-full bg-black overflow-hidden rounded-lg " + (className ?? "")}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm animate-pulse">
          Carregando player…
        </div>
      )}
      <iframe
        src={url}
        title={title ?? "Stream"}
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default StreamPlayer;
