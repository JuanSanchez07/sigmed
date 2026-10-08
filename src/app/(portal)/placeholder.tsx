export default function Placeholder({
  title,
  description,
  tasks,
}: {
  title: string;
  description: string;
  tasks: string[];
}) {
  return (
    <section className="flex flex-col gap-5 rounded-lg border border-dashed border-zinc-300 bg-white p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-zinc-600">{description}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li key={task} className="flex items-start gap-2.5 text-sm text-zinc-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
            {task}
          </li>
        ))}
      </ul>

      <p className="text-xs uppercase tracking-wide text-zinc-400">
        Placeholder · sin implementar
      </p>
    </section>
  );
}
