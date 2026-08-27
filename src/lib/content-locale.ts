/**
 * Localize seeded marketplace copy (titles/descriptions) when the UI locale changes.
 * Exact Armenian seed strings map to ru/en. Unknown / user-written text is returned as-is.
 */

export type LocaleCode = "hy" | "ru" | "en";

type Tri = { ru: string; en: string };

/** Armenian source → translations. Keys must match seed.ts strings exactly. */
const SEED_TEXT: Record<string, Tri> = {
  // —— Demand ——
  "Լոլիկ հյութի գործարանի համար": {
    ru: "Томаты для сокового завода",
    en: "Tomatoes for a juice plant",
  },
  "Շաբաթական մթերում։ Կարող ենք նախապես ամրագրել օգոստոս–սեպտեմբեր։": {
    ru: "Еженедельная закупка. Можем заранее забронировать август–сентябрь.",
    en: "Weekly purchase. We can pre-book August–September.",
  },
  "Լոլիկ մեծածախ Կոտայք": { ru: "Томаты оптом — Котайк", en: "Wholesale tomatoes — Kotayk" },
  "Պետք է 3–5 տոննա օգոստոսի վերջին։": {
    ru: "Нужно 3–5 тонн к концу августа.",
    en: "Need 3–5 tons by end of August.",
  },
  "Ցորեն մեծածախ": { ru: "Пшеница оптом", en: "Wholesale wheat" },
  "Աշնանային մթերում։": { ru: "Осенняя закупка.", en: "Autumn purchase." },
  "Խաղող գինու համար": { ru: "Виноград для вина", en: "Grapes for wine" },
  "Կարմիր սորտեր, սեպտեմբեր։": { ru: "Красные сорта, сентябрь.", en: "Red varieties, September." },
  "Խնձոր արտահանման համար — 1-ին կարգ": {
    ru: "Яблоки на экспорт — 1-й сорт",
    en: "Export apples — grade 1",
  },
  "Պետք է 20–40 տ խնձոր, տեսակավորված, արկղերով։ Բեռնումը՝ Արմավիրում։": {
    ru: "Нужно 20–40 т яблок, сортированные, в ящиках. Погрузка в Армавире.",
    en: "Need 20–40 t sorted apples in crates. Loading in Armavir.",
  },
  "Կաթ ամենօրյա մթերում — Գեղարքունիք": {
    ru: "Ежедневная закупка молока — Гегаркуник",
    en: "Daily milk purchase — Gegharkunik",
  },
  "Օրական 600–1200 լ կաթ, սեփական տրանսպորտով վերցնում ենք գյուղից։": {
    ru: "600–1200 л молока в день, забираем своим транспортом из села.",
    en: "600–1200 L milk daily; we collect with our transport from the village.",
  },
  "Կարտոֆիլ խանութների ցանցի համար": {
    ru: "Картофель для сети магазинов",
    en: "Potatoes for a shop network",
  },
  "Շաբաթական 5–8 տ, չափսը՝ 55 մմ+։ Վճարումը՝ առաքումից 3 օր հետո։": {
    ru: "5–8 т в неделю, калибр 55 мм+. Оплата через 3 дня после поставки.",
    en: "5–8 t weekly, size 55 mm+. Payment 3 days after delivery.",
  },
  "Մեղր՝ նվերների փաթեթների համար": {
    ru: "Мёд для подарочных наборов",
    en: "Honey for gift packs",
  },
  "300–600 կգ բնական մեղր, հնարավոր է սորտերով բաժանված։": {
    ru: "300–600 кг натурального мёда, возможно по сортам.",
    en: "300–600 kg natural honey, possibly by variety.",
  },
  // —— Supply ——
  "Թարմ լոլիկ — Արարատ": { ru: "Свежие томаты — Арарат", en: "Fresh tomatoes — Ararat" },
  "Պատրաստ է հիմա։ Դաշտից՝ արկղերով, օրական մինչև 1.5 տ։": {
    ru: "Готово сейчас. С поля в ящиках, до 1,5 т в день.",
    en: "Ready now. From the field in crates, up to 1.5 t/day.",
  },
  "Կարտոֆիլ Լոռի — տեսակավորված": {
    ru: "Картофель Лори — сортированный",
    en: "Lori potatoes — sorted",
  },
  "Տեսակավորված, պարկերով 25 կգ։ Պահեստը՝ Վանաձորում։": {
    ru: "Сортированный, мешки по 25 кг. Склад в Ванадзоре.",
    en: "Sorted, 25 kg bags. Warehouse in Vanadzor.",
  },
  "Խնձոր՝ Արենի, 1-ին կարգ": { ru: "Яблоки Арени, 1-й сорт", en: "Areni apples, grade 1" },
  "Այգուց՝ ձեռքով հավաքված։ Հնարավոր է առաքում Երևան։": {
    ru: "С сада, ручной сбор. Возможна доставка в Ереван.",
    en: "Hand-picked from the orchard. Yerevan delivery possible.",
  },
  "Կաթ՝ օրական 800 լ, Սևան": { ru: "Молоко: 800 л/день, Севан", en: "Milk: 800 L/day, Sevan" },
  "Առավոտյան և երեկոյան կիթ։ Սառեցված տանկով։": {
    ru: "Утренний и вечерний надой. Охлаждённый танк.",
    en: "Morning and evening milking. Cooled tank.",
  },
  "Բնական մեղր՝ Իջևան": { ru: "Натуральный мёд — Иджеван", en: "Natural honey — Ijevan" },
  "Ծաղկամեղր և ալպիական։ 0.5 և 1 կգ տարաներով։": {
    ru: "Цветочный и альпийский. Банки 0,5 и 1 кг.",
    en: "Floral and alpine. 0.5 and 1 kg jars.",
  },
  "Խաղող՝ Արտաշատ, գինու սորտեր": {
    ru: "Виноград Арташат, винные сорта",
    en: "Artashat grapes, wine varieties",
  },
  "Արենի սև և Կանգուն։ Բերքահավաքը սկսվում է սեպտեմբերի 5-ից։": {
    ru: "Арени чёрный и Кангун. Сбор с 5 сентября.",
    en: "Areni black and Kangun. Harvest from 5 September.",
  },
  "Ցորեն՝ Շիրակ, բերք 2026": { ru: "Пшеница Ширак, урожай 2026", en: "Shirak wheat, 2026 crop" },
  "Չոր, մաքրված։ Բեռնումը՝ Արթիկի պահեստից։": {
    ru: "Сухая, очищенная. Погрузка со склада в Артике.",
    en: "Dry, cleaned. Loading from Artik warehouse.",
  },
  // —— Jobs ——
  "6 հա ցորեն — պետք է կոմբայն օգոստոսի 28-ին": {
    ru: "6 га пшеницы — нужен комбайн 28 августа",
    en: "6 ha wheat — need combine on 28 August",
  },
  "Արմավիրում ունեմ 6 հեկտար ցորեն։ Պետք է բերքահավաք օգոստոսի 28-ին։ Առաջարկում եմ 450,000֏ ամբողջ աշխատանքի համար։": {
    ru: "В Армавире 6 га пшеницы. Нужна уборка 28 августа. Предлагаю 450 000֏ за всю работу.",
    en: "I have 6 ha of wheat in Armavir. Need harvest on 28 August. Offering 450,000 AMD for the job.",
  },
  "Հերկ 4 հա — Արարատ": { ru: "Вспашка 4 га — Арарат", en: "Plowing 4 ha — Ararat" },
  "Գարնանային հերկ։": { ru: "Весенняя вспашка.", en: "Spring plowing." },
  "Սրսկում 3 հա խնձորի այգի — Վայոց ձոր": {
    ru: "Опрыскивание 3 га яблоневого сада — Вайоц Дзор",
    en: "Spraying 3 ha apple orchard — Vayots Dzor",
  },
  "Պետք է սրսկող տեխնիկա և օպերատոր։ Դեղը՝ իմ հաշվին։": {
    ru: "Нужна опрыскивающая техника и оператор. Препарат за мой счёт.",
    en: "Need sprayer and operator. Chemicals on my account.",
  },
  "Բերքի տեղափոխում Սևան → Երևան, 8 տ": {
    ru: "Перевозка урожая Севан → Ереван, 8 т",
    en: "Crop transport Sevan → Yerevan, 8 t",
  },
  "Շաբաթը երկու անգամ։ Պետք է սառնարանային կամ ծածկված մեքենա։": {
    ru: "Два раза в неделю. Нужен рефрижератор или крытый транспорт.",
    en: "Twice a week. Need refrigerated or covered truck.",
  },
  "Խաղողի էտ 2.5 հա — Իջևան": {
    ru: "Обрезка винограда 2,5 га — Иджеван",
    en: "Grape pruning 2.5 ha — Ijevan",
  },
  "Աշնանային էտ, փորձառու աշխատողներ։ Օրավարձ բանակցելի։": {
    ru: "Осенняя обрезка, опытные рабочие. Дневная оплата договорная.",
    en: "Autumn pruning, experienced workers. Day rate negotiable.",
  },
  "Ցանք 12 հա գարի — Շիրակ": {
    ru: "Посев 12 га ячменя — Ширак",
    en: "Sowing 12 ha barley — Shirak",
  },
  "Պետք է սերմացանիչ և տրակտոր։ Սերմը՝ պատրաստ է պահեստում։": {
    ru: "Нужна сеялка и трактор. Семена готовы на складе.",
    en: "Need seeder and tractor. Seed ready in storage.",
  },
  // —— Providers ——
  "Կոմբայն + օպերատոր — Արմավիր / Արարատ": {
    ru: "Комбайн + оператор — Армавир / Арарат",
    en: "Combine + operator — Armavir / Ararat",
  },
  "Կատարում եմ բերքահավաք և հերկ։ Ոչ թե տեխնիկա եմ վարձով տալիս, այլ պատվեր եմ վերցնում։": {
    ru: "Выполняю уборку и вспашку. Не сдаю технику в аренду — беру заказ на работу.",
    en: "I do harvest and plowing. Not equipment rental — I take job orders.",
  },
  "Տրակտոր + սերմացանիչ — Շիրակ / Լոռի": {
    ru: "Трактор + сеялка — Ширак / Лори",
    en: "Tractor + seeder — Shirak / Lori",
  },
  "Հերկ, ցանք, կուլտիվացիա։ Աշխատում եմ պատվերով, ոչ ժամավարձով։": {
    ru: "Вспашка, посев, культивация. Работаю по заказу, не почасово.",
    en: "Plow, sow, cultivate. Job orders, not hourly hire.",
  },
  "Սրսկող տեխնիկա և ագրոնոմ — Վայոց ձոր / Սյունիք": {
    ru: "Опрыскиватель и агроном — Вайоц Дзор / Сюник",
    en: "Sprayer and agronomist — Vayots Dzor / Syunik",
  },
  "Այգիների սրսկում, էտ, ագրոնոմիական խորհրդատվություն։": {
    ru: "Опрыскивание садов, обрезка, агроконсультации.",
    en: "Orchard spraying, pruning, agronomy advice.",
  },
  // —— Forward ——
  "Մասիսի լոլիկ — ապագա բերք (օգոստոս–սեպտեմբեր)": {
    ru: "Томаты Масис — будущий урожай (август–сентябрь)",
    en: "Masis tomatoes — future harvest (Aug–Sep)",
  },
  "Ցորեն — նախապես վաճառք (օգոստոսի վերջ)": {
    ru: "Пшеница — предпродажа (конец августа)",
    en: "Wheat — pre-sale (late August)",
  },
  "Խաղող գինու համար — սեպտեմբեր": {
    ru: "Виноград для вина — сентябрь",
    en: "Wine grapes — September",
  },
  "Խնձոր՝ Արենի — ապագա բերք (հոկտեմբեր)": {
    ru: "Яблоки Арени — будущий урожай (октябрь)",
    en: "Areni apples — future harvest (October)",
  },
  "3 հա այգի, ակնկալվում է 45 տ։ Հնարավոր է նախնական ամրագրում մասերով։": {
    ru: "3 га сад, ожидается 45 т. Возможна предварительная бронь частями.",
    en: "3 ha orchard, ~45 t expected. Partial pre-booking possible.",
  },
  "Կարտոֆիլ՝ Սպիտակ — ապագա բերք (սեպտեմբեր)": {
    ru: "Картофель Спитак — будущий урожай (сентябрь)",
    en: "Spitak potatoes — future harvest (September)",
  },
  "8 հա, ակնկալվում է 160 տ։ Պահեստավորում հնարավոր է մինչև նոյեմբեր։": {
    ru: "8 га, ожидается 160 т. Хранение возможно до ноября.",
    en: "8 ha, ~160 t expected. Storage possible until November.",
  },
  "Կաթ՝ պայմանագրային մատակարարում (հոկտեմբեր–մարտ)": {
    ru: "Молоко: контрактная поставка (октябрь–март)",
    en: "Milk: contract supply (Oct–Mar)",
  },
  "Օրական 900 լ երաշխավորված ծավալ ձմռան ամիսներին։": {
    ru: "900 л в день гарантированный объём зимой.",
    en: "900 L/day guaranteed volume in winter months.",
  },
  "Մեղր՝ Բերդ — աշնանային մթերում": {
    ru: "Мёд Берд — осенняя заготовка",
    en: "Berd honey — autumn harvest",
  },
  "60 փեթակ, ակնկալվում է 900 կգ ծաղկամեղր։": {
    ru: "60 ульев, ожидается 900 кг цветочного мёда.",
    en: "60 hives, ~900 kg floral honey expected.",
  },
  // —— Group buy ——
  "Խմբային գնում՝ սերմացու կարտոֆիլ": {
    ru: "Совместная закупка: семенной картофель",
    en: "Group buy: seed potatoes",
  },
  "Հավաքում ենք պատվեր մինչև նպատակային քանակ։ Վճարում՝ օֆլայն մատակարարին։": {
    ru: "Собираем заказ до целевого объёма. Оплата поставщику офлайн.",
    en: "Collecting orders to target qty. Pay supplier offline.",
  },
  "Խմբային գնում՝ պարարտանյութ (NPK)": {
    ru: "Совместная закупка: удобрение (NPK)",
    en: "Group buy: fertilizer (NPK)",
  },
  "NPK 15-15-15 խառնուրդ։ Մեծածախ գին՝ 5 տոննայից սկսած։": {
    ru: "Смесь NPK 15-15-15. Оптовая цена от 5 тонн.",
    en: "NPK 15-15-15 mix. Wholesale from 5 tons.",
  },
  "Խմբային գնում՝ փայտյա արկղեր բերքի համար": {
    ru: "Совместная закупка: деревянные ящики для урожая",
    en: "Group buy: wooden harvest crates",
  },
  "Ստանդարտ 20 կգ արկղեր։ Որքան շատ ենք, այնքան էժան։": {
    ru: "Стандартные ящики 20 кг. Чем больше — тем дешевле.",
    en: "Standard 20 kg crates. More volume = lower price.",
  },
  "Խմբային գնում՝ դիզելային վառելիք բերքահավաքի համար": {
    ru: "Совместная закупка: дизель на уборку",
    en: "Group buy: diesel for harvest",
  },
  "Հավաքում ենք պատվեր բերքահավաքի սեզոնի համար՝ ցիստերնով առաքում գյուղ։": {
    ru: "Собираем заказ на сезон уборки — доставка цистерной в село.",
    en: "Collecting harvest-season orders — tanker delivery to village.",
  },
  // —— Machinery (titles + key descriptions) ——
  "John Deere 6155R · 2019 · 4 200 մոտ/ժ": {
    ru: "John Deere 6155R · 2019 · 4 200 м/ч",
    en: "John Deere 6155R · 2019 · 4,200 engine hours",
  },
  "Լավ վիճակում տրակտոր Արարատի դաշտերից։ Կանոնավոր սպասարկում, յուղեր փոխված։ Հարմար է վարի, սերմնացանի և տրանսպորտի համար։ Կցորդներով չի վաճառվում՝ առանձին հնարավոր է։": {
    ru: "Трактор в хорошем состоянии с полей Арарата. Регулярное ТО, масла заменены. Для пахоты, сева и транспорта. Без навесного — отдельно возможно.",
    en: "Good-condition tractor from Ararat fields. Regular service, oils changed. For plow, seed, transport. Attachments not included — available separately.",
  },
  "MTZ Belarus 82.1 · 2015": { ru: "МТЗ Belarus 82.1 · 2015", en: "MTZ Belarus 82.1 · 2015" },
  "Դասական բելառուսական տրակտոր՝ գյուղական աշխատանքների համար։ Մոտորաժամը ազնիվ է, հիդրավլիկան աշխատում է։ Վաճառվում է Արմավիրից։": {
    ru: "Классический белорусский трактор для сельхозработ. Моточасы честные, гидравлика работает. Продаётся из Армавира.",
    en: "Classic Belarus tractor for farm work. Honest hours, hydraulics work. Selling from Armavir.",
  },
  "Case IH Axial-Flow 6140 կոմբայն": {
    ru: "Комбайн Case IH Axial-Flow 6140",
    en: "Case IH Axial-Flow 6140 combine",
  },
  "Հացահատիկի կոմբայն՝ ցորենի և գարու բերքահավաքի համար։ Բունկերը մաքուր է, մաղերը փոխված 2024-ին։ Հասանելի է Կոտայքում։": {
    ru: "Зерноуборочный комбайн для пшеницы и ячменя. Бункер чистый, решёта заменены в 2024. Доступен в Котайке.",
    en: "Grain combine for wheat and barley. Clean bunker, sieves replaced in 2024. Available in Kotayk.",
  },
  "Claas Lexion 570 · 2012": { ru: "Claas Lexion 570 · 2012", en: "Claas Lexion 570 · 2012" },
  "Գեղարքունիքի դաշտերում աշխատած կոմբայն։ Վիճակը միջին, պահանջում է թեթև սպասարկում։ Գինը բանակցելի է։": {
    ru: "Комбайн с полей Гегаркуника. Состояние среднее, нужна лёгкая подготовка. Цена договорная.",
    en: "Combine used in Gegharkunik fields. Mid condition, light service needed. Price negotiable.",
  },
  "Amazone UX 4200 սրսկիչ": { ru: "Опрыскиватель Amazone UX 4200", en: "Amazone UX 4200 sprayer" },
  "Կցովի սրսկիչ՝ այգիների և դաշտային մշակույթների համար։ Պոմպը ստուգված է, վարդակները նոր են։": {
    ru: "Прицепной опрыскиватель для садов и полевых культур. Насос проверен, форсунки новые.",
    en: "Trailed sprayer for orchards and field crops. Pump checked, nozzles new.",
  },
  "Kverneland սերմնացան · 4 մ": {
    ru: "Сеялка Kverneland · 4 м",
    en: "Kverneland seeder · 4 m",
  },
  "Մեխանիկական սերմնացան ցորենի և գարու համար։ Աշխատանքային լայնություն 4 մ։ Վիճակը լավ է, օգտագործվել է սահմանափակ։": {
    ru: "Механическая сеялка для пшеницы и ячменя. Ширина 4 м. Хорошее состояние, мало использовалась.",
    en: "Mechanical seeder for wheat and barley. 4 m working width. Good condition, lightly used.",
  },
  "Lemken կուլտիվատոր 5 մ": { ru: "Культиватор Lemken 5 м", en: "Lemken cultivator 5 m" },
  "Ծանր կուլտիվատոր՝ նախավարի մշակման համար։ Շիրակից։ Կարող է աշխատել MTZ 82+ տրակտորների հետ։": {
    ru: "Тяжёлый культиватор для предпосевной обработки. Из Ширака. Работает с МТЗ 82+.",
    en: "Heavy cultivator for pre-sow tillage. From Shirak. Works with MTZ 82+.",
  },
  "Fliegl գյուղատնտեսական կցորդ 12 տ": {
    ru: "Сельхозприцеп Fliegl 12 т",
    en: "Fliegl farm trailer 12 t",
  },
  "Եռակողմանի բեռնաթափումով կցորդ։ Հարմար է հացահատիկի և պարարտանյութի տեղափոխման համար։": {
    ru: "Прицеп с трёхсторонней разгрузкой. Для зерна и удобрений.",
    en: "Three-way tipper trailer. For grain and fertilizer.",
  },
  "КАМАЗ 55111 ինքնաթափ · 2008": {
    ru: "Самосвал КАМАЗ 55111 · 2008",
    en: "Kamaz 55111 dump truck · 2008",
  },
  "Գյուղատնտեսական բեռնափոխադրումների համար։ Շարժիչը աշխատում է, թափքը ամուր է։ Վաճառվում է Սյունիքից։": {
    ru: "Для сельхозперевозок. Двигатель работает, кузов крепкий. Продаётся из Сюника.",
    en: "For farm haulage. Engine runs, body solid. Selling from Syunik.",
  },
  "New Holland T6.180 · նոր մնացորդ": {
    ru: "New Holland T6.180 · почти новый",
    en: "New Holland T6.180 · near-new stock",
  },
  "Գրեթե նոր տրակտոր՝ ցուցադրական ժամերով։ Երևանի մոտ պահեստում։ Երաշխիքային սպասարկման հնարավորություն։": {
    ru: "Почти новый трактор с демонстрационными часами. Склад у Еревана. Возможность гарантийного сервиса.",
    en: "Near-new tractor with demo hours. Warehouse near Yerevan. Warranty service possible.",
  },
  // —— Plots (demo) ——
  "Մասիսի լոլիկի դաշտ": { ru: "Томатное поле Масис", en: "Masis tomato field" },
  "Արմավիրի ցորեն": { ru: "Пшеница Армавир", en: "Armavir wheat" },
  "Խաղողի այգի — Մասիս": { ru: "Виноградник — Масис", en: "Vineyard — Masis" },
  // —— Animals ——
  "Կաթնատու կովեր՝ Հոլշտայն, Արարատ": {
    ru: "Дойные коровы Holstein — Арарат",
    en: "Holstein dairy cows — Ararat",
  },
  "Երեք առողջ Հոլշտայն կովեր, օրական միջինը 22–26 լ կաթ։ Պատվաստումները արված են, փաստաթղթերը կան։ Վաճառվում են որպես խումբ կամ առանձին։ Հարմար է կաթնատնտեսության համար։": {
    ru: "Три здоровые коровы Holstein, в среднем 22–26 л молока в день. Прививки сделаны, документы есть. Продаются группой или по одной. Для молочного хозяйства.",
    en: "Three healthy Holstein cows, avg 22–26 L milk/day. Vaccinated, papers available. Sold as lot or individually. Suited for dairy.",
  },
  "Մսատու ցուլ՝ Արաբուղաղ, Լոռի": {
    ru: "Мясной бык Арабулах — Лори",
    en: "Arabughal beef bull — Lori",
  },
  "Լավ մարմնակազմությամբ ցուլ՝ բազմացման և մսի համար։ Խաղաղ բնավորություն, կերակրվել է խոտով և խտանյութով։ Կարող եք տեսնել տնտեսությունում։": {
    ru: "Бык хорошего телосложения для разведения и мяса. Спокойный характер, кормление сеном и концентратами. Можно посмотреть в хозяйстве.",
    en: "Well-built bull for breeding and beef. Calm temperament; hay and concentrate fed. Can view on the farm.",
  },
  "Ոչխարների երամակ՝ 45 գլուխ, Շիրակ": {
    ru: "Отара овец — 45 голов, Ширак",
    en: "Sheep flock — 45 head, Shirak",
  },
  "Խառը երամակ՝ մայրեր և գառներ։ Հիմնականում մսի և բրդի նպատակով։ Ամբողջական խումբով վաճառք՝ ավելի շահավետ։ Առողջական վիճակը լավ է։": {
    ru: "Смешанная отара: матки и ягнята. В основном на мясо и шерсть. Выгоднее всей группой. Здоровье хорошее.",
    en: "Mixed flock: ewes and lambs. Mostly meat and wool. Better as a full lot. Good health.",
  },
  "Կաթնատու այծեր՝ Զաանեն, Կոտայք": {
    ru: "Дойные козы Заанен — Котайк",
    en: "Saanen dairy goats — Kotayk",
  },
  "Ութ Զաանեն այծեր՝ կայուն կաթնատվությամբ։ Հարմար է փոքր ֆերմայի կամ ընտանեկան տնտեսության համար։ Պատվաստումներ արված։": {
    ru: "Восемь коз Заанен со стабильным удоем. Для небольшой фермы или семейного хозяйства. Прививки сделаны.",
    en: "Eight Saanen goats with steady milk yield. For a small farm or household. Vaccinated.",
  },
  "Խոզեր՝ մսատու երիտասարդներ, Արմավիր": {
    ru: "Свиньи — мясной молодняк, Армавир",
    en: "Pigs — meat youngstock, Armavir",
  },
  "Տասը երիտասարդ խոզ՝ մսի համար։ Կերակրված են ստանդարտ ռացիոնով։ Վաճառքը՝ խմբով։ Հնարավոր է տեսնել գոմում։": {
    ru: "Десять молодых свиней на мясо. Стандартный рацион. Продажа группой. Можно посмотреть в хлеву.",
    en: "Ten young pigs for meat. Standard ration. Sold as a lot. Can view in the barn.",
  },
  "Աշխատանքային ձի՝ Վայոց ձոր": {
    ru: "Рабочая лошадь — Вайоц Дзор",
    en: "Work horse — Vayots Dzor",
  },
  "Ուժեղ աշխատանքային ձի՝ դաշտային և լեռնային աշխատանքների համար։ Հանգիստ բնավորություն, սովոր է լծկանի։ Առողջ է, պայտերը կարգին։": {
    ru: "Сильная рабочая лошадь для полевых и горных работ. Спокойный характер, привык к упряжи. Здорова, копыта в порядке.",
    en: "Strong work horse for field and mountain work. Calm, harness-trained. Healthy, shoes/hooves OK.",
  },
  "Հավեր՝ ձվատու երամակ, Գեղարքունիք": {
    ru: "Куры — яйценоская партия, Гегаркуник",
    en: "Chickens — laying flock, Gegharkunik",
  },
  "120 ձվատու հավ՝ լավ արտադրողականությամբ։ Վանդակային/ազատ պահման փորձով։ Վաճառվում է որպես խումբ։": {
    ru: "120 несушек с хорошей продуктивностью. Опыт клеточного/выгульного содержания. Продаётся группой.",
    en: "120 laying hens with good productivity. Cage/free-range experience. Sold as a flock.",
  },
  "Մեղվաընտանիքներ՝ 20 փեթակ, Տավուշ": {
    ru: "Пчелосемьи — 20 ульев, Тавуш",
    en: "Bee colonies — 20 hives, Tavush",
  },
  "Ուժեղ մեղվաընտանիքներ՝ աշնանային մեղրի սեզոնից հետո։ Փեթակները ստանդարտ են։ Հարմար է սկսնակ և փորձառու մեղվապահի համար։": {
    ru: "Сильные семьи после осеннего медосбора. Ульи стандартные. Для начинающего и опытного пчеловода.",
    en: "Strong colonies after autumn honey season. Standard hives. For beginner or experienced beekeeper.",
  },
  "Հովվաշուն՝ Կովկասյան, Սյունիք": {
    ru: "Пастушья собака — кавказская, Сюник",
    en: "Herding/guard dog — Caucasian, Syunik",
  },
  "Երիտասարդ Կովկասյան հովվաշուն՝ հոտի և տնտեսության պահպանության համար։ Պատվաստված է, սովոր է գյուղական միջավայրին։": {
    ru: "Молодая кавказская овчарка для охраны стада и хозяйства. Привита, привыкла к сельской среде.",
    en: "Young Caucasian shepherd for flock and farm guard. Vaccinated, used to village life.",
  },
  // —— Catalog ——
  "NPK 15-15-15 · 50 կգ պարկեր": {
    ru: "NPK 15-15-15 · мешки 50 кг",
    en: "NPK 15-15-15 · 50 kg bags",
  },
  "Հանքային NPK 15-15-15՝ դաշտային մշակույթների համար։ Պարկերով 50 կգ։ Պահեստը՝ Կոտայքում։ Մանրամասն բաղադրությունը՝ պիտակի վրա։": {
    ru: "Минеральный NPK 15-15-15 для полевых культур. Мешки по 50 кг. Склад в Котайке. Состав на этикетке.",
    en: "Mineral NPK 15-15-15 for field crops. 50 kg bags. Warehouse in Kotayk. Full composition on the label.",
  },
  "Միզանյութ (urea) · մեծածախ": { ru: "Карбамид (urea) · оптом", en: "Urea · wholesale" },
  "Ազոտական պարարտանյութ ցորենի և բանջարեղենի համար։ Առաքում հնարավոր է մարզեր։": {
    ru: "Азотное удобрение для пшеницы и овощей. Возможна доставка по регионам.",
    en: "Nitrogen fertilizer for wheat and vegetables. Regional delivery possible.",
  },
  "Օրգանական կոմպոստ · 1 տ պարկեր": {
    ru: "Органический компост · мешки 1 т",
    en: "Organic compost · 1 t bags",
  },
  "Հասունացած կոմպոստ այգիների և ջերմոցների համար։ Առանց քիմիական հավելումների։": {
    ru: "Вызревший компост для садов и теплиц. Без химических добавок.",
    en: "Mature compost for orchards and greenhouses. No chemical additives.",
  },
  "Ցորենի սերմ · ծլունակություն 92%": {
    ru: "Семена пшеницы · всхожесть 92%",
    en: "Wheat seed · 92% germination",
  },
  "Սերտիֆիկացված ցորենի սերմ աշնանային ցանքի համար։ Պահեստը չոր է։": {
    ru: "Сертифицированные семена пшеницы для осеннего сева. Склад сухой.",
    en: "Certified wheat seed for autumn sowing. Dry storage.",
  },
  "Լոլիկի տնկիներ · բաց դաշտ": {
    ru: "Рассада томата · открытое поле",
    en: "Tomato seedlings · open field",
  },
  "Ուժեղ տնկիներ՝ բաց դաշտի համար։ Կարող եք վերցնել Մասիսից։": {
    ru: "Крепкая рассада для открытого поля. Можно забрать в Масисе.",
    en: "Strong seedlings for open field. Pickup in Masis.",
  },
  "Ալպիական խոտ · 20 տ": { ru: "Альпийское сено · 20 т", en: "Alpine hay · 20 t" },
  "Չոր ալպիական խոտ ոչխարների և խոշոր եղջերավորների համար։": {
    ru: "Сухое альпийское сено для овец и КРС.",
    en: "Dry alpine hay for sheep and cattle.",
  },
  "Ֆունգիցիդ այգիների համար": { ru: "Фунгицид для садов", en: "Fungicide for orchards" },
  "Դաշտային/այգու ֆունգիցիդ։ Հետևեք պիտակի հրահանգներին։ Սա բժշկական խորհուրդ չէ։": {
    ru: "Фунгицид для поля/сада. Следуйте инструкции на этикетке. Это не медицинская рекомендация.",
    en: "Field/orchard fungicide. Follow the label. Not medical advice.",
  },
  "Կաթիլային ոռոգման հավաքածու · 1 հա": {
    ru: "Комплект капельного полива · 1 га",
    en: "Drip irrigation kit · 1 ha",
  },
  "Կաթիլային գծեր, ֆիլտր և կցորդներ՝ մոտ 1 հա-ի համար։": {
    ru: "Капельные линии, фильтр и фитинги примерно на 1 га.",
    en: "Drip lines, filter and fittings for about 1 ha.",
  },
  "2.5 հա վարելահող՝ ոռոգմամբ, Արարատ": {
    ru: "2,5 га пашни с поливом, Арарат",
    en: "2.5 ha irrigated arable land, Ararat",
  },
  "Վաճառք։ Ոռոգման հասանելիություն կա։ Հարմար է բանջարեղենի համար։": {
    ru: "Продажа. Есть доступ к поливу. Подходит для овощей.",
    en: "For sale. Water access available. Suited for vegetables.",
  },
};

