'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { intro } from '@/content/journey';
import { HOTLINE, HOTLINE_TEL } from '@/content/offerings';

/**
 * Full-bleed looping film made from real field photos (public/video/hero-1280.mp4,
 * rendered by scripts/render_film.py). Muted, with a pause control, and a still poster
 * for reduced motion.
 */
export function HeroFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section aria-label="Introduction" className="relative h-[calc(100svh-var(--header-h))] min-h-[560px] overflow-hidden bg-teal">
      <video
        ref={video}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/video/hero-1280-poster.jpg"
        aria-hidden
      >
        <source src="/video/hero-1280.mp4" type="video/mp4" />
      </video>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgba(2,43,54,0.9)] via-[rgba(2,43,54,0.35)] to-[rgba(2,43,54,0.1)]" />
      <div aria-hidden className="absolute inset-y-0 left-0 hidden w-[60%] bg-gradient-to-r from-[rgba(2,43,54,0.55)] to-transparent md:block" />

      <div className="container relative flex h-full flex-col justify-end pb-14 md:pb-20">
        <h1 className="hero-rise max-w-[15ch] text-[clamp(2.7rem,6.4vw,5.8rem)] font-bold leading-[1] tracking-[-0.035em] text-white">{intro.title}</h1>
        <p className="hero-rise mt-6 max-w-[36rem] text-lg text-white/85 md:text-[1.35rem] md:leading-relaxed [animation-delay:120ms]">{intro.body}</p>
        <div className="hero-rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:220ms]">
          <a href="#how-it-works" className="btn-lime">
            See how it works
          </a>
          <Link href="#paths" className="btn-on-dark">
            Find your path
          </Link>
          <a href={HOTLINE_TEL} className="ml-1 hidden text-[0.95rem] font-semibold text-white/80 hover:text-lime sm:inline">
            Free hotline {HOTLINE}
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/25 md:bottom-8 md:right-8"
        aria-label={playing ? 'Pause background film' : 'Play background film'}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <rect x="2" y="1.5" width="3.4" height="11" rx="1" fill="currentColor" />
            <rect x="8.6" y="1.5" width="3.4" height="11" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M3 1.8v10.4L12 7z" fill="currentColor" />
          </svg>
        )}
      </button>
    </section>
  );
}

/** A full-bleed photo that drifts slowly behind one statement. */
export function StatementBand({
  photo,
  statement,
  link,
}: {
  photo: string;
  statement: string;
  link: { label: string; href: string };
}) {
  return (
    <section className="relative overflow-hidden bg-teal">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/photos/${photo}-1920.jpg`}
        srcSet={`/photos/${photo}-1080.jpg 1080w, /photos/${photo}-1920.jpg 1920w`}
        sizes="100vw"
        alt=""
        loading="lazy"
        className="kenburns-slow absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-[rgba(2,43,54,0.62)]" />
      <div className="container relative py-28 md:py-40">
        <p className="max-w-[22ch] text-[clamp(2rem,4.4vw,3.9rem)] font-bold leading-[1.08] tracking-[-0.025em] text-white">{statement}</p>
        <Link href={link.href} className="btn-lime mt-10">
          {link.label}
        </Link>
      </div>
    </section>
  );
}
