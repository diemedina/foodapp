import type { MealId } from "@/lib/types";

type IconProps = { className?: string; strokeWidth?: number };

function Svg({ className, strokeWidth = 2, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "size-5"}
    >
      {children}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 3}>
    <path d="M5 12l5 5 9-10" />
  </Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.2}>
    <path d="M5 12h14M12 5v14" />
  </Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.2}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);
export const ChevronUpIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.2}>
    <path d="M6 15l6-6 6 6" />
  </Svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.2}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
export const HomeIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 1.9}>
    <path d="M3 11l9-7 9 7v8a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2v-8z" />
  </Svg>
);
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 1.9}>
    <rect x="3" y="5" width="18" height="16" rx="4" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);
export const BookIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 1.9}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v16H5.5A1.5 1.5 0 0 0 4 20.5v-16zM4 20.5A1.5 1.5 0 0 0 5.5 22H20M9 8h7M9 12h5" />
  </Svg>
);
export const BagIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 1.9}>
    <path d="M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8L5 8zM9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Svg>
);
export const EditIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />
  </Svg>
);
export const StarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </Svg>
);
export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
  </Svg>
);
export const SwapIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h11M4 7l3-3M4 7l3 3M20 17H9M20 17l-3-3M20 17l-3 3" />
  </Svg>
);
export const SortIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
  </Svg>
);
export const LeftoverIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 1.9}>
    <rect x="3" y="8" width="18" height="12" rx="3" />
    <path d="M3 12h18M8 8V5h8v3" />
  </Svg>
);
export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
export const HistoryIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.4}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2" />
  </Svg>
);
export const FlaskIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4h6M10 4v5L5 19a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2L14 9V4" />
  </Svg>
);

export function MealIcon({ meal, className, strokeWidth = 1.8 }: IconProps & { meal: MealId }) {
  if (meal === "desayuno")
    return (
      <Svg className={className} strokeWidth={strokeWidth}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </Svg>
    );
  if (meal === "almuerzo")
    return (
      <Svg className={className} strokeWidth={strokeWidth}>
        <path d="M7 2v8M5 2v5a2 2 0 0 0 4 0V2M7 10v12M17 22V2c-2 1-3 4-3 7s1 4 3 4" />
      </Svg>
    );
  if (meal === "merienda")
    return (
      <Svg className={className} strokeWidth={strokeWidth}>
        <path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V9zM17 11h1a3 3 0 0 1 0 6h-1.5M8 2v3M12 2v3" />
      </Svg>
    );
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Svg>
  );
}
