export const APP_NAME = "Dixy Ideas";

export const TAG_OPTIONS = [
  "Пакет",
  "Фасад здания",
  "Новая игрушка",
  "Стакан",
  "Кофе-точка",
  "Мерч",
  "Одежда персонала",
  "Тележка",
  "Ценники",
  "Промо-стойка",
  "Стикеры",
  "Витрина",
  "Экосумка",
  "Доставка"
] as const;

export const REPORT_REASONS = [
  "Непристойный контент",
  "Оскорбления или хейт",
  "Политика или провокация",
  "Нарушение авторских прав",
  "Спам",
  "Другое"
] as const;

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "На модерации",
  APPROVED: "Опубликовано",
  REJECTED: "Отклонено",
  REMOVED: "Снято с публикации"
};
