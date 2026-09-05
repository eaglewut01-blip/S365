import { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import clsx from "clsx";

const fieldClasses =
  "w-full rounded-lg border border-border bg-panel-raised px-3 py-2 font-body text-[13.5px] text-text-hi outline-none placeholder:text-text-faint";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(fieldClasses, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(fieldClasses, "cursor-pointer", props.className)} />;
}
