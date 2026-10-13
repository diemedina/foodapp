import { CheckIcon } from "./icons";

export function CheckCircle({ checked, dark = false }: { checked: boolean; dark?: boolean }) {
  return (
    <span
      className={`flex size-[26px] shrink-0 items-center justify-center rounded-full text-white ${
        checked ? (dark ? "bg-ink" : "bg-green") : "border-2 border-ink/20 bg-white/80"
      }`}
    >
      {checked && <CheckIcon className="animate-pop size-3.5" />}
    </span>
  );
}
