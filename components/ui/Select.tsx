"use client";
import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/libs/utils";

/*
 * Custom select (no library). Follows the WAI-ARIA "select-only combobox"
 * pattern: focus stays on the trigger button, the highlighted option is
 * announced through aria-activedescendant, and the list opens in a portal so
 * it is never clipped by overflow:hidden parents (tables, modals, cards).
 *
 * Options can be given as data (`options`) or as the same <option>/<optgroup>
 * children a native <select> takes, so it is a drop-in replacement.
 */

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  /** Shown in the closed trigger instead of `label` (e.g. "Lagos — Ikeja Terminal"). */
  selectedLabel?: React.ReactNode;
  /** Plain text used for type-ahead when `label` isn't a string. */
  textValue?: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

/** A flat list, a list of groups, or a mix of both. */
export type SelectItems = (SelectOption | SelectGroup)[];

export const isGroup = (item: SelectOption | SelectGroup): item is SelectGroup => "options" in item;

export interface SelectProps {
  id?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  options?: SelectItems;
  children?: React.ReactNode;
  /** Same shape as a native select's change event: `e.target.value` holds the new value. */
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  placeholder?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/* ------------------------------ option parsing ----------------------------- */

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** Turns <option>/<optgroup> children (arrays and fragments included) into items. */
function parseChildren(children: React.ReactNode): SelectItems {
  const items: SelectItems = [];
  const visit = (nodes: React.ReactNode, into: SelectItems | SelectOption[]) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return;
      const props = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean; label?: string };
      if (child.type === React.Fragment) return visit(props.children, into);
      if (child.type === "option") {
        const text = textOf(props.children);
        (into as SelectOption[]).push({ value: String(props.value ?? text), label: text, disabled: props.disabled });
      } else if (child.type === "optgroup" && into === items) {
        const options: SelectOption[] = [];
        visit(props.children, options);
        items.push({ label: props.label ?? "", options });
      }
    });
  };
  visit(children, items);
  return items;
}

/* ---------------------------------- select --------------------------------- */

export function Select({
  id,
  name,
  value: valueProp,
  defaultValue,
  options,
  children,
  onChange,
  onValueChange,
  placeholder = "Select…",
  disabled,
  required,
  invalid,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SelectProps) {
  const autoId = useId();
  const baseId = id ?? `select-${autoId.replace(/:/g, "")}`;
  const listId = `${baseId}-list`;

  const items = useMemo(() => options ?? parseChildren(children), [options, children]);
  const flat = useMemo(() => items.flatMap((i) => (isGroup(i) ? i.options : [i])), [items]);

  const [inner, setInner] = useState(String(defaultValue ?? ""));
  const value = valueProp !== undefined ? String(valueProp) : inner;
  const selected = flat.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const enabledIndex = (from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < flat.length; i += step) if (!flat[i]!.disabled) return i;
    return -1;
  };

  const show = useCallback(
    (highlight?: "first" | "last") => {
      if (disabled) return;
      const current = flat.findIndex((o) => o.value === value);
      setActive(
        highlight === "first" ? enabledIndex(0, 1) : highlight === "last" ? enabledIndex(flat.length - 1, -1) : current >= 0 ? current : enabledIndex(0, 1),
      );
      setOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, flat, value],
  );

  const hide = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  function choose(option: SelectOption | undefined) {
    if (!option || option.disabled) return;
    hide();
    if (option.value === value) return;
    if (valueProp === undefined) setInner(option.value);
    onValueChange?.(option.value);
    if (onChange) {
      const target = { value: option.value, name: name ?? "", id: baseId } as HTMLSelectElement;
      onChange({ target, currentTarget: target } as React.ChangeEvent<HTMLSelectElement>);
    }
  }

  function typeAhead(char: string) {
    const now = Date.now();
    const t = typeahead.current;
    t.text = now - t.at > 600 ? char : t.text + char;
    t.at = now;
    const query = t.text.toLowerCase();
    const start = open ? active + 1 : flat.findIndex((o) => o.value === value) + 1;
    const ordered = [...flat.slice(start), ...flat.slice(0, start)];
    const match = ordered.find((o) => !o.disabled && (o.textValue ?? textOf(o.label)).toLowerCase().startsWith(query));
    if (!match) return;
    const index = flat.indexOf(match);
    if (open) setActive(index);
    else choose(match);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    const k = e.key;
    if (!open) {
      if (k === "ArrowDown" || k === "Enter" || k === " ") return e.preventDefault(), show();
      if (k === "ArrowUp") return e.preventDefault(), show();
      if (k === "Home") return e.preventDefault(), show("first");
      if (k === "End") return e.preventDefault(), show("last");
      if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(k);
      return;
    }
    if (k === "ArrowDown") return e.preventDefault(), setActive((i) => (enabledIndex(i + 1, 1) === -1 ? i : enabledIndex(i + 1, 1)));
    if (k === "ArrowUp") return e.preventDefault(), setActive((i) => (enabledIndex(i - 1, -1) === -1 ? i : enabledIndex(i - 1, -1)));
    if (k === "Home") return e.preventDefault(), setActive(enabledIndex(0, 1));
    if (k === "End") return e.preventDefault(), setActive(enabledIndex(flat.length - 1, -1));
    if (k === "PageDown") return e.preventDefault(), setActive((i) => enabledIndex(Math.min(i + 8, flat.length - 1), -1));
    if (k === "PageUp") return e.preventDefault(), setActive((i) => enabledIndex(Math.max(i - 8, 0), 1));
    if (k === "Enter" || k === " ") return e.preventDefault(), choose(flat[active]);
    if (k === "Escape") return e.preventDefault(), hide();
    if (k === "Tab") return hide(false);
    if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(k);
  }

  // Close on outside press.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) hide(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, hide]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector(`#${CSS.escape(`${baseId}-opt-${active}`)}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, baseId]);

  // Disabled while open (e.g. the "To" list waiting for "From"): close it.
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const isEmpty = !selected || selected.value === "";
  const display = selected ? (selected.selectedLabel ?? selected.label) : placeholder;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${baseId}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-[12px] border border-border-stroke bg-white pr-3 pl-3.5 text-left text-[14.5px] font-medium text-black outline-none transition",
          "hover:border-gray-300 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-gray-400",
          open && "border-primary ring-4 ring-primary/10",
          invalid && "border-red-400",
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", isEmpty && "text-gray-400")}>{display}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200", open && "rotate-180 text-primary")}>
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Lets native form validation (required) and FormData (name) work. */}
      {(required || name) && (
        <input
          tabIndex={-1}
          aria-hidden
          name={name}
          required={required}
          value={value}
          onChange={() => undefined}
          onFocus={() => triggerRef.current?.focus()}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
        />
      )}

      {open && (
        <Listbox
          anchor={triggerRef}
          listRef={listRef}
          id={listId}
          baseId={baseId}
          items={items}
          flat={flat}
          value={value}
          active={active}
          labelledBy={ariaLabelledBy ?? baseId}
          onHover={setActive}
          onChoose={choose}
        />
      )}
    </div>
  );
}