/** Yield assumption notes stored from seed (hy locale). */
const ASSUMPTION_NOTES: Record<string, Tri> = {
  "Բաց դաշտ · ոռոգվող · միջին սորտ · առանց ջերմոցի խտության": {
    ru: "Открытое поле · полив · средний сорт · не тепличная плотность",
    en: "Open field · irrigated · mid cultivar · not greenhouse density",
  },
  "Ցորեն · ոչ ոռոգվող/մասամբ ոռոգվող միջին ՀՀ": {
    ru: "Пшеница · богар / частичный полив, средний РА",
    en: "Wheat · rainfed/partial irrigation Armenia mid",
  },
  "Խաղողի այգի · սեղանի/գինու միջին · առանց երաշտի սցենարի": {
    ru: "Виноградник · средний диапазон · без засухи",
    en: "Vineyard mid-range · table/wine · no drought scenario",
  },
};

function pick(tri: Tri, locale: string): string {
  if (locale === "ru") return tri.ru;
  return tri.en;
}

/** Translate seeded demo text; leave user-authored content unchanged. */
export function tContent(locale: string, text: string | null | undefined): string {
  if (!text) return "";
  if (locale === "hy") return text;

  const exact = SEED_TEXT[text] || ASSUMPTION_NOTES[text];
  if (exact) return pick(exact, locale);

  // Dynamic future-harvest descriptions from seed
  const plotEst = text.match(
    /^Հողամասից կանխատեսում՝ ([\d.]+)–([\d.]+) տ \(ֆերմերի նշում՝ ([\d.]+) տ\)\.\s*([\s\S]*)$/
  );
  if (plotEst) {
    const note = tContent(locale, plotEst[4]);
    if (locale === "ru") {
      return `Прогноз с участка: ${plotEst[1]}–${plotEst[2]} т (оценка фермера: ${plotEst[3]} т). ${note}`;
    }
    return `Plot forecast: ${plotEst[1]}–${plotEst[2]} t (farmer note: ${plotEst[3]} t). ${note}`;
  }

  const expected = text.match(/^Ակնկալվող՝ ([\d.]+)–([\d.]+) տ\.\s*([\s\S]*)$/);
  if (expected) {
    const note = tContent(locale, expected[3]);
    if (locale === "ru") return `Ожидается: ${expected[1]}–${expected[2]} т. ${note}`;
    return `Expected: ${expected[1]}–${expected[2]} t. ${note}`;
  }

  return text;
}

export function localeTag(locale: string): string {
  if (locale === "ru") return "ru-RU";
  if (locale === "en") return "en-US";
  return "hy-AM";
}

export function formatLocaleDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
