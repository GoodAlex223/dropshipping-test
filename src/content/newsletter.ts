/**
 * Newsletter pages + footer-signup copy. The byCode maps translate the
 * machine `code`s the newsletter API returns (API prose stays English —
 * G2 create-order convention). Single extraction point for TASK-039 i18n.
 */
export interface NewsletterOutcomeCopy {
  title: string;
  description: string;
}

export const newsletter = {
  confirm: {
    loading: { title: "Підтверджуємо підписку…", description: "Зачекайте, будь ласка." },
    byCode: {
      CONFIRMED: {
        title: "Підписку підтверджено!",
        description: "Дякуємо! Тепер ви отримуватимете наші новини та пропозиції.",
      },
      ALREADY_CONFIRMED: {
        title: "Підписку вже підтверджено",
        description: "Цей email уже отримує наші листи.",
      },
      LINK_EXPIRED: {
        title: "Посилання застаріло",
        description: "Термін дії посилання минув. Підпишіться ще раз — ми надішлемо новий лист.",
      },
      INVALID_TOKEN: {
        title: "Недійсне посилання",
        description: "Посилання для підтвердження недійсне. Перевірте адресу з листа.",
      },
      TOKEN_REQUIRED: {
        title: "Недійсне посилання",
        description: "У посиланні бракує токена підтвердження.",
      },
    } as Record<string, NewsletterOutcomeCopy>,
    fallback: {
      title: "Щось пішло не так",
      description: "Не вдалося підтвердити підписку. Спробуйте пізніше.",
    },
  },
  unsubscribe: {
    idle: {
      title: "Відписатися від розсилки",
      prompt: (email: string) => `Ви впевнені, що хочете відписати ${email} від нашої розсилки?`,
      confirm: "Так, відписатися",
    },
    processing: { title: "Обробляємо…", description: "Зачекайте, будь ласка." },
    invalidLink: {
      title: "Недійсне посилання",
      description: "Посилання для відписки недійсне або неповне.",
    },
    byCode: {
      UNSUBSCRIBED: {
        title: "Ви відписалися",
        description: "Ми більше не надсилатимемо вам листи.",
      },
      ALREADY_UNSUBSCRIBED: {
        title: "Ви вже відписані",
        description: "Цей email не отримує нашу розсилку.",
      },
      SUBSCRIBER_NOT_FOUND: {
        title: "Недійсне посилання",
        description: "Підписника з таким email не знайдено.",
      },
      INVALID_UNSUBSCRIBE_LINK: {
        title: "Недійсне посилання",
        description: "Посилання для відписки недійсне.",
      },
      VALIDATION_ERROR: {
        title: "Недійсне посилання",
        description: "Посилання для відписки недійсне або неповне.",
      },
    } as Record<string, NewsletterOutcomeCopy>,
    fallback: {
      title: "Щось пішло не так",
      description: "Не вдалося обробити відписку. Спробуйте пізніше.",
    },
  },
  signup: {
    byCode: {
      ALREADY_SUBSCRIBED: "Цей email уже підписаний на розсилку",
    } as Record<string, string>,
    fallback: "Не вдалося підписатися",
  },
  actions: {
    continueShopping: "Продовжити покупки",
    goHome: "На головну",
  },
};
