import { formatGhs } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD_PESEWAS } from "@/lib/shipping";

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-ivory">
      <div className="container-page flex h-9 items-center justify-center gap-6 text-[11px] tracking-wide">
        <span>
          <span className="text-brand-gold">Cash on Delivery</span> nationwide
        </span>
        <span aria-hidden="true" className="hidden h-3 w-px bg-ivory/20 sm:block" />
        <span className="hidden sm:inline">
          Free delivery on orders over {formatGhs(FREE_SHIPPING_THRESHOLD_PESEWAS).replace(".00", "")}
        </span>
      </div>
    </div>
  );
}
