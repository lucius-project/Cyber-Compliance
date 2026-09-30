import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateRemediationStatus } from "@/lib/actions/remediation";

const OPEN_STATUSES = ["OPEN", "IN_PROGRESS", "BLOCKED"];

/** One-click completion for an open remediation item; renders nothing once it's closed. */
export function MarkDoneButton({ remediationId, status }: { remediationId: string; status: string }) {
  if (!OPEN_STATUSES.includes(status)) return null;
  return (
    <form action={updateRemediationStatus.bind(null, remediationId, "COMPLETED")}>
      <Button type="submit" variant="outline" size="sm">
        <Check /> Mark done
      </Button>
    </form>
  );
}
