import { Seo } from "@components/seo/Seo";
import { Breadcrumb } from "@components/seo/Breadcrumb";

type Props = { path: string; title: string; description: string };
export default function SimplePublicPage({ path, title, description }: Props) {
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <Seo path={path} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title }]} />
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}
