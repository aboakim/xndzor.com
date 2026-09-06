"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type PlotOpt = { id: string; name: string };

type RecLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } }; length: number } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function DiaryForm({ plots }: { plots: PlotOpt[] }) {
  const t = useTranslations("farm.diary");
  const [text, setText] = useState("");
  const [plotId, setPlotId] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<RecLike | null>(null);

  useEffect(() => {
    return () => {
      recRef.current?.stop();
    };
  }, []);

  const startVoice = useCallback(() => {
    setError(null);
    const w = window as unknown as {
      SpeechRecognition?: new () => RecLike;
      webkitSpeechRecognition?: new () => RecLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError(t("noSpeech"));
      return;
    }
    const rec = new SR();
    rec.lang = "hy-AM";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (ev) => {
      let transcript = "";
      for (let i = 0; i < ev.results.length; i++) {
        transcript += ev.results[i][0].transcript;
      }
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
    };
    rec.onerror = () => {
      setListening(false);
      setError(t("speechError"));
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [t]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError(null);
    const res = await fetch("/api/farm/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: text, plotId: plotId || null }),
    });
    if (!res.ok) {
      setError(t("saveError"));
      return;
    }
    setText("");
    setStatus(t("saved"));
    window.location.reload();
  }

  return (
    <form className="farm-form" onSubmit={save}>
      {plots.length > 0 ? (
        <label>
          {t("plot")}
          <select value={plotId} onChange={(e) => setPlotId(e.target.value)}>
            <option value="">{t("anyPlot")}</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        {t("transcript")}
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          required
        />
      </label>
      <div className="farm-form-row">
        <button type="button" className="btn" onClick={startVoice} disabled={listening}>
          {listening ? t("listening") : t("speak")}
        </button>
        <button type="submit" className="btn primary" disabled={!text.trim()}>
          {t("save")}
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="form-ok">{status}</p> : null}
    </form>
  );
}
