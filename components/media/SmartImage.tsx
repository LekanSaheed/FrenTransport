"use client";
import Image, { type ImageProps } from "next/image";
import { cloudinaryLoader, isCloudinaryUrl } from "@/libs/media";

/**
 * next/image that lets Cloudinary resize gallery images (right size, WebP/AVIF)
 * and keeps Next's optimiser for files in /public.
 */
export default function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  return <Image {...props} {...(isCloudinaryUrl(src) && { loader: cloudinaryLoader })} />;
}