/* ---------------------------------- listbox -------------------------------- */

const MAX_HEIGHT = 300;
const GAP = 6;

function Listbox({
  anchor,
  listRef,
  id,
  baseId,
  items,
  flat,
  value,
  active,
  labelledBy,
  onHover,
  onChoose,
}: {
  anchor: React.RefObject<HTMLButtonElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  id: string;
  baseId: string;
  items: SelectItems;
  flat: SelectOption[];
  value: string;
  active: number;
  labelledBy: string;
  onHover: (i: number) => void;
  onChoose: (o: SelectOption) => void;
}) {
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);

  // Fixed positioning next to the trigger; opens upwards when there's no room below.
  useLayoutEffect(() => {
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - GAP - 8;
      const above = r.top - GAP - 8;
      const up = below < Math.min(MAX_HEIGHT, 200) && above > below;
      const width = Math.max(r.width, 200);
      const left = Math.min(r.left, window.innerWidth - width - 8);
      setPos(
        up
          ? { left, width, bottom: window.innerHeight - r.top + GAP, maxHeight: Math.min(MAX_HEIGHT, above) }
          : { left, width, top: r.bottom + GAP, maxHeight: Math.min(MAX_HEIGHT, below) },
      );
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor]);

  let index = -1;
  const renderOption = (o: SelectOption, inGroup: boolean) => {
    const i = ++index;
    const isSelected = o.value === value;
    return (
      <div
        key={`${o.value}-${i}`}
        id={`${baseId}-opt-${i}`}
        role="option"
        aria-selected={isSelected}
        aria-disabled={o.disabled || undefined}
        onMouseDown={(e) => e.preventDefault()} // keep focus on the trigger
        onMouseMove={() => !o.disabled && i !== active && onHover(i)}
        onClick={() => onChoose(o)}
        className={cn(
          "flex cursor-pointer items-center justify-between gap-3 rounded-[10px] py-2.5 pr-3 text-[14px] transition-colors",
          inGroup ? "pl-6" : "pl-3",
          i === active && !o.disabled && "bg-tertiary text-primary",
          isSelected ? "font-bold text-primary" : "font-medium text-black",
          o.disabled && "cursor-not-allowed text-gray-300",
        )}
      >
        <span className="min-w-0 flex-1">{o.label}</span>
        {isSelected && (
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-accent">
            <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      ref={listRef}
      id={id}
      role="listbox"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      style={pos ? { position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight } : { position: "fixed", visibility: "hidden" }}
      className={cn(
        "select-pop z-[1000] overflow-y-auto overscroll-contain rounded-[14px] border border-border-stroke bg-white p-1.5 shadow-lift",
        pos?.bottom !== undefined && "origin-bottom",
      )}
    >
      {flat.length === 0 && <p className="px-3 py-2.5 text-[13.5px] text-gray-400">No options</p>}
      {items.map((item, gi) =>
        isGroup(item) ? (
          <div key={`g-${gi}`} role="group" aria-labelledby={`${baseId}-grp-${gi}`} className="[&+*]:mt-1">
            <div
              id={`${baseId}-grp-${gi}`}
              role="presentation"
              className="sticky -top-1.5 z-[1] flex items-center gap-2 bg-white px-3 pt-2.5 pb-1.5 text-[10.5px] font-extrabold tracking-[0.12em] text-gray-500 uppercase"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
              {item.label}
            </div>
            {item.options.map((o) => renderOption(o, true))}
          </div>
        ) : (
          renderOption(item, false)
        ),
      )}
    </div>,
    document.body,
  );
}
