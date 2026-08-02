"use client";

import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AptitudeProfile,
  Mutation,
  QuestionRecord,
  QuestionSetRecord,
  ResponseRecord,
} from "@/lib/types";

type SaveState = "loading" | "dirty" | "saving" | "saved" | "error";

const abilityOptions = [
  ["", "? — Untested"],
  ["0", "0 — None"],
  ["1", "1 — Beginner"],
  ["2", "2 — Assisted"],
  ["3", "3 — Independent"],
  ["4", "4 — Strong"],
  ["5", "5 — Distinctive"],
] as const;

const energyOptions = [
  ["", "? — Untested"],
  ["-2", "-2 — Hate"],
  ["-1", "-1 — Dislike"],
  ["0", "0 — Neutral"],
  ["1", "1 — Enjoy"],
  ["2", "2 — Love"],
] as const;

const importanceOptions = [
  ["", "? — Unset"],
  ["0", "0 — Irrelevant"],
  ["1", "1 — Useful"],
  ["2", "2 — Important"],
  ["3", "3 — Critical"],
] as const;

function cloneProfile(profile: AptitudeProfile) {
  return structuredClone(profile);
}

function optionValue(value: string) {
  return value === "" ? null : Number(value);
}

function SaveIndicator({ state }: { state: SaveState }) {
  const labels: Record<SaveState, string> = {
    loading: "Loading…",
    dirty: "Unsaved",
    saving: "Saving…",
    saved: "Saved",
    error: "Save failed",
  };
  return (
    <div className={`save-indicator save-${state}`} role="status" aria-live="polite">
      <span className="save-mark">{state === "saved" ? "✓" : state === "error" ? "!" : "·"}</span>
      {labels[state]}
    </div>
  );
}

