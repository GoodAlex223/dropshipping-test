export const dynamic = "force-dynamic";
import { StatusScreen } from "@/components/common/StatusScreen";
import { system } from "@/content/system";

export default function NotFound() {
  return (
    <StatusScreen
      title={system.notFound.title}
      description={system.notFound.description}
      actions={[{ label: system.notFound.cta, href: "/" }]}
    />
  );
}
