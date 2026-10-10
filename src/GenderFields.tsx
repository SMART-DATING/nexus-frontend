import type { Gender, InterestedIn } from "./api";

export function GenderField({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (value: Gender) => void;
}) {
  return (
    <label>
      Твой пол
      <select
        aria-label="Твой пол"
        value={value}
        onChange={(e) => onChange(e.target.value as Gender)}
      >
        <option value="unspecified">Не указан</option>
        <option value="male">Мужчина</option>
        <option value="female">Женщина</option>
        <option value="other">Другой</option>
      </select>
      <small>Используется для подбора, не показывается в анкете.</small>
    </label>
  );
}

export function InterestedInField({
  value,
  onChange,
}: {
  value: InterestedIn;
  onChange?: (value: InterestedIn) => void;
}) {
  return (
    <label>
      Кого хочешь встретить
      <select
        name="interestedIn"
        aria-label="Кого хочешь встретить"
        {...(onChange
          ? {
              value,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange(e.target.value as InterestedIn),
            }
          : { defaultValue: value })}
      >
        <option value="all">Всех</option>
        <option value="female">Женщин</option>
        <option value="male">Мужчин</option>
        <option value="other">Людей другого пола</option>
      </select>
    </label>
  );
}
