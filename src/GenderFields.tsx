import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Gender, InterestedIn } from "./api";

type Choice = { value: string; label: string };
function ChoiceField({
  label,
  value,
  options,
  onChange,
  name,
  hint,
}: {
  label: string;
  value: string;
  options: Choice[];
  onChange?: (value: string) => void;
  name?: string;
  hint?: string;
}) {
  const id = useId();
  const [local, setLocal] = useState(value);
  const selected = onChange ? value : local;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [side, setSide] = useState("below");
  const [room, setRoom] = useState(240);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useEffect(() => {
    if (open)
      list.current
        ?.querySelectorAll<HTMLButtonElement>("button")
        [active]?.focus({ preventScroll: true });
  }, [open, active]);
  function choose(next: string) {
    setLocal(next);
    onChange?.(next);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function show() {
    const bounds = trigger.current?.getBoundingClientRect();
    if (bounds) {
      const below = window.innerHeight - bounds.bottom;
      const above = bounds.top;
      const upwards =
        below < (list.current?.scrollHeight ?? 220) + 16 && above > below;
      setSide(upwards ? "above" : "below");
      setRoom(Math.max(80, (upwards ? above : below) - 24));
    }
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === selected),
      ),
    );
    setOpen(true);
  }
  return (
    <div
      className="choice-field"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <span id={`${id}-label`} className="choice-label">
        {label}
      </span>
      {name && <input type="hidden" name={name} value={selected} />}
      <div className="choice-control">
        <button
          ref={trigger}
          type="button"
          className="choice-trigger"
          role="combobox"
          aria-labelledby={`${id}-label`}
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-haspopup="listbox"
          onClick={() => (open ? setOpen(false) : show())}
          onKeyDown={(e) => {
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              show();
              if (e.key === "Home") setActive(0);
              if (e.key === "End") setActive(options.length - 1);
            }
          }}
        >
          <span>{options.find((o) => o.value === selected)?.label}</span>
          <ChevronDown size={18} />
        </button>
        <div
          ref={list}
          id={`${id}-options`}
          className="choice-options"
          role="listbox"
          aria-labelledby={`${id}-label`}
          aria-hidden={!open}
          data-open={open}
          data-side={side}
          style={{ maxHeight: room }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              trigger.current?.focus();
            }
            if (e.key === "Tab") setOpen(false);
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              setActive((i) =>
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? options.length - 1
                    : (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) %
                      options.length,
              );
            }
          }}
        >
          {options.map((option, i) => (
            <button
              type="button"
              role="option"
              key={option.value}
              aria-selected={selected === option.value}
              tabIndex={open && i === active ? 0 : -1}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {selected === option.value && <Check size={17} />}
            </button>
          ))}
        </div>
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function GenderField({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (value: Gender) => void;
}) {
  return (
    <ChoiceField
      label="Твой пол"
      value={value}
      onChange={(next) => onChange(next as Gender)}
      hint="Используется для подбора, не показывается в анкете."
      options={[
        { value: "unspecified", label: "Не указан" },
        { value: "male", label: "Мужчина" },
        { value: "female", label: "Женщина" },
        { value: "other", label: "Другой" },
      ]}
    />
  );
}
export function InterestedInField({
  value,
  onChange,
}: {
  value: InterestedIn;
  onChange?: (value: InterestedIn) => void;
}) {
  return (
    <ChoiceField
      label="Кого хочешь встретить"
      name="interestedIn"
      value={value}
      onChange={onChange ? (next) => onChange(next as InterestedIn) : undefined}
      options={[
        { value: "all", label: "Всех" },
        { value: "female", label: "Женщин" },
        { value: "male", label: "Мужчин" },
        { value: "other", label: "Людей другого пола" },
      ]}
    />
  );
}
