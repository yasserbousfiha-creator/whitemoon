"use client";

import { Play } from "lucide-react";
import { useState } from "react";

// A branch tour shown in place: the still with a play button, and the video only loads once someone taps it.
export default function BranchVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="mx-auto mt-3 aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-xl border border-line/25 bg-night2">
      {playing ? (
        <video src={src} poster={poster} controls autoPlay playsInline className="h-full w-full object-cover" />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={label}
          className="group relative block h-full w-full"
          style={{
            backgroundImage: `url(${poster})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
          <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold-bright/90 shadow-lg transition-transform group-hover:scale-110">
            <Play size={28} className="translate-x-0.5 fill-night2 text-night2" />
          </span>
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-sm font-bold text-white">
            {label}
          </span>
        </button>
      )}
    </div>
  );
}
