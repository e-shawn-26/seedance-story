"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GENERATION_GUARD_EVENT,
  readGenerationGuardState
} from "@/lib/generation-guard";

const links = [
  { href: "/", label: "首页" },
  { href: "/gallery", label: "画廊" }
];

export function Navbar() {
  const [generationActive, setGenerationActive] = useState(false);

  useEffect(() => {
    function syncState() {
      setGenerationActive(readGenerationGuardState().active);
    }

    function handleStorage(event: StorageEvent) {
      if (event.storageArea === window.sessionStorage) {
        syncState();
      }
    }

    syncState();
    window.addEventListener(GENERATION_GUARD_EVENT, syncState);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(GENERATION_GUARD_EVENT, syncState);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold text-white">
          🎬 AI短剧
        </Link>
        <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          {links.map((link) =>
            link.href === "/gallery" && generationActive ? (
              <span
                key={link.href}
                aria-disabled="true"
                title="生成完成后再查看"
                className="cursor-not-allowed rounded-full px-4 py-2 text-sm text-white/35"
              >
                {link.label}
              </span>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
