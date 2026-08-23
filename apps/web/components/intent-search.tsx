type IntentSearchProps = {
  defaultValue?: string;
  compact?: boolean;
};

export function IntentSearch({ defaultValue = "", compact = false }: IntentSearchProps) {
  return (
    <form className={compact ? "intent-search intent-search--compact" : "intent-search"} action="/search" method="get">
      <label className="sr-only" htmlFor={compact ? "intent-search-compact" : "intent-search-home"}>
        What do you want to build?
      </label>
      <input
        id={compact ? "intent-search-compact" : "intent-search-home"}
        name="q"
        defaultValue={defaultValue}
        placeholder="e.g. Build an AI agent that can control a browser"
        autoComplete="off"
      />
      <button type="submit">Search</button>
    </form>
  );
}
