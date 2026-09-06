"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { parseDiaryText, type DiaryParsed } from "@/lib/farm-os/diary-parse";

type PlotOpt = { id: string; name: string };

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } }; length: number } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function DiaryRecorder({ plots }: { plots: PlotOpt[] }) {
  const t = useTranslations("farmOs.diary");
  const router = useRouter();
  const [text, setText] = useState("");
  const [plotId, setPlotId] = useState(plots[0]?.id || "");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<DiaryParsed | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
  }, []);

  useEffect(() => {
    setPreview(text.trim() ? parseDiaryText(text) : null);
  }, [text]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  function startVoice() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "hy-AM";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let out = "";
      for (let i = 0; i < ev.results.length; i++) {
        out += ev.results[i][0]?.transcript || "";
      }
      setText(out);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function save() {
    if (!text.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text, plotId: plotId || null }),
      });
      if (!res.ok) {
        setMsg(t("error"));
        return;
      }
      setText("");
      setMsg(t("saved"));
      router.refresh();
    } catch {
      setMsg(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fos-diary">
      <div className="fos-diary-controls">
        {supported ? (
          <button
            type="button"
            className={`btn ${listening ? "primary" : "ghost"}`}
            onClick={() => (listening ? stop() : startVoice())}
          >
            {listening ? t("stop") : t("record")}
          </button>
        ) : (
          <p className="muted tiny">{t("noSpeech")}</p>
        )}
        <label>
          <span className="sr-only">{t("plot")}</span>
          <select value={plotId} onChange={(e) => setPlotId(e.target.value)}>
            <option value="">{t("plotNone")}</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("placeholder")}
      />

      {preview && preview.keywords.length > 0 ? (
        <div className="fos-diary-preview">
          <h3>{t("parsed")}</h3>
          <ul>
            {preview.wateredHa != null ? (
              <li>{t("wateredHa", { n: preview.wateredHa })}</li>
            ) : null}
            {preview.fertilizerKg != null ? (
              <li>{t("fertilizerKg", { n: preview.fertilizerKg })}</li>
            ) : null}
            {preview.workersTomorrow != null ? (
              <li>{t("workers", { n: preview.workersTomorrow })}</li>
            ) : null}
            <li className="muted">
              {t("keywords")}: {preview.keywords.join(", ")}
            </li>
          </ul>
        </div>
      ) : null}

      {msg ? <p className="muted">{msg}</p> : null}
      <button type="button" className="btn primary" disabled={busy || !text.trim()} onClick={save}>
        {busy ? t("saving") : t("save")}
      </button>
    </div>
  );
}
