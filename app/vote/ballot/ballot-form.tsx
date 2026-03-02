"use client";

import { useMemo, useState } from "react";

type CandidateOption = {
  id: number;
  name: string;
};

type PositionGroup = {
  id: number;
  name: string;
  maxWinners: number;
  candidates: CandidateOption[];
};

type BallotFormProps = {
  positions: PositionGroup[];
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function BallotForm({ positions, submitAction }: BallotFormProps) {
  const [selectedByPosition, setSelectedByPosition] = useState<Record<number, number[]>>({});
  const [errorsByPosition, setErrorsByPosition] = useState<Record<number, string>>({});

  const selectedCountByPosition = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const position of positions) {
      counts[position.id] = selectedByPosition[position.id]?.length ?? 0;
    }
    return counts;
  }, [positions, selectedByPosition]);

  function onCheckboxChange(
    positionId: number,
    candidateId: number,
    maxWinners: number,
    checked: boolean,
  ) {
    setSelectedByPosition((previous) => {
      const current = new Set(previous[positionId] ?? []);
      if (checked) {
        if (current.size >= maxWinners) {
          setErrorsByPosition((errors) => ({
            ...errors,
            [positionId]: `You can select up to ${maxWinners} candidate(s) for this position.`,
          }));
          return previous;
        }
        current.add(candidateId);
      } else {
        current.delete(candidateId);
      }

      setErrorsByPosition((errors) => {
        const next = { ...errors };
        delete next[positionId];
        return next;
      });

      return {
        ...previous,
        [positionId]: [...current],
      };
    });
  }

  return (
    <form action={submitAction} className="space-y-4">
      {positions.map((position) => (
        <section key={position.id} className="rounded-xl border border-black/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{position.name}</h2>
            <p className="text-xs text-black/60">
              Selected: {selectedCountByPosition[position.id] ?? 0} / {position.maxWinners}
            </p>
          </div>

          <p className="mt-1 text-xs text-black/60">Choose up to {position.maxWinners} candidate(s).</p>

          <div className="mt-3 space-y-2">
            {position.candidates.map((candidate) => {
              const checked = (selectedByPosition[position.id] ?? []).includes(candidate.id);
              return (
                <label
                  key={candidate.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-black/10 px-3 py-2 hover:bg-black/5"
                >
                  <input
                    type="checkbox"
                    name={`position-${position.id}`}
                    value={candidate.id}
                    checked={checked}
                    onChange={(event) =>
                      onCheckboxChange(
                        position.id,
                        candidate.id,
                        position.maxWinners,
                        event.currentTarget.checked,
                      )
                    }
                  />
                  <span className="text-sm">{candidate.name}</span>
                </label>
              );
            })}
          </div>

          {errorsByPosition[position.id] ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {errorsByPosition[position.id]}
            </p>
          ) : null}
        </section>
      ))}

      <button
        type="submit"
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
      >
        Submit Ballot
      </button>
    </form>
  );
}
