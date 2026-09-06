/** Restore missing nav, footer, and payments i18n keys (urgent fix). */
const fs = require("fs");
const path = require("path");

const navExtras = {
  en: {
    sections: "Categories",
    myFarm: "My farm",
    utilityNav: "Quick links",
    profile: "Profile",
    admin: "Admin",
    help: "Help",
    locale: {
      label: "Language",
      hy: "Armenian",
      ru: "Russian",
      en: "English",
    },
  },
  hy: {
    sections: "Բաժիններ",
    myFarm: "Իմ ֆերմա",
    utilityNav: "Արագ հղումներ",
    profile: "Պրոֆիլ",
    admin: "Ադմին",
    help: "Օգնություն",
    locale: {
      label: "Լեզու",
      hy: "Հայերեն",
      ru: "Ռուսերեն",
      en: "Անգլերեն",
    },
  },
  ru: {
    sections: "Разделы",
    myFarm: "Моя ферма",
    utilityNav: "Быстрые ссылки",
    profile: "Профиль",
    admin: "Админ",
    help: "Помощь",
    locale: {
      label: "Язык",
      hy: "Армянский",
      ru: "Русский",
      en: "Английский",
    },
  },
};

const footerExtras = {
  en: {
    note: "FarmOS Armenia · plot → forecast → sale",
    tagline: "Plot → future harvest → demand signal → pre-sale.",
    usefulLinks: "Useful links",
    about: "About",
    help: "Help",
    contact: "Contact",
    pricing: "Pricing",
    services: "Services",
    farmPassport: "Farm passport",
    growExchange: "What to grow",
    topPlacement: "Top placement",
    groupBuy: "Group buy",
    jobs: "Jobs",
    paymentMethods: "Payment methods",
    comingSoon: "Coming soon",
    security: "Security",
    terms: "Terms",
    privacy: "Privacy",
    cookiesNote: "We use cookies for sign-in and language preference.",
    cookies: "Cookies",
    copyright: "© {year} FarmOS Armenia / Xndzor",
  },
  hy: {
    note: "FarmOS Armenia · հողամաս → կանխատեսում → վաճառք",
    tagline: "Հողամաս → ապագա բերք → պահանջարկի ազդանշան → նախնական վաճառք։",
    usefulLinks: "Օգտակար հղումներ",
    about: "Մեր մասին",
    help: "Օգնություն",
    contact: "Կապ",
    pricing: "Սակագներ",
    services: "Ծառայություններ",
    farmPassport: "Ֆերմայի անձնագիր",
    growExchange: "Ի՞նչ աճեցնել",
    topPlacement: "Վերևի տեղադրում",
    groupBuy: "Խմբային գնում",
    jobs: "Աշխատանք",
    paymentMethods: "Վճարման եղանակներ",
    comingSoon: "Շուտով",
    security: "Անվտանգություն",
    terms: "Պայմաններ",
    privacy: "Գաղտնիություն",
    cookiesNote: "Cookies-ը օգտագործվում է մուտքի և լեզվի ընտրության համար։",
    cookies: "Cookies",
    copyright: "© {year} FarmOS Armenia / Խնտոր",
  },
  ru: {
    note: "FarmOS Armenia · участок → прогноз → продажа",
    tagline: "Участок → будущий урожай → сигнал спроса → предпродажа.",
    usefulLinks: "Полезные ссылки",
    about: "О нас",
    help: "Помощь",
    contact: "Контакты",
    pricing: "Тарифы",
    services: "Сервисы",
    farmPassport: "Паспорт фермы",
    growExchange: "Что выращивать",
    topPlacement: "Топ размещение",
    groupBuy: "Групповая покупка",
    jobs: "Работы",
    paymentMethods: "Способы оплаты",
    comingSoon: "Скоро",
    security: "Безопасность",
    terms: "Условия",
    privacy: "Конфиденциальность",
    cookiesNote: "Cookies используются для входа и выбора языка.",
    cookies: "Cookies",
    copyright: "© {year} FarmOS Armenia / Xndzor",
  },
};

