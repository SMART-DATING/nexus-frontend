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
  return (
    <div className="public-home">
      <header className="public-header">
        <a href="/" className="brand" aria-label="Nexus — на главную">
          <img src="/nexus-mark.svg" alt="" />
          nexus
        </a>
        <a className="public-about-link" href="#how-it-works">
          Как это работает
        </a>
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
        <section className="landing-hero" aria-labelledby="landing-title">
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
            <div className="scene-card scene-card-back">
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
            </div>
            <div className="scene-card scene-card-front">
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
            </div>
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
                Лайкни того, кто заинтересовал. Если симпатия взаимна, появится
                чат — и повод познакомиться ближе.
              </p>
            </article>
          </div>
        </section>
        <section className="landing-photo-rule">
          <div className="photo-rule-art" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span
                key={i}
                style={{ "--photo-index": i } as React.CSSProperties}
              >
                {i + 1}
              </span>
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
          </div>
        </section>
        <section className="landing-trust">
          <LockKeyhole size={25} />
          <h2>
            Твоя история.
            <br />
            Твои границы.
          </h2>
          <p>
            Выбирай, какие поля анкеты видят другие.
            <br />
            Личные рассказы нужны для подбора, а не для публикации.
          </p>
          <button className="text-button" onClick={onPrivacy}>
            Как работают мои данные
            <ArrowRight size={16} />
          </button>
        </section>
        <section className="landing-last">
          <h2>
            Возможно, вы уже
            <br />
            слушаете одну песню.
          </h2>
          <button className="primary landing-cta" onClick={() => onAuth(true)}>
            Давайте познакомимся
            <ArrowRight size={19} />
          </button>
        </section>
      </main>
      <footer className="public-footer">
        <span>nexus · знакомства со смыслом</span>
        <button onClick={onPrivacy}>О данных и приватности</button>
        <span>Локальный прототип · 18+</span>
      </footer>
    </div>
  );
}
