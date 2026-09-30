interface UsageExampleProps {
  code: string;
  label: string;
}

export function UsageExample({ code, label }: UsageExampleProps) {
  return (
    <details className="border-gray-200 border-y mt-8">
      <summary className="cursor-pointer font-semibold py-4 text-primary text-sm">
        {label}
      </summary>
      <pre className="bg-white max-w-full overflow-x-auto p-5 rounded-lg text-ink text-xs">
        <code>{code}</code>
      </pre>
    </details>
  );
}
