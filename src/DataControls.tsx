import { useState } from "react";
import { Download, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { api, type User } from "./api";
import { PrivacyNotice } from "./PrivacyNotice";
export function DataControls({
  user,
  onChanged,
}: {
  user: User;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState("");
  async function visibility() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await api("/users/me/discovery", "PUT", {
        hidden: !user.discoveryHidden,
      });
      await onChanged();
      setStatus(
        user.discoveryHidden
          ? "Анкета снова доступна для знакомств"
          : "Анкета скрыта. Существующие чаты сохранены.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось изменить видимость",
      );
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const data = await api<Record<string, unknown>>("/users/me/data");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json;charset=utf-8",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "nexus-my-data.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(
        "Выгрузка подготовлена. Файл содержит личные данные — сохрани его в безопасном месте.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось получить данные");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="data-controls">
      <section className="data-action">
        <div>
          {user.discoveryHidden ? <EyeOff /> : <Eye />}
          <h3>
            {user.discoveryHidden
              ? "Анкета скрыта"
              : "Анкета участвует в подборе"}
          </h3>
          <p>
            Скрытая анкета недоступна новым людям, включая фото. Собеседники из
            существующих чатов смогут продолжить общение.
          </p>
        </div>
        <button className="outline" disabled={busy} onClick={visibility}>
          {user.discoveryHidden ? "Вернуться к знакомствам" : "Скрыть анкету"}
        </button>
      </section>
      <section className="data-action">
        <div>
          <Download />
          <h3>Забрать свои данные</h3>
          <p>
            Профиль, фото, рассказы, настройки, твои реакции и отправленные
            сообщения — в одном файле. Полученные сообщения и приватные данные
            собеседников в выгрузку не входят.
          </p>
        </div>
        <button className="outline" disabled={busy} onClick={download}>
          Скачать данные
        </button>
      </section>
      {busy && (
        <p role="status">
          <LoaderCircle className="spin" size={16} />
          Сохраняем…
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="data-status">
          {status}
        </p>
      )}
      <details className="data-explanation">
        <summary>Как Nexus использует данные</summary>
        <PrivacyNotice />
      </details>
    </div>
  );
}