function RatingSelect({
  label,
  value,
  options,
  onChange,
  onBlur,
}: {
  label: string;
  value: number | null;
  options: ReadonlyArray<readonly [string, string]>;
  onChange: (value: number | null) => void;
  onBlur: () => void;
}) {
  const keyBuffer = useRef("");
  const keyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleNumericTypeahead(event: KeyboardEvent<HTMLSelectElement>) {
    if (!/^[0-9-]$/.test(event.key)) return;

    const candidate = `${keyBuffer.current}${event.key}`;
    const exact = options.find(([optionValue]) => optionValue === candidate);
    const isPrefix = options.some(
      ([optionValue]) => optionValue.startsWith(candidate) && optionValue !== candidate,
    );

    if (!exact && !isPrefix) {
      keyBuffer.current = event.key;
    } else {
      keyBuffer.current = candidate;
    }

    event.preventDefault();

    const selected = options.find(
      ([optionValue]) => optionValue === keyBuffer.current,
    );
    if (selected) {
      onChange(optionValue(selected[0]));
      keyBuffer.current = "";
    }

    if (keyResetTimer.current) clearTimeout(keyResetTimer.current);
    keyResetTimer.current = setTimeout(() => {
      keyBuffer.current = "";
    }, 700);
  }

  return (
    <label className="field rating-field">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange(optionValue(event.target.value))}
        onKeyDown={handleNumericTypeahead}
        onBlur={onBlur}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionLabel} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function move<T>(items: T[], index: number, offset: number) {
  const destination = index + offset;
  if (destination < 0 || destination >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(destination, 0, item);
  return next;
}

export function AptitudeApp() {
  const [profile, setProfile] = useState<AptitudeProfile | null>(null);
  const profileRef = useRef<AptitudeProfile | null>(null);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const saveTail = useRef<Promise<void>>(Promise.resolve());
  const saveVersion = useRef(0);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load the profile.");
        return body as AptitudeProfile;
      })
      .then((loaded) => {
        profileRef.current = loaded;
        setProfile(loaded);
        const firstActive = loaded.questionSets.find((set) => !set.archivedAt);
        setSelectedSetId(firstActive?.id ?? loaded.questionSets[0]?.id ?? null);
        setSaveState("saved");
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Could not load the profile.");
        setSaveState("error");
      });
  }, []);

  function updateLocal(mutator: (draft: AptitudeProfile) => void) {
    if (!profileRef.current) return null;
    const next = cloneProfile(profileRef.current);
    mutator(next);
    profileRef.current = next;
    setProfile(next);
    setSaveState("dirty");
    return next;
  }

  function queueMutation(mutation: Mutation) {
    const version = ++saveVersion.current;
    setSaveState("saving");
    setErrorMessage("");

    saveTail.current = saveTail.current
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(mutation),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "The change could not be saved.");
        if (version === saveVersion.current) {
          const saved = body as AptitudeProfile;
          profileRef.current = saved;
          setProfile(saved);
          setSaveState("saved");
        }
      })
      .catch((error) => {
        if (version === saveVersion.current) {
          setErrorMessage(error instanceof Error ? error.message : "The change could not be saved.");
          setSaveState("error");
        }
      });
  }

  const visibleSets = useMemo(
    () =>
      (profile?.questionSets ?? []).filter(
        (questionSet) => showArchived || !questionSet.archivedAt,
      ),
    [profile, showArchived],
  );

  const selectedSet = profile?.questionSets.find((set) => set.id === selectedSetId) ?? null;
  const selectedQuestions = (profile?.questions ?? []).filter(
    (question) =>
      question.questionSetId === selectedSetId &&
      (showArchived || !question.archivedAt),
  );

  const activeQuestions = (profile?.questions ?? []).filter((question) => !question.archivedAt);
  const completedCount = activeQuestions.filter((question) => {
    const response = profile?.responses.find((item) => item.questionId === question.id);
    return (
      response?.ability !== null &&
      response?.ability !== undefined &&
      response.energy !== null &&
      response.importance !== null
    );
  }).length;
  const progress = activeQuestions.length
    ? Math.round((completedCount / activeQuestions.length) * 100)
    : 0;

  function responseFor(questionId: string) {
    return profile?.responses.find((response) => response.questionId === questionId);
  }

  function updateResponse(
    response: ResponseRecord,
    field: "ability" | "energy" | "importance" | "note",
    value: number | string | null,
  ) {
    updateLocal((draft) => {
      const target = draft.responses.find((item) => item.id === response.id);
      if (!target) return;
      if (field === "note") target.note = String(value ?? "");
      else target[field] = value as number | null;
    });
  }

  function saveResponse(
    response: ResponseRecord,
    field: "ability" | "energy" | "importance" | "note",
  ) {
    const current = profileRef.current?.responses.find((item) => item.id === response.id);
    if (!current) return;
    queueMutation({
      type: "updateResponse",
      responseId: response.id,
      field,
      value: current[field],
    });
  }

  function updateSetField(
    questionSet: QuestionSetRecord,
    field: "code" | "title" | "description",
    value: string,
  ) {
    updateLocal((draft) => {
      const target = draft.questionSets.find((item) => item.id === questionSet.id);
      if (target) target[field] = value;
    });
  }

  function saveSetField(
    questionSet: QuestionSetRecord,
    field: "code" | "title" | "description",
  ) {
    const current = profileRef.current?.questionSets.find((item) => item.id === questionSet.id);
    if (!current) return;
    queueMutation({
      type: "updateQuestionSet",
      questionSetId: questionSet.id,
      field,
      value: current[field],
    });
  }

  function updateQuestionField(
    question: QuestionRecord,
    field: "code" | "title" | "detail",
    value: string,
  ) {
    updateLocal((draft) => {
      const target = draft.questions.find((item) => item.id === question.id);
      if (target) target[field] = value;
    });
  }

  function saveQuestionField(
    question: QuestionRecord,
    field: "code" | "title" | "detail",
  ) {
    const current = profileRef.current?.questions.find((item) => item.id === question.id);
    if (!current) return;
    queueMutation({
      type: "updateQuestion",
      questionId: question.id,
      field,
      value: current[field],
    });
  }

  function reorderSets(index: number, offset: number) {
    const ordered = move(visibleSets, index, offset);
    updateLocal((draft) => {
      ordered.forEach((set, position) => {
        const target = draft.questionSets.find((item) => item.id === set.id);
        if (target) target.position = position;
      });
      draft.questionSets.sort((a, b) => a.position - b.position);
    });
    queueMutation({ type: "reorderQuestionSets", orderedIds: ordered.map((set) => set.id) });
  }

  function reorderQuestions(index: number, offset: number) {
    if (!selectedSet) return;
    const ordered = move(selectedQuestions, index, offset);
    updateLocal((draft) => {
      ordered.forEach((question, position) => {
        const target = draft.questions.find((item) => item.id === question.id);
        if (target) target.position = position;
      });
      draft.questions.sort((a, b) => a.position - b.position);
    });
    queueMutation({
      type: "reorderQuestions",
      questionSetId: selectedSet.id,
      orderedIds: ordered.map((question) => question.id),
    });
  }

  if (!profile) {
    return (
      <main className="loading-shell">
        <div className="loading-card">
          <span className="eyebrow">APTITUDE MAP</span>
          <h1>{saveState === "error" ? "The map could not open" : "Opening your map…"}</h1>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <SaveIndicator state={saveState} />

      <aside className="sidebar">
        <div className="brand">
          <span className="eyebrow">APTITUDE MAP</span>
          <h1>Know what to own.</h1>
          <p>Ability, energy, and importance across a living capability map.</p>
        </div>

        <div className="progress-block">
          <div className="progress-copy">
            <span>{completedCount} of {activeQuestions.length}</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track" aria-label={`${progress}% complete`}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <nav className="set-nav" aria-label="Question sets">
          {visibleSets.map((questionSet, index) => {
            const questions = profile.questions.filter(
              (question) => question.questionSetId === questionSet.id && !question.archivedAt,
            );
            const rated = questions.filter((question) => {
              const response = responseFor(question.id);
              return response?.ability !== null && response?.energy !== null && response?.importance !== null;
            }).length;
            return (
              <div className="set-nav-row" key={questionSet.id}>
                <button
                  className={`set-nav-button ${selectedSetId === questionSet.id ? "is-active" : ""} ${questionSet.archivedAt ? "is-archived" : ""}`}
                  onClick={() => setSelectedSetId(questionSet.id)}
                >
                  <span className="set-code">{questionSet.code}</span>
                  <span className="set-title">{questionSet.title}</span>
                  <span className="set-count">{rated}/{questions.length}</span>
                </button>
                {editMode && (
                  <div className="reorder-buttons" aria-label={`Reorder ${questionSet.title}`}>
                    <button disabled={index === 0} onClick={() => reorderSets(index, -1)} aria-label="Move up">↑</button>
                    <button disabled={index === visibleSets.length - 1} onClick={() => reorderSets(index, 1)} aria-label="Move down">↓</button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-actions">
          <button className="secondary-button" onClick={() => setEditMode((value) => !value)}>
            {editMode ? "Done editing" : "Edit ontology"}
          </button>
          {editMode && (
            <>
              <button
                className="secondary-button"
                onClick={() => queueMutation({ type: "addQuestionSet" })}
              >
                + Add question set
              </button>
              <label className="archive-toggle">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(event) => setShowArchived(event.target.checked)}
                />
                Show archived
              </label>
            </>
          )}
          <a className="text-link" href="/api/export" download>
            Export JSON ↓
          </a>
        </div>
      </aside>

      <main className="content">
        {errorMessage && <div className="error-banner">{errorMessage}</div>}

        {selectedSet ? (
          <>
            <header className="set-header">
              {editMode ? (
                <div className="ontology-set-editor">
                  <div className="field-row">
                    <label className="field compact-field">
                      <span>Code</span>
                      <input
                        value={selectedSet.code}
                        onChange={(event) => updateSetField(selectedSet, "code", event.target.value)}
                        onBlur={() => saveSetField(selectedSet, "code")}
                      />
                    </label>
                    <label className="field grow-field">
                      <span>Question-set title</span>
                      <input
                        value={selectedSet.title}
                        onChange={(event) => updateSetField(selectedSet, "title", event.target.value)}
                        onBlur={() => saveSetField(selectedSet, "title")}
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Description</span>
                    <textarea
                      rows={2}
                      value={selectedSet.description}
                      onChange={(event) => updateSetField(selectedSet, "description", event.target.value)}
                      onBlur={() => saveSetField(selectedSet, "description")}
                    />
                  </label>
                  <div className="editor-actions">
                    <code>{selectedSet.id}</code>
                    <button
                      className={selectedSet.archivedAt ? "restore-button" : "archive-button"}
                      onClick={() =>
                        queueMutation({
                          type: "setQuestionSetArchived",
                          questionSetId: selectedSet.id,
                          archived: !selectedSet.archivedAt,
                        })
                      }
                    >
                      {selectedSet.archivedAt ? "Restore set" : "Archive set"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="set-kicker">{selectedSet.code} · {selectedQuestions.length} capabilities</div>
                  <h2>{selectedSet.title}</h2>
                  <p>{selectedSet.description}</p>
                </>
              )}
            </header>

            <section className="question-list">
              {selectedQuestions.map((question, index) => {
                const response = responseFor(question.id);
                if (!response) return null;

                return editMode ? (
                  <article className={`question-card ontology-card ${question.archivedAt ? "is-archived" : ""}`} key={question.id}>
                    <div className="ontology-card-head">
                      <span className="question-number">{String(index + 1).padStart(2, "0")}</span>
                      <div className="reorder-buttons">
                        <button disabled={index === 0} onClick={() => reorderQuestions(index, -1)} aria-label="Move question up">↑</button>
                        <button disabled={index === selectedQuestions.length - 1} onClick={() => reorderQuestions(index, 1)} aria-label="Move question down">↓</button>
                      </div>
                    </div>
                    <div className="field-row">
                      <label className="field compact-field">
                        <span>Code</span>
                        <input
                          value={question.code}
                          onChange={(event) => updateQuestionField(question, "code", event.target.value)}
                          onBlur={() => saveQuestionField(question, "code")}
                        />
                      </label>
                      <label className="field grow-field">
                        <span>Capability</span>
                        <input
                          value={question.title}
                          onChange={(event) => updateQuestionField(question, "title", event.target.value)}
                          onBlur={() => saveQuestionField(question, "title")}
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span>Detail</span>
                      <textarea
                        rows={3}
                        value={question.detail}
                        onChange={(event) => updateQuestionField(question, "detail", event.target.value)}
                        onBlur={() => saveQuestionField(question, "detail")}
                      />
                    </label>
                    <div className="editor-actions">
                      <code>{question.id}</code>
                      <button
                        className={question.archivedAt ? "restore-button" : "archive-button"}
                        onClick={() =>
                          queueMutation({
                            type: "setQuestionArchived",
                            questionId: question.id,
                            archived: !question.archivedAt,
                          })
                        }
                      >
                        {question.archivedAt ? "Restore" : "Archive"}
                      </button>
                    </div>
                  </article>
                ) : (
                  <article className="question-card" key={question.id}>
                    <div className="question-copy">
                      <div className="question-meta">
                        <span className="question-number">{String(index + 1).padStart(2, "0")}</span>
                        <span className="question-code">{question.code}</span>
                      </div>
                      <h3>{question.title}</h3>
                      <p>{question.detail}</p>
                    </div>
                    <div className="rating-grid">
                      <RatingSelect
                        label="A · Ability"
                        value={response.ability}
                        options={abilityOptions}
                        onChange={(value) => updateResponse(response, "ability", value)}
                        onBlur={() => saveResponse(response, "ability")}
                      />
                      <RatingSelect
                        label="E · Energy"
                        value={response.energy}
                        options={energyOptions}
                        onChange={(value) => updateResponse(response, "energy", value)}
                        onBlur={() => saveResponse(response, "energy")}
                      />
                      <RatingSelect
                        label="I · Importance"
                        value={response.importance}
                        options={importanceOptions}
                        onChange={(value) => updateResponse(response, "importance", value)}
                        onBlur={() => saveResponse(response, "importance")}
                      />
                      <label className="field note-field">
                        <span>Notes</span>
                        <textarea
                          rows={2}
                          placeholder="Conditions, evidence, exceptions, aspirations…"
                          value={response.note}
                          onChange={(event) => updateResponse(response, "note", event.target.value)}
                          onBlur={() => saveResponse(response, "note")}
                        />
                      </label>
                    </div>
                  </article>
                );
              })}
            </section>

            {editMode && (
              <button
                className="add-question-button"
                onClick={() => queueMutation({ type: "addQuestion", questionSetId: selectedSet.id })}
              >
                + Add capability to {selectedSet.code}
              </button>
            )}

            {!editMode && (
              <footer className="scale-legend">
                <div><strong>A</strong> 0 none · 3 independent · 5 distinctive</div>
                <div><strong>E</strong> -2 hate · 0 neutral · 2 love</div>
                <div><strong>I</strong> 0 irrelevant · 2 important · 3 critical</div>
              </footer>
            )}
          </>
        ) : (
          <div className="empty-state">Choose a question set to begin.</div>
        )}
      </main>
    </div>
  );
}
