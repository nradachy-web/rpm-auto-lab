import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About | RPM Auto Lab",
  description:
    "Learn about RPM Auto Lab — our story, values, and commitment to automotive protection excellence in Orion Township, MI.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
