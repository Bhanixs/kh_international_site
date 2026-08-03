export function SmallList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[11px] tracking-[0.3em] text-forest uppercase">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-3 items-center">
            <span className="text-gold">—</span>
            <div className="font-bold underline text-lg">{item}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}