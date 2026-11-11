"use client";
import { ExternalLink, Play, RefreshCw, Youtube } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import { api, type VideoSuggestions } from "@/lib/api";
import { persistentStore } from "@/lib/store";
import { todayISO } from "@/lib/utils";

interface VideoItem {
  id: string;
  title: string;
  channel?: string;
  why?: string;
  pinned?: boolean;
}

const cache = persistentStore<Record<string, VideoSuggestions>>("studyroom:v3:videos", {});

export function Videos({ courseId, moduleId, pinned }: { courseId: string; moduleId: string; pinned: { youtubeId: string; title: string; note: string }[] }) {
  const key = `${courseId}/${moduleId}`;
  const [daily, setDaily] = useState<VideoSuggestions | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const box = useRef<HTMLDivElement>(null);

  const load = async (force = false) => {
    const hit = cache.get()[key];
    if (!force && hit?.date === todayISO()) return setDaily(hit);
    setState("loading");
    try {
      const res = await api.videos(courseId, moduleId);
      setDaily(res);
      if (res.source === "gemini") cache.set((c) => ({ ...c, [key]: { ...res, date: todayISO() } }));
      setState("idle");
    } catch {
      setState("error");
    }
  };

  // Fetch only once the section scrolls into view (saves the AI quota).
  useEffect(() => {
    setDaily(null);
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        void load();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const items: VideoItem[] = [
    ...pinned.map((p) => ({ id: p.youtubeId, title: p.title, why: p.note, pinned: true })),
    ...(daily?.videos ?? []).map((v) => ({ id: v.video_id, title: v.title, channel: v.channel, why: v.why })),
  ];

  return (
    <div ref={box} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-2">
        <span>
          {daily?.source === "gemini" ? `Today's picks (${daily.date}) — found by AI, links verified.` : "Fresh picks are chosen by AI every day."}
        </span>
        {state === "loading" ? (
          <span className="inline-flex items-center gap-2 text-muted">
            <Spinner /> Finding today&apos;s videos…
          </span>
        ) : (
          state === "error" && (
            <Button size="sm" variant="ghost" onClick={() => load(true)}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          )
        )}
      </div>
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((v) => (
            <VideoCard key={v.id} v={v} />
          ))}
        </div>
      )}
      {daily && (
        <a href={daily.search_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
          <Youtube className="size-4" /> Search YouTube for “{daily.search_query}” <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}

function VideoCard({ v }: { v: VideoItem }) {
  const [playing, setPlaying] = useState(false);
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-sunk">
        {playing ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label={`Play ${v.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" className="size-full object-cover" loading="lazy" />
            <span className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/25">
              <span className="grid size-14 place-items-center rounded-full bg-white/95 text-ink shadow-lg">
                <Play className="size-6 translate-x-0.5 fill-current" />
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm leading-snug font-semibold">{v.title}</p>
          {v.pinned && <span className="rounded-full bg-sunk px-2 py-0.5 text-[10px] font-semibold text-muted">Pinned</span>}
        </div>
        {v.channel && <p className="mt-0.5 text-xs text-muted">{v.channel}</p>}
        {v.why && <p className="mt-2 text-[13px] text-ink-2">{v.why}</p>}
      </div>
    </Card>
  );
}
