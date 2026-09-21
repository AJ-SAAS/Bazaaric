"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Slide = {
  image: string;
  headline: string;
  subtext: string;
  ctaText: string;
  ctaHref: string;
};

type HeroCarouselProps = {
  slides: Slide[];
  autoplayMs?: number;
};

export default function HeroCarousel({ slides, autoplayMs = 4000 }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = () => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, autoplayMs);
    return () => clearInterval(timer);
  }, [next, autoplayMs, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index];

  return (
    <section className="relative h-[360px] md:h-[420px] overflow-hidden rounded-none md:rounded-2xl md:mx-8 md:mt-6">
      <img
        src={slide.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />

      <div className="relative z-10 flex h-full items-center px-6 md:px-16">
        <div className="max-w-sm md:max-w-md text-white">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
            {slide.headline}
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/90">
            {slide.subtext}
          </p>
          <Link
            href={slide.ctaHref}
            className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-gray-100"
          >
            {slide.ctaText}
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-10 hidden md:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-10 hidden md:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}