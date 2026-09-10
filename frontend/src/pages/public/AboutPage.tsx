import { Seo } from "@components/seo/Seo";
import { Breadcrumb } from "@components/seo/Breadcrumb";
import { MapEmbed } from "@components/common/MapEmbed";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <Seo path="/about" />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="text-3xl font-semibold">About FinGuard</h1>
      <p className="text-slate-600">We build AI for smarter lending. Founded on Home Credit data science, now in production.</p>
      <MapEmbed showDetails={false} />
    </div>
  );
}