const paymentsExtras = {
  en: {
    acceptedMethods: "Accepted payment methods",
    comingSoon: "Coming soon",
    demoBadge: "Demo",
    demoModeNote: "Demo mode — payments are simulated locally.",
    chooseMethod: "Choose payment method",
    chooseMethodHint: "Select how you want to pay for packages and boosts.",
    configurePaymentsProd: "Online payments are not configured yet — contact support or use demo mode.",
    cardStripe: "Card (Stripe)",
    active: "Active",
    demoOnly: "Demo only",
    arcaNote: "ArCa cards are processed via Stripe when enabled.",
    cardCheckout: {
      eyebrow: "Checkout",
      title: "Card payment",
      amount: "Amount: {amount} AMD",
      cardNumber: "Card number",
      expiry: "Expiry",
      cvv: "CVV",
      cardholderName: "Cardholder name",
      phone: "Phone for SMS",
      demoBanner: "Demo checkout — no real charge.",
      continue: "Continue",
      otpMessage: "Enter the code sent to {phone}",
      demoOtpHint: "Demo code: {code}",
      demoOtpConsole: "Check server console in demo mode.",
      otpLabel: "Verification code",
      confirmPayment: "Confirm payment",
      resendWait: "Resend in {sec}s",
      resendCode: "Resend code",
      cancel: "Cancel",
      backToPricing: "Back to pricing",
      stripeSecureNote: "Card data is processed by Stripe — not stored on our servers.",
      stripe3dsNote: "Your bank may ask for 3-D Secure confirmation.",
      errors: {
        generic: "Payment failed. Try again.",
        not_found: "Payment not found.",
        phone_required: "Phone number is required.",
        otp_required: "Enter the verification code.",
      },
    },
  },
  hy: {
    acceptedMethods: "Ընդունված վճարման եղանակներ",
    comingSoon: "Շուտով",
    demoBadge: "Դեմո",
    demoModeNote: "Դեմո ռեժիմ — վճարումները սիմուլացվում են տեղում։",
    chooseMethod: "Ընտրեք վճարման եղանակ",
    chooseMethodHint: "Ընտրեք, ինչպես վճարել փաթեթների և TOP-ի համար։",
    configurePaymentsProd: "Առցանց վճարումները դեռ կարգավորված չեն — կապվեք աջակցության հետ կամ օգտագործեք դեմո ռեժիմը։",
    cardStripe: "Քարտ (Stripe)",
    active: "Ակտիվ",
    demoOnly: "Միայն դեմո",
    arcaNote: "ArCa քարտերը մշակվում են Stripe-ի միջոցով, երբ ակտիվ է։",
    cardCheckout: {
      eyebrow: "Վճարում",
      title: "Քարտով վճարում",
      amount: "Գումար՝ {amount} դրամ",
      cardNumber: "Քարտի համար",
      expiry: "Վավերականություն",
      cvv: "CVV",
      cardholderName: "Քարտապանի անուն",
      phone: "Հեռախոս SMS-ի համար",
      demoBanner: "Դեմո վճարում — իրական գանձում չկա։",
      continue: "Շարունակել",
      otpMessage: "Մուտքագրեք {phone} ուղարկված կոդը",
      demoOtpHint: "Դեմո կոդ՝ {code}",
      demoOtpConsole: "Դեմո ռեժիմում ստուգեք սերվերի կոնսոլը։",
      otpLabel: "Ստուգման կոդ",
      confirmPayment: "Հաստատել վճարումը",
      resendWait: "Նորից ուղարկել {sec} վ-ից",
      resendCode: "Նորից ուղարկել կոդ",
      cancel: "Չեղարկել",
      backToPricing: "Վերադառնալ սակագներ",
      stripeSecureNote: "Քարտի տվյալները մշակվում են Stripe-ով — մեր սերվերում չեն պահվում։",
      stripe3dsNote: "Բանկը կարող է խնդրել 3-D Secure հաստատում։",
      errors: {
        generic: "Վճարումը չհաջողվեց։ Փորձեք կրկին։",
        not_found: "Վճարումը չի գտնվել։",
        phone_required: "Հեռախոսահամարը պարտադիր է։",
        otp_required: "Մուտքագրեք ստուգման կոդը։",
      },
    },
  },
  ru: {
    acceptedMethods: "Принимаемые способы оплаты",
    comingSoon: "Скоро",
    demoBadge: "Демо",
    demoModeNote: "Демо-режим — оплата симулируется локально.",
    chooseMethod: "Выберите способ оплаты",
    chooseMethodHint: "Выберите, как оплатить пакеты и TOP.",
    configurePaymentsProd: "Онлайн-оплата ещё не настроена — свяжитесь с поддержкой или используйте демо.",
    cardStripe: "Карта (Stripe)",
    active: "Активно",
    demoOnly: "Только демо",
    arcaNote: "Карты ArCa обрабатываются через Stripe при активации.",
    cardCheckout: {
      eyebrow: "Оплата",
      title: "Оплата картой",
      amount: "Сумма: {amount} драм",
      cardNumber: "Номер карты",
      expiry: "Срок",
      cvv: "CVV",
      cardholderName: "Имя на карте",
      phone: "Телефон для SMS",
      demoBanner: "Демо-оплата — без реального списания.",
      continue: "Продолжить",
      otpMessage: "Введите код, отправленный на {phone}",
      demoOtpHint: "Демо-код: {code}",
      demoOtpConsole: "В демо-режиме проверьте консоль сервера.",
      otpLabel: "Код подтверждения",
      confirmPayment: "Подтвердить оплату",
      resendWait: "Отправить снова через {sec} с",
      resendCode: "Отправить код снова",
      cancel: "Отмена",
      backToPricing: "Назад к тарифам",
      stripeSecureNote: "Данные карты обрабатываются Stripe — не сохраняются на нашем сервере.",
      stripe3dsNote: "Банк может запросить 3-D Secure.",
      errors: {
        generic: "Оплата не удалась. Попробуйте снова.",
        not_found: "Платёж не найден.",
        phone_required: "Нужен номер телефона.",
        otp_required: "Введите код подтверждения.",
      },
    },
  },
};

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      target[k] &&
      typeof target[k] === "object" &&
      !Array.isArray(target[k])
    ) {
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
}

for (const locale of ["en", "hy", "ru"]) {
  const file = path.join(__dirname, "..", "messages", `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  if (!data.nav) data.nav = {};
  deepMerge(data.nav, navExtras[locale]);

  data.footer = { ...data.footer, ...footerExtras[locale] };

  if (!data.payments) data.payments = {};
  deepMerge(data.payments, paymentsExtras[locale]);

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("fixed", locale);
}
