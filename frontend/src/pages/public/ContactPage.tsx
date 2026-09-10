import { Seo } from "@components/seo/Seo";
import { Breadcrumb } from "@components/seo/Breadcrumb";
import { MapEmbed } from "@components/common/MapEmbed";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <Seo path="/contact" />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <h1 className="text-3xl font-semibold">Contact FinGuard Support</h1>
      <p className="text-slate-600">Email, chat, or phone. We are here to help integrate default risk prediction.</p>
      <MapEmbed />
    </div>
  );
}
