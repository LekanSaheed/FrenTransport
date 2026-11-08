"use client";
import React from "react";
import { AdminPage } from "@/components/admin/ui";
import MediaLibrary from "@/components/media/MediaLibrary";

export default function GalleryPage() {
  return (
    <AdminPage
      title="Gallery"
      description="Images stored on Cloudinary. Upload here or from any image field; pages load automatically resized copies. Images in use can't be deleted."
    >
      <MediaLibrary mode="manage" />
    </AdminPage>
  );
}
