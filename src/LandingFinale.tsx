import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Heart,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import { WaveGuide } from "./WaveGuide";

export function PrivacyExample() {
  const [city, setCity] = useState(true);
  return (
    <div className="privacy-example">
      <div className="privacy-example-head">
        <span>Твоя анкета · пример</span>
        <button
          type="button"
          role="switch"
          aria-checked={city}
          onClick={() => setCity(!city)}
        >
          <span className="example-switch" />
          Показывать город
        </button>
      </div>
      <div className="privacy-public">
        <UserRound size={28} />
        <div>
          <strong>Люблю концерты и кофе</strong>
          <small>
            <MapPin size={13} />
            {city ? "Москва · видно в анкете" : "Город скрыт"}
          </small>
        </div>
      </div>
      <div className="privacy-private">
        <LockKeyhole size={16} />
        <span>
          Личный рассказ <small>Только для подбора</small>
        </span>
        <span className="private-lines" aria-hidden="true">
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

export function QuestionScene() {
  return (
    <div className="question-scene">
      <span className="question-orbit" />
      <span className="question-bubble">
        Можно быть собой <Heart size={17} />
      </span>
      <WaveGuide compact />
      <span className="question-bubble">
        И не спешить <Sparkles size={17} />
      </span>
    </div>
  );
}

export function LandingFinale({ onStart }: { onStart: () => void }) {
  return (
    <section id="start" className="landing-last">
      <div className="finale-copy">
        <span className="eyebrow">ОБЩЕЕ УЖЕ ГДЕ-ТО РЯДОМ</span>
        <h2>
          Возможно, вы уже
          <br />
          слушаете одну песню.
        </h2>
        <p>
          Начни с пары слов о себе.
          <br />А дальше — люди, с которыми есть о чём поговорить.
        </p>
        <button className="primary landing-cta" onClick={onStart}>
          Давайте познакомимся <ArrowRight size={19} />
        </button>
        <small>Без идеальной анкеты. В своём темпе.</small>
      </div>
      <div
        className="finale-scene"
        aria-label="Пример знакомства по общим интересам"
      >
        <span className="finale-orbit" />
        <span className="finale-orbit second" />
        <article className="finale-person person-one">
          <div className="illustrated-person">
            <UserRound strokeWidth={1.2} />
          </div>
          <small>Например, ты</small>
          <h3>
            Ещё один трек —<br />и пойдём?
          </h3>
          <span>
            <Headphones size={15} />
            Музыка · концерты
          </span>
        </article>
        <article className="finale-person person-two">
          <div className="illustrated-person">
            <UserRound strokeWidth={1.2} />
          </div>
          <small>Кто-то на твоей волне</small>
          <h3>
            У меня есть
            <br />
            целый плейлист.
          </h3>
          <span>
            <BookOpen size={15} />
            Книги · кофе
          </span>
        </article>
        <span className="finale-heart">
          <Heart size={30} />
        </span>
        <span className="finale-note">
          <MessageCircle size={18} />
          Уже есть с чего начать
        </span>
        <span className="finale-spark spark-one">✦</span>
        <span className="finale-spark spark-two">✧</span>
      </div>
    </section>
  );
}
