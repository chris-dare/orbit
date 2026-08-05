"use client";

import { Menu } from "@base-ui/react/menu";
import { models } from "@/lib/mock";
import { IconCheck, IconChevronDown } from "./icons";

export function ModelSwitcher({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const active = models.find((m) => m.id === value) ?? models[0];

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Model: ${active.name}. Change model`}
        className="flex items-center gap-1 h-8 px-2 rounded-full text-[13.5px] font-medium text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.07] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
      >
        {active.name}
        <IconChevronDown className="w-[13px] h-[13px] text-[var(--text-tertiary)]" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="top" align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="min-w-[248px] p-1 rounded-[14px] bg-[var(--surface)] border border-[var(--border)] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.28)] outline-none origin-[var(--transform-origin)] transition-[opacity,transform] duration-150 ease-out data-closed:opacity-0 data-closed:scale-95 data-open:opacity-100 data-open:scale-100">
            <Menu.RadioGroup value={value} onValueChange={(v) => onChange(v as string)}>
              {models.map((m) => (
                <Menu.RadioItem
                  key={m.id}
                  value={m.id}
                  closeOnClick
                  className="flex items-start gap-2.5 px-2.5 py-2 rounded-[10px] cursor-default select-none outline-none data-highlighted:bg-black/[0.045] dark:data-highlighted:bg-white/[0.07]"
                >
                  <span className="w-[15px] shrink-0 pt-[3px]">
                    <Menu.RadioItemIndicator>
                      <IconCheck className="w-[13px] h-[13px] text-[var(--accent)]" />
                    </Menu.RadioItemIndicator>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium text-[var(--text-primary)]">
                      {m.name}
                    </span>
                    <span className="block text-[12px] leading-snug text-[var(--text-tertiary)]">
                      {m.description}
                    </span>
                  </span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
