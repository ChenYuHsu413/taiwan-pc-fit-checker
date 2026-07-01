import type { Metadata } from "next";
import { BuilderClient } from "@/components/BuilderClient";

export const metadata: Metadata = {
  title: "Builder | 台灣版 PC 組裝空間模擬器",
};

export default function BuilderPage() {
  return <BuilderClient />;
}
