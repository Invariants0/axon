import type { PropsWithChildren } from "react";

export default function Card({ children }: PropsWithChildren) {
  return <div className="rounded border border-slate-200 bg-white p-4">{children}</div>;
}
