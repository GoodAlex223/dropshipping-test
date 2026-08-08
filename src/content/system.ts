/**
 * System pages copy (404, root error boundary, cookie consent banner).
 * Single extraction point for TASK-039 i18n — plain typed strings.
 */
export const system = {
  notFound: {
    title: "404",
    description: "Сторінку не знайдено",
    cta: "Повернутися на головну",
  },
  error: {
    title: "Щось пішло не так",
    description: "Сталася неочікувана помилка. Спробуйте ще раз.",
    errorId: (digest: string) => `Код помилки: ${digest}`,
    retry: "Спробувати ще раз",
    home: "На головну",
  },
  cookies: {
    message:
      "Ми використовуємо cookies для аналізу відвідуваності та покращення роботи сайту. Натискаючи «Прийняти», ви погоджуєтесь на аналітичне відстеження.",
    accept: "Прийняти",
    decline: "Відхилити",
  },
};
