import type { Metadata } from "next";
import { getInspiredByConfig } from "@/lib/services/catalog";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { updateInspiredSettingsAction } from "../../actions";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const config = await getInspiredByConfig();

  return (
    <>
      <PageHeader title="Settings" />
      <Panel title="“Inspired by” labels" className="max-w-2xl">
        <p className="mb-5 text-sm text-stone">
          Controls the comparison labels shown on product cards and pages. Turning this off hides every reference to
          third-party brands immediately — no redeploy needed.
        </p>
        <ActionForm action={updateInspiredSettingsAction} submitLabel="Save settings" className="space-y-5">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="globalEnabled" defaultChecked={config.globalEnabled} className="mt-1 accent-ink" />
            <span>
              <span className="font-medium text-ink">Show “inspired by” labels</span>
              <span className="block text-xs text-stone">Applies to every product across the store</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="showImages" defaultChecked={config.showImages} className="mt-1 accent-ink" />
            <span>
              <span className="font-medium text-ink">Show inspiration imagery</span>
              <span className="block text-xs text-stone">Only proprietary RYZ imagery should ever be uploaded</span>
            </span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Label text</span>
            <input
              name="labelOverride"
              defaultValue={config.labelOverride}
              maxLength={40}
              required
              className="field-input mt-1.5 max-w-xs rounded-md py-2 uppercase"
            />
          </label>
        </ActionForm>
      </Panel>
    </>
  );
}
