import React from "react";
import { Target } from "lucide-react";

type Variant = "info" | "danger";

const variantMap: Record<
  Variant,
  {
    wrapper: string;
    iconBg?: string;
    iconColor?: string;
    border: string;
    bg: string;
  }
> = {
  info: {
    wrapper: "border-primary/20 bg-primary/5",
    iconBg: undefined,
    iconColor: "text-primary",
    border: "border-primary/20",
    bg: "bg-primary/5",
  },
  danger: {
    wrapper: "border-rose-400 bg-rose-50",
    iconBg: undefined,
    iconColor: "text-rose-600",
    border: "border-rose-400",
    bg: "bg-rose-50",
  },
};

export function NoticeCard({
  variant = "info",
  icon,
  title,
  subtitle,
  children,
}: {
  variant?: Variant;
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const v = variantMap[variant];
  return (
    <div className={`${v.wrapper} border rounded-md`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-md flex items-center justify-center">
              {/* если передан icon — рендерим его, иначе пустой Target */}
              <span className={v.iconColor}>
                {icon ?? <Target className="h-5 w-5" />}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{subtitle}</div>
            <div className="mt-1 text-base font-semibold leading-tight text-foreground">
              {title}
            </div>

            {children && (
              <div className="mt-3 text-sm text-muted-foreground">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
