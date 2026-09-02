"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

export function PageView({ pageType, productId }: { pageType: "home" | "tools" | "tool"; productId?: string }) {
  useEffect(() => {
    void trackAnalyticsEvent({ eventName: "page_view", productId, metadata: { pageType } });
  }, [pageType, productId]);
  return null;
}
