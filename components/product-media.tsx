/* eslint-disable @next/next/no-img-element */

import type { ProductImage } from "@/lib/store";

export function ProductMedia({
  image,
  bgClass,
  className,
  imageClassName,
  svgClassName,
  stroke = "rgba(245,168,0,0.15)",
  strokeWidth = 0.5,
}: {
  image: ProductImage;
  bgClass: string;
  className?: string;
  imageClassName?: string;
  svgClassName?: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  return (
    <div className={`${className ?? ""} bg-gradient-to-br ${bgClass}`}>
      {image.imageUrl ? (
        <img
          src={image.imageUrl}
          alt={image.alt}
          className={imageClassName ?? "h-full w-full object-cover"}
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          className={svgClassName ?? "h-20 w-20 opacity-20"}
        >
          <path d={image.iconPath} />
        </svg>
      )}
    </div>
  );
}
