import { useEffect, useState } from "react";
import { WaveGuide } from "./WaveGuide";
const topics = [
  {
    name: "Книги",
    icon: "📚",
    question: "Какая история осталась с тобой надолго?",
    answer:
      "Люблю миры, в которых можно потеряться. А потом часами обсуждать героев за кофе.",
    detail:
      "Важен не только жанр. Иногда объединяет то, что вы замечаете в одной истории.",
  },
  {
    name: "Музыка",
    icon: "🎧",
    question: "Что у тебя сейчас на повторе?",
    answer:
      "Инди в наушниках, маленькие концерты и плейлисты для каждого настроения.",
    detail:
      "Один трек может стать началом разговора. Рассказ помогает найти общую интонацию.",
  },
  {
    name: "Природа",
    icon: "🌿",
    question: "Где получается выдохнуть?",
    answer:
      "Хочу встречать рассвет в горах. Но и прогулка по парку без спешки — отличный план.",
    detail:
      "За интересом стоят ритм жизни и любимые моменты. О них и стоит рассказать.",
  },
  {
    name: "Общение",
    icon: "💬",
    question: "С какими людьми тебе хорошо?",
    answer:
      "Когда можно говорить прямо, смеяться над странными шутками и спокойно быть собой.",
    detail:
      "Не нужно подбирать правильные слова. Расскажи, что важно именно тебе.",
  },
];
export function LandingExplore({ topicIndex = 0 }: { topicIndex?: number }) {
  const [selected, setSelected] = useState(topicIndex);
  useEffect(() => setSelected(topicIndex), [topicIndex]);
  const topic = topics[selected];
  return (
    <section
      id="explore"
      className="landing-explore"
      aria-labelledby="explore-title"
    >
      <div className="landing-section-heading">
        <span className="eyebrow">БОЛЬШЕ, ЧЕМ СПИСОК ИНТЕРЕСОВ</span>
        <h2 id="explore-title">
          За словом «музыка»
          <br />
          может быть целый мир.
        </h2>
        <p>
          Nexus начинает с простого и помогает рассказать чуть больше. Выбери
          тему и попробуй, как выглядит знакомство с Нексом.
        </p>
      </div>
      <div className="explore-interaction" id="explore-example">
        <div
          className="explore-topics"
          role="group"
          aria-label="Пример разговора по интересам"
        >
          {topics.map((t, i) => (
            <button
              type="button"
              key={t.name}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.name}
            </button>
          ))}
        </div>
        <div className="explore-demo" key={topic.name}>
          <div>
            <span className="demo-caption">
              Пример разговора · ответы не сохраняются
            </span>
            <WaveGuide>
              <h3>{topic.question}</h3>
              <p>
                Можно коротко. Можно голосом. Любой вопрос можно пропустить.
              </p>
            </WaveGuide>
            <div className="example-answer">
              <span>Например, так</span>
              <p>{topic.answer}</p>
            </div>
          </div>
          <aside>
            <span className="meaning-orbit" aria-hidden="true">
              <i>✦</i>
              <b>♡</b>
              <i>✧</i>
            </span>
            <h3>Общее — глубже галочек</h3>
            <p>{topic.detail}</p>
            <p>
              Закрытые рассказы сравниваются по смыслу. Это ориентир для
              знакомства, а не обещание идеальной пары.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
