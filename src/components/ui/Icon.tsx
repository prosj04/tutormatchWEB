import { icon, type IconName } from "@/lib/icons";

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function Icon({ name, size = 24, strokeWidth, className }: IconProps) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center" }}
      dangerouslySetInnerHTML={{ __html: icon(name, { size, strokeWidth }) }}
    />
  );
}
