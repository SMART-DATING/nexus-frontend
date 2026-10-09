import { useEffect, useRef, useState, useId } from "react";
import { Mic, Square, Keyboard, AudioLines } from "lucide-react";
export interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<RecognitionResult>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type VoiceWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export function VoiceInput({
  value,
  onChange,
  label = "Твой ответ",
  placeholder = "Можно коротко. Можно голосом. Главное — своими словами.",
  disabled = false,
  maxLength = 6000,
}: {
  value: string;
  onChange: (s: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}) {
  const id = useId(),
    recognition = useRef<Recognition | null>(null),
    active = useRef(false);
  const [listening, setListening] = useState(false),
    [consent, setConsent] = useState(false),
    [approved, setApproved] = useState(false),
    [error, setError] = useState("");
  const Constructor =
    (window as VoiceWindow).SpeechRecognition ??
    (window as VoiceWindow).webkitSpeechRecognition;
  useEffect(
    () => () => {
      active.current = false;
      const r = recognition.current;
      if (r) {
        r.onresult = null;
        r.onerror = null;
        r.onend = null;
        try {
          r.abort();
        } catch {
          /* Recognition may already have ended. */
        }
      }
    },
    [],
  );
  function start() {
    if (!Constructor || disabled) return;
    setError("");
    setConsent(false);
    setApproved(true);
    const r = new Constructor();
    recognition.current = r;
    r.lang = "ru-RU";
    r.continuous = true;
    r.interimResults = true;
    const base = value.trim();
    const chunks = new Map<number, string>();
    active.current = true;
    r.onresult = (event) => {
      if (!active.current || recognition.current !== r) return;
      for (let i = event.resultIndex; i < event.results.length; i++)
        chunks.set(i, event.results[i][0].transcript);
      onChange(
        [
          base,
          ...[...chunks.entries()].sort((a, b) => a[0] - b[0]).map((x) => x[1]),
        ]
          .filter(Boolean)
          .join(" ")
          .slice(0, maxLength),
      );
    };
    r.onerror = ({ error }) => {
      if (!active.current || recognition.current !== r) return;
      setError(
        error === "not-allowed"
          ? "Нет доступа к микрофону. Можно продолжить текстом."
          : error === "no-speech"
            ? "Не удалось услышать голос. Попробуй ещё раз или напиши ответ."
            : error === "network"
              ? "Сервис распознавания недоступен. Ответ можно написать."
              : "Не получилось распознать речь. Попробуй ещё раз или продолжи текстом.",
      );
      active.current = false;
      setListening(false);
    };
    r.onend = () => {
      if (recognition.current !== r) return;
      active.current = false;
      setListening(false);
    };
    try {
      r.start();
      setListening(true);
    } catch {
      active.current = false;
      setListening(false);
      setError("Голосовой ввод сейчас недоступен. Можно написать ответ.");
    }
  }
  function stop() {
    try {
      recognition.current?.stop();
    } catch {
      active.current = false;
      setListening(false);
    }
  }
  return (
    <div className={`voice-composer ${listening ? "is-listening" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        rows={5}
        disabled={disabled || listening}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="composer-toolbar">
        <span>
          {listening ? (
            <>
              <AudioLines size={16} />
              Слушаю… Можно говорить без спешки
            </>
          ) : (
            <>
              <Keyboard size={15} />
              {value.length ? `${value.length}/${maxLength}` : "Пиши как другу"}
            </>
          )}
        </span>
        <button
          className="voice-trigger"
          type="button"
          disabled={disabled || !Constructor}
          aria-label={
            listening ? "Остановить голосовой ввод" : "Ответить голосом"
          }
          onClick={() =>
            listening ? stop() : approved ? start() : setConsent(true)
          }
        >
          {listening ? <Square size={17} /> : <Mic size={18} />}
          <span>{listening ? "Готово" : "Голосом"}</span>
        </button>
      </div>
      {listening && (
        <div className="voice-animation" aria-hidden="true">
          {Array.from({ length: 17 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${i * 67}ms` }} />
          ))}
        </div>
      )}
      {!Constructor && (
        <small className="voice-unavailable">
          В этом браузере голосовой ввод недоступен. Можно писать или
          использовать диктовку клавиатуры телефона.
        </small>
      )}
      {consent && (
        <div
          className="voice-consent"
          role="group"
          aria-label="Перед включением микрофона"
        >
          <strong>Поговорим?</strong>
          <p>
            Речь распознаёт браузер. Он может отправить звук своему сервису.
            Nexus получает только текст; перед сохранением его можно исправить.
          </p>
          <button type="button" className="primary" onClick={start}>
            Включить голосовой ввод
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => setConsent(false)}
          >
            Останусь с текстом
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="photo-error">
          {error}
        </p>
      )}
    </div>
  );
}
