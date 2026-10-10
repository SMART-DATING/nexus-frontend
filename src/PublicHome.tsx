import { useEffect, useState } from "react";
import { LandingGuide, scrollToLanding } from "./LandingGuide";
import { LandingExplore } from "./LandingExplore";
import { LandingFaqItem } from "./LandingFaqItem";
import {
  ArrowRight,
  ArrowDown,
  Heart,
  Sparkles,
  LockKeyhole,
  MessageCircle,
  Headphones,
  BookOpen,
} from "lucide-react";
export function PublicHome({
  onAuth,
  onPrivacy,
}: {
  onAuth: (register: boolean) => void;
  onPrivacy: () => void;
}) {
  const [photoCount, setPhotoCount] = useState(2);
  const [sceneTopic, setSceneTopic] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("landing-arrived");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".public-home main section[id]")
      .forEach((node) => observer.observe(node));
    const initial = location.hash.slice(1);
    if (document.getElementById(initial)?.matches("section[id]"))
      requestAnimationFrame(() => scrollToLanding(initial));
    return () => observer.disconnect();
  }, []);
  function explore(event: React.MouseEvent<HTMLAnchorElement>, topic: number) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    setSceneTopic(topic);
    requestAnimationFrame(() => scrollToLanding("explore-example"));
  }
  return (
    <div
      className="public-home"
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
          'a[href^="#"]',
        );
        const id = anchor?.getAttribute("href")?.slice(1);
        if (id && document.getElementById(id)?.closest("section[id]")) {
          event.preventDefault();
          scrollToLanding(id);
        }
      }}
    >
      <header className="public-header">
        <a href="/" className="brand" aria-label="Nexus — на главную">
          <img src="/nexus-mark.svg" alt="" />
          nexus
        </a>
        <a className="public-about-link" href="#how-it-works">
          Как это работает
        </a>
        <button
          type="button"
          className="landing-help-trigger"
          aria-label="Открыть помощь Некса"
          onClick={() => setHelpOpen(true)}
        >
          <span className="mini-nex" aria-hidden="true">
            ·ᴗ·
          </span>
          <span>Помощь</span>
        </button>
        <div className="public-auth-actions">
          <button className="text-button" onClick={() => onAuth(false)}>
            Войти
          </button>
          <button className="primary" onClick={() => onAuth(true)}>
            Зарегистрироваться
            <ArrowRight size={16} />
          </button>
        </div>
      </header>
      <main>
        <section
          id="welcome"
          className="landing-hero"
          aria-labelledby="landing-title"
        >
          <div className="landing-copy">
            <span className="landing-kicker">
              <span />
              Знакомства со смыслом · 18+
            </span>
            <h1 id="landing-title">
              Встреть того,
              <br />
              кому <em>близко твоё.</em>
            </h1>
            <p>
              Любимые книги. Музыка на повторе.
              <br />
              Разговоры до утра. Начните с того,
              <br className="desktop-break" /> что действительно вас объединяет.
            </p>
            <button
              className="primary landing-cta"
              onClick={() => onAuth(true)}
            >
              Найти свою волну
              <ArrowRight size={20} />
            </button>
            <small>Быть собой — уже хорошее начало.</small>
          </div>
          <div
            className="landing-scene"
            aria-label="Иллюстрация знакомства по общим интересам"
          >
            <div className="scene-orbit orbit-one" />
            <div className="scene-orbit orbit-two" />
            <a
              href="#explore-example"
              className="scene-card scene-card-back"
              aria-label="Попробовать разговор о музыке"
              onClick={(event) => explore(event, 1)}
            >
              <span className="scene-avatar">
                <Headphones size={39} />
              </span>
              <span className="scene-card-caption">Весь день на повторе</span>
              <strong>
                Музыка, в которой
                <br />
                находишь себя.
              </strong>
              <span className="scene-tag">инди · концерты · винил</span>
            </a>
            <a
              href="#explore-example"
              className="scene-card scene-card-front"
              aria-label="Попробовать разговор о книгах"
              onClick={(event) => explore(event, 0)}
            >
              <span className="scene-avatar">
                <BookOpen size={39} />
              </span>
              <span className="scene-card-caption">
                Ещё одну главу — и спать
              </span>
              <strong>
                Истории, о которых
                <br />
                хочется поговорить.
              </strong>
              <span className="scene-tag">книги · психология · кофе</span>
            </a>
            <div className="scene-connection">
              <Heart size={25} />
            </div>
            <span className="scene-message">
              <Sparkles size={18} />
              Есть о чём начать разговор
            </span>
          </div>
        </section>
        <a className="landing-scroll" href="#how-it-works">
          Знакомство начинается здесь
          <ArrowDown size={17} />
        </a>
        <div className="landing-screen">
          <section
            className="landing-how"
            id="how-it-works"
            aria-labelledby="how-title"
          >
            <div className="landing-section-heading">
              <span className="eyebrow">НИЧЕГО ЛИШНЕГО</span>
              <h2 id="how-title">
                Меньше случайностей.
                <br />
                Больше общего.
              </h2>
            </div>
            <div className="landing-steps">
              <article>
                <span className="step-number">01</span>
                <Sparkles />
                <h3>Расскажи о своём</h3>
                <p>
                  Выбери интересы и ответь на пару вопросов. Можно написать или
                  рассказать голосом — в своём темпе.
                </p>
              </article>
              <article>
                <span className="step-number">02</span>
                <Heart />
                <h3>Узнай свою волну</h3>
                <p>
                  Личный рассказ помогает подобрать людей с близкими интересами.
                  Он остаётся скрыт от других участников.
                </p>
              </article>
              <article>
                <span className="step-number">03</span>
                <MessageCircle />
                <h3>Начни с «привет»</h3>
                <p>
                  Лайкни того, кто заинтересовал. Если симпатия взаимна,
                  появится чат — и повод познакомиться ближе.
                </p>
              </article>
            </div>
          </section>
        </div>
        <div className="landing-screen">
          <LandingExplore topicIndex={sceneTopic} />
        </div>
        <div className="landing-screen">
          <section id="photos" className="landing-photo-rule">
            <div
              className="photo-rule-art"
              aria-label="Попробуй правило взаимных фотографий"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <button
                  type="button"
                  aria-label={`Пример: ${i + 1} своих фото`}
                  aria-pressed={photoCount === i + 1}
                  className={i < photoCount ? "photo-unlocked" : ""}
                  onClick={() => setPhotoCount(i + 1)}
                  key={i}
                  style={{ "--photo-index": i } as React.CSSProperties}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div>
              <span className="eyebrow">НА РАВНЫХ</span>
              <h2>
                Одна фотография?
                <br />
                Значит, одна у каждого.
              </h2>
              <p>
                Загрузи до шести фото. Сколько добавишь сам, столько сможешь
                увидеть у других. Пара слов и общие интересы помогут разглядеть
                больше.
              </p>
              <p className="photo-rule-result" aria-live="polite">
                В примере: {photoCount} своих — до {photoCount} чужих. Нажми на
                карточку слева, чтобы попробовать.
              </p>
            </div>
          </section>
        </div>
        <div className="landing-screen">
          <section id="privacy" className="landing-trust">
            <div className="trust-copy">
              <span className="eyebrow">
                <LockKeyhole size={16} /> ПОД ТВОИМ КОНТРОЛЕМ
              </span>
              <h2>
                Твоя история.
                <br />
                Твои границы.
              </h2>
              <p>
                Рассказывай столько, сколько хочется. Ты решаешь, что оставить в
                анкете, а что — только для подбора.
              </p>
              <button className="outline" onClick={onPrivacy}>
                Как работают мои данные
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="trust-cards">
              <article>
                <span className="trust-icon">
                  <Heart size={20} />
                </span>
                <div>
                  <h3>В анкете — то, что выберешь</h3>
                  <p>Город и описание можно скрыть в настройках видимости.</p>
                </div>
              </article>
              <article>
                <span className="trust-icon">
                  <LockKeyhole size={20} />
                </span>
                <div>
                  <h3>Рассказы — только для тебя</h3>
                  <p>
                    Их смысл помогает подбору. Другие участники не увидят текст.
                  </p>
                </div>
              </article>
              <article>
                <span className="trust-icon">
                  <MessageCircle size={20} />
                </span>
                <div>
                  <h3>Разговор — по взаимной симпатии</h3>
                  <p>Чат появится, когда вы оба захотите познакомиться.</p>
                </div>
              </article>
            </div>
          </section>
        </div>
        <div className="landing-screen">
          <section
            className="landing-faq"
            id="questions"
            aria-labelledby="faq-title"
          >
            <div className="landing-section-heading">
              <span className="eyebrow">ПЕРЕД ПЕРВЫМ «ПРИВЕТ»</span>
              <h2 id="faq-title">
                Всё чуть проще,
                <br />
                чем кажется.
              </h2>
            </div>
            <div>
              <LandingFaqItem question="Мой личный рассказ увидят другие?">
                <p>
                  Нет. В анкете видны выбранные тобой публичные поля, интересы и
                  разрешённые фото. Подробные истории остаются в «Для подбора»:
                  их смысл помогает составлять рекомендации.
                </p>
              </LandingFaqItem>
              <LandingFaqItem question="Нужно отвечать на все вопросы?">
                <p>
                  Нет. Некс задаёт три коротких вопроса по выбранным интересам.
                  Любой можно пропустить или отложить всё знакомство. Позже
                  можно написать один свободный рассказ и дополнять его.
                </p>
              </LandingFaqItem>
              <LandingFaqItem question="Можно рассказать голосом?">
                <p>
                  Да, если браузер поддерживает распознавание. Микрофон
                  включается только по твоему действию после пояснения. Браузер
                  может передать звук своему сервису; Nexus сохраняет только
                  подтверждённый текст. Печатать можно всегда.
                </p>
              </LandingFaqItem>
              <LandingFaqItem question="Что происходит после лайка?">
                <p>
                  Если другой человек тоже выразит симпатию, появится чат.
                  Сначала идут самые близкие по рассказу люди, затем уровни
                  ниже. Пропущенные анкеты вернутся после всех уровней.
                  Лайкнутые повторно не показываются.
                </p>
              </LandingFaqItem>
            </div>
          </section>
        </div>
        <div className="landing-screen">
          <section id="start" className="landing-last">
            <span className="eyebrow">ОБЩЕЕ УЖЕ ГДЕ-ТО РЯДОМ</span>
            <h2>
              Возможно, вы уже
              <br />
              слушаете одну песню.
            </h2>
            <p>
              Начни с пары слов о себе. Всё остальное можно дополнить по пути.
            </p>
            <button
              className="primary landing-cta"
              onClick={() => onAuth(true)}
            >
              Давайте познакомимся
              <ArrowRight size={19} />
            </button>
          </section>
        </div>
      </main>
      <footer className="public-footer">
        <div className="public-footer-content">
          <div>
            <a className="brand" href="/">
              nexus ✦
            </a>
            <p>
              Знакомства по общим интересам.
              <br />
              Личные истории помогают найти близких по духу людей.
            </p>
          </div>
          <div>
            <strong>Начать знакомство</strong>
            <a href="#how-it-works">Как это работает</a>
            <a href="#explore-example" onClick={(event) => explore(event, 0)}>
              Попробовать разговор
            </a>
            <button onClick={() => onAuth(true)}>Найти свою волну</button>
          </div>
          <div>
            <strong>Данные и поддержка</strong>
            <a href="#questions">Частые вопросы</a>
            <button type="button" onClick={() => setHelpOpen(true)}>
              Спросить Некса
            </button>
            <button onClick={onPrivacy}>О данных и приватности</button>
            <span>Nexus · 2026 · 18+</span>
          </div>
        </div>
      </footer>
      {helpOpen && (
        <LandingGuide
          onClose={() => setHelpOpen(false)}
          onPrivacy={onPrivacy}
        />
      )}
    </div>
  );
}
