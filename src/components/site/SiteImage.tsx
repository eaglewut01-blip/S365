import Image from "next/image";
import type { CSSProperties } from "react";
import type { SitePhoto } from "@/lib/site-content";

// One image component for both kinds of photo: built-in ones get a blur
// placeholder, uploaded ones use the dimensions stored with the upload.
export function SiteImage({
  photo,
  fill,
  sizes,
  className,
  preload,
  style,
}: {
  photo: SitePhoto;
  fill?: boolean;
  sizes: string;
  className?: string;
  preload?: boolean;
  style?: CSSProperties;
}) {
  const position = photo.position ? { objectPosition: photo.position } : undefined;
  const common = { sizes, className, preload, style: { ...position, ...style } };

  if (typeof photo.src !== "string") {
    return fill ? (
      <Image src={photo.src} alt={photo.alt} fill placeholder="blur" {...common} />
    ) : (
      <Image src={photo.src} alt={photo.alt} placeholder="blur" {...common} />
    );
  }
  return fill ? (
    <Image src={photo.src} alt={photo.alt} fill {...common} />
  ) : (
    <Image src={photo.src} alt={photo.alt} width={photo.width ?? 1200} height={photo.height ?? 1200} {...common} />
  );
}
