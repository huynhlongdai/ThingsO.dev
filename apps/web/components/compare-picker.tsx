"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CompareOption = {
  fullName: string;
};

export function ComparePicker({
  options,
  selected,
}: {
  options: CompareOption[];
  selected: string[];
}) {
  const router = useRouter();
  const initial = [...selected.slice(0, 4), "", "", "", ""].slice(0, 4);
  const [values, setValues] = useState(initial);

  function update(index: number, value: string) {
    setValues((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  function navigate(nextValues: string[]) {
    const unique = [...new Set(nextValues.map((item) => item.trim()).filter(Boolean))].slice(0, 4);
    router.push(unique.length ? `/compare?repos=${encodeURIComponent(unique.join(","))}` : "/compare");
  }

  return (
    <form
      className="compare-picker"
      onSubmit={(event) => {
        event.preventDefault();
        navigate(values);
      }}
    >
      <div className="compare-picker__grid">
        {values.map((value, index) => (
          <label key={index}>
            <span>Repository {index + 1}</span>
            <select value={value} onChange={(event) => update(index, event.target.value)}>
              <option value="">Select repository</option>
              {options.map((option) => (
                <option key={option.fullName} value={option.fullName}>{option.fullName}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="compare-picker__actions">
        <button type="submit">Compare selected</button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            setValues(["", "", "", ""]);
            navigate([]);
          }}
        >
          Clear
        </button>
      </div>
    </form>
  );
}
