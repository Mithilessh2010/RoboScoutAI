import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function youtubeEmbedUrl(url: string) {
  const direct = url.match(/youtube\.com\/embed\/([^?]+)/)?.[1];
  const watch = url.match(/[?&]v=([^&]+)/)?.[1];
  const short = url.match(/youtu\.be\/([^?]+)/)?.[1];
  const live = url.match(/youtube\.com\/live\/([^?]+)/)?.[1];
  const id = direct ?? watch ?? short ?? live;
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
