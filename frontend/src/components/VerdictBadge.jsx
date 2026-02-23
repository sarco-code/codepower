import clsx from "clsx";
import { getVerdictTone } from "../utils/format";

export default function VerdictBadge({ verdict }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        getVerdictTone(verdict)
      )}
    >
      {verdict}
    </span>
  );
}
