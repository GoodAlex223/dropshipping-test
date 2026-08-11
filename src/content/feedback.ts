/**
 * /feedback page + form copy (G8 TASK-058). The byCode map translates the
 * machine `code`s the feedback API returns (API prose stays English — G2
 * create-order convention). Single extraction point for TASK-039 i18n.
 */
export const feedback = {
  page: {
    title: "Зворотний зв'язок",
    description:
      "Ми щойно запустили новий сайт. Якщо щось не працює, виглядає дивно або у вас є ідея — напишіть нам. Ми читаємо кожне повідомлення.",
  },
  form: {
    nameLabel: "Ім'я",
    namePlaceholder: "Як до вас звертатися (необов'язково)",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    emailHint: "Залиште email, якщо хочете отримати відповідь (необов'язково)",
    messageLabel: "Повідомлення",
    messagePlaceholder: "Розкажіть, що сталося або що можна покращити…",
    submit: "Надіслати",
    submitting: "Надсилаємо…",
  },
  success: {
    title: "Дякуємо!",
    description:
      "Ваше повідомлення надіслано. Якщо ви залишили email, ми відповімо найближчим часом.",
  },
  byCode: {
    VALIDATION_ERROR: "Перевірте заповнені поля — щось не так.",
    SEND_FAILED: "Не вдалося надіслати повідомлення. Спробуйте пізніше.",
  } as Record<string, string>,
  fallback: "Не вдалося надіслати повідомлення. Спробуйте пізніше.",
};
