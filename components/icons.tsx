type IconProps = {
  size?: number;
  className?: string;
};

function base(props: IconProps) {
  return {
    width: props.size ?? 20,
    height: props.size ?? 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: props.className,
    "aria-hidden": true,
  };
}

export function IconSearch(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconBook(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconHome(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
    </svg>
  );
}

export function IconCart(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M3 4h2l2.6 12h10.8L21 8H6" />
    </svg>
  );
}

export function IconBack(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M19 12H5m6-7-7 7 7 7" />
    </svg>
  );
}

export function IconTrash(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 7h16M9 7V5h6v2m-9 0 1 13h10l1-13" />
    </svg>
  );
}

export function IconPencil(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20h4L20 8l-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

export function IconCamera(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

export function IconLogout(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M14 4H6v16h8" />
      <path d="M10 12h10m-3.5-3.5L20 12l-3.5 3.5" />
    </svg>
  );
}

export function IconPot(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 10h14v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
      <path d="M3 10h18M9 6.5c0-1.5 6-1.5 6 0" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m5 13 4.5 4.5L19 7" />
    </svg>
  );
}

export function IconStar({
  size = 20,
  className,
  filled,
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  );
}
