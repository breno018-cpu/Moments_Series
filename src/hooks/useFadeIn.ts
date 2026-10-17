import { useEffect, useRef } from "react";

export const useFadeIn = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Safety: if IntersectionObserver never fires (very tall sections),
    // reveal the section anyway.
    const fallback = setTimeout(() => el.classList.add("visible"), 1200);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -5% 0px" }
    );

    observer.observe(el);
    return () => { clearTimeout(fallback); observer.disconnect(); };
  }, []);

  return ref;
};
