/**
 * Auth surfaces copy (login, register, auth error boundary). Single
 * extraction point for TASK-039 i18n — plain typed strings.
 * Zod field-validation messages live in src/lib/validations (UA there too,
 * G2 shippingAddressSchema precedent).
 */
export const auth = {
  login: {
    title: "Вхід",
    description: "Увійдіть, щоб керувати замовленнями та даними акаунта",
    email: { label: "Email", placeholder: "name@example.com" },
    password: { label: "Пароль", placeholder: "Введіть пароль" },
    submit: "УВІЙТИ",
    submitting: "ВХІД…",
    errors: {
      invalidCredentials: "Невірний email або пароль",
      generic: "Щось пішло не так. Спробуйте ще раз.",
    },
    noAccount: "Немає акаунта?",
    signUpLink: "Зареєструватися",
  },
  register: {
    title: "Реєстрація",
    description: "Заповніть дані, щоб створити акаунт",
    name: { label: "Ім'я", placeholder: "Олександр Коваленко" },
    email: { label: "Email", placeholder: "name@example.com" },
    password: { label: "Пароль", placeholder: "Створіть пароль" },
    confirmPassword: { label: "Підтвердження пароля", placeholder: "Повторіть пароль" },
    submit: "СТВОРИТИ АКАУНТ",
    submitting: "СТВОРЕННЯ АКАУНТА…",
    errors: {
      /** Maps register-API `code`s (see /api/auth/register 409). */
      byCode: {
        EMAIL_EXISTS: "Цей email вже зареєстровано",
      } as Record<string, string>,
      generic: "Щось пішло не так. Спробуйте ще раз.",
    },
    hasAccount: "Вже є акаунт?",
    signInLink: "Увійти",
  },
  error: {
    title: "Помилка автентифікації",
    description:
      "Під час автентифікації сталася помилка. Спробуйте ще раз — якщо проблема повторюється, зверніться до нас.",
    errorId: (digest: string) => `Код помилки: ${digest}`,
    retry: "Спробувати ще раз",
    backToLogin: "До входу",
  },
};
