type DefaultAvatarProps = {
  size?: number;
  className?: string;
};

export function DefaultAvatar({ size = 40, className = "" }: DefaultAvatarProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className="h-3/5 w-3/5"
        role="img"
      >
        <circle cx="20" cy="14" r="7" fill="currentColor" />
        <path
          d="M8 34c1.4-7.2 6-11 12-11s10.6 3.8 12 11"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
