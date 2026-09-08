/**
 * One-shot generator: writes data/products.json + patches products/productCategories in hy/en/ru.
 * Run: node scripts/expand-product-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @typedef {{ id: string, hy: string, en: string, ru: string, featured?: boolean }} Item */
/** @typedef {{ id: string, hy: string, en: string, ru: string, sortOrder: number, items: Item[] }} Cat */

/** @type {Cat[]} */
const CATS = [
  {
    id: "vegetables",
    hy: "Բանջարեղեն",
    en: "Vegetables",
    ru: "Овощи",
    sortOrder: 1,
    items: [
      { id: "tomato", hy: "Լոլիկ", en: "Tomato", ru: "Томат", featured: true },
      { id: "potato", hy: "Կարտոֆիլ", en: "Potato", ru: "Картофель", featured: true },
      { id: "cucumber", hy: "Վարունգ", en: "Cucumber", ru: "Огурец", featured: true },
      { id: "onion", hy: "Սոխ", en: "Onion", ru: "Лук", featured: true },
      { id: "pepper", hy: "Պղպեղ", en: "Pepper", ru: "Перец" },
      { id: "bell-pepper", hy: "Բուլղարական պղպեղ", en: "Bell pepper", ru: "Болгарский перец" },
      { id: "hot-pepper", hy: "Կծու պղպեղ", en: "Hot pepper", ru: "Острый перец" },
      { id: "eggplant", hy: "Սմբուկ", en: "Eggplant", ru: "Баклажан" },
      { id: "cabbage", hy: "Կաղամբ", en: "Cabbage", ru: "Капуста" },
      { id: "red-cabbage", hy: "Կարմիր կաղամբ", en: "Red cabbage", ru: "Краснокочанная капуста" },
      { id: "cauliflower", hy: "Ծաղկակաղամբ", en: "Cauliflower", ru: "Цветная капуста" },
      { id: "broccoli", hy: "Բրոկկոլի", en: "Broccoli", ru: "Брокколи" },
      { id: "kohlrabi", hy: "Կոլրաբի", en: "Kohlrabi", ru: "Кольраби" },
      { id: "brussels-sprouts", hy: "Բրյուսելյան կաղամբ", en: "Brussels sprouts", ru: "Брюссельская капуста" },
      { id: "chinese-cabbage", hy: "Պեկինյան կաղամբ", en: "Chinese cabbage", ru: "Пекинская капуста" },
      { id: "carrot", hy: "Գազար", en: "Carrot", ru: "Морковь" },
      { id: "garlic", hy: "Սխտոր", en: "Garlic", ru: "Чеснок" },
      { id: "beet", hy: "Ճակնդեղ", en: "Beet", ru: "Свёкла" },
      { id: "radish", hy: "Բողկ", en: "Radish", ru: "Редис" },
      { id: "daikon", hy: "Դայկոն", en: "Daikon", ru: "Дайкон" },
      { id: "turnip", hy: "Շաղգամ", en: "Turnip", ru: "Репа" },
      { id: "horseradish", hy: "Ծովաբողկ", en: "Horseradish", ru: "Хрен" },
      { id: "celery", hy: "Նեխուր", en: "Celery", ru: "Сельдерей" },
      { id: "leek", hy: "Պրաս", en: "Leek", ru: "Лук-порей" },
      { id: "shallot", hy: "Շալոտ", en: "Shallot", ru: "Шалот" },
      { id: "spinach", hy: "Սպանախ", en: "Spinach", ru: "Шпинат" },
      { id: "lettuce", hy: "Հազար", en: "Lettuce", ru: "Салат" },
      { id: "swiss-chard", hy: "Տերևային ճակնդեղ", en: "Swiss chard", ru: "Мангольд" },
      { id: "arugula", hy: "Ռուկոլա", en: "Arugula", ru: "Руккола" },
      { id: "greens", hy: "Կանաչի", en: "Greens", ru: "Зелень" },
      { id: "zucchini", hy: "Ցուկինի", en: "Zucchini", ru: "Цукини" },
      { id: "squash", hy: "Դդմիկ", en: "Summer squash", ru: "Кабачок" },
      { id: "pumpkin", hy: "Դդում", en: "Pumpkin", ru: "Тыква" },
      { id: "pattypan", hy: "Պատիսոն", en: "Pattypan squash", ru: "Патиссон" },
      { id: "beans", hy: "Լոբի", en: "Beans", ru: "Фасоль" },
      { id: "green-beans", hy: "Կանաչ լոբի", en: "Green beans", ru: "Стручковая фасоль" },
      { id: "peas", hy: "Ոլոռ", en: "Peas", ru: "Горох" },
      { id: "chickpeas", hy: "Սիսեռ", en: "Chickpeas", ru: "Нут" },
      { id: "lentils", hy: "Ոսպ", en: "Lentils", ru: "Чечевица" },
      { id: "okra", hy: "Բամիա", en: "Okra", ru: "Бамия" },
      { id: "asparagus", hy: "Ծնեբեկ", en: "Asparagus", ru: "Спаржа" },
      { id: "artichoke", hy: "Արտիճոկ", en: "Artichoke", ru: "Артишок" },
      { id: "jerusalem-artichoke", hy: "Տոպինամբուր", en: "Jerusalem artichoke", ru: "Топинамбур" },
      { id: "sweet-potato", hy: "Քաղցր կարտոֆիլ", en: "Sweet potato", ru: "Батат" },
      { id: "rhubarb", hy: "Խավարծիլ", en: "Rhubarb", ru: "Ревень" },
      { id: "fennel-bulb", hy: "Ֆենխել", en: "Fennel bulb", ru: "Фенхель" },
      { id: "cherry-tomato", hy: "Չերի լոլիկ", en: "Cherry tomato", ru: "Черри томаты" },
      { id: "cucumber-gherkin", hy: "Երիտասարդ վարունգ", en: "Gherkin", ru: "Корнишоны" },
    ],
  },
  {
    id: "fruits",
    hy: "Մրգեր",
    en: "Fruits",
    ru: "Фрукты",
    sortOrder: 2,
    items: [
      { id: "grape", hy: "Խաղող", en: "Grape", ru: "Виноград", featured: true },
      { id: "apple", hy: "Խնձոր", en: "Apple", ru: "Яблоко", featured: true },
      { id: "peach", hy: "Դեղձ", en: "Peach", ru: "Персик", featured: true },
      { id: "apricot", hy: "Ծիրան", en: "Apricot", ru: "Абрикос", featured: true },
      { id: "plum", hy: "Սալոր", en: "Plum", ru: "Слива" },
      { id: "cherry", hy: "Բալ", en: "Sour cherry", ru: "Вишня" },
      { id: "sweet-cherry", hy: "Կեռաս", en: "Sweet cherry", ru: "Черешня" },
      { id: "pear", hy: "Տանձ", en: "Pear", ru: "Груша" },
      { id: "pomegranate", hy: "Նուռ", en: "Pomegranate", ru: "Гранат", featured: true },
      { id: "quince", hy: "Սերկևիլ", en: "Quince", ru: "Айва" },
      { id: "fig", hy: "Թուզ", en: "Fig", ru: "Инжир" },
      { id: "persimmon", hy: "Խուրմա", en: "Persimmon", ru: "Хурма" },
      { id: "mulberry", hy: "Թութ", en: "Mulberry", ru: "Шелковица" },
      { id: "nectarine", hy: "Նեկտարին", en: "Nectarine", ru: "Нектарин" },
      { id: "watermelon", hy: "Ձմերուկ", en: "Watermelon", ru: "Арбуз" },
      { id: "melon", hy: "Սեխ", en: "Melon", ru: "Дыня" },
      { id: "dogwood", hy: "Հոն", en: "Cornelian cherry", ru: "Кизил" },
      { id: "medlar", hy: "Զկեռ", en: "Medlar", ru: "Мушмула" },
      { id: "loquat", hy: "Մուշմուլա", en: "Loquat", ru: "Мушмула японская" },
      { id: "jujube", hy: "Ունաբ", en: "Jujube", ru: "Унаби" },
      { id: "olive", hy: "Ձիթապտուղ", en: "Olive", ru: "Олива" },
      { id: "lemon", hy: "Կիտրոն", en: "Lemon", ru: "Лимон" },
      { id: "orange", hy: "Նարինջ", en: "Orange", ru: "Апельсин" },
      { id: "tangerine", hy: "Մանդարին", en: "Tangerine", ru: "Мандарин" },
      { id: "grapefruit", hy: "Գրեյպֆրուտ", en: "Grapefruit", ru: "Грейпфрут" },
      { id: "kiwi", hy: "Կիվի", en: "Kiwi", ru: "Киви" },
      { id: "feijoa", hy: "Ֆեյխոա", en: "Feijoa", ru: "Фейхоа" },
      { id: "avocado", hy: "Ավոկադո", en: "Avocado", ru: "Авокадо" },
      { id: "berry", hy: "Հատապտուղ", en: "Berry (mixed)", ru: "Ягоды (смесь)" },
    ],
  },
  {
    id: "berries",
    hy: "Հատապտուղներ",
    en: "Berries",
    ru: "Ягоды",
    sortOrder: 3,
    items: [
      { id: "strawberry", hy: "Ելակ", en: "Strawberry", ru: "Клубника", featured: true },
      { id: "raspberry", hy: "Ազնվամորի", en: "Raspberry", ru: "Малина" },
      { id: "blackberry", hy: "Մոշ", en: "Blackberry", ru: "Ежевика" },
      { id: "blueberry", hy: "Հապալաս", en: "Blueberry", ru: "Черника" },
      { id: "blackcurrant", hy: "Սև հաղարջ", en: "Blackcurrant", ru: "Чёрная смородина" },
      { id: "redcurrant", hy: "Կարմիր հաղարջ", en: "Redcurrant", ru: "Красная смородина" },
      { id: "gooseberry", hy: "Ղոշտ", en: "Gooseberry", ru: "Крыжовник" },
      { id: "sea-buckthorn", hy: "Չիչխան", en: "Sea buckthorn", ru: "Облепиха" },
      { id: "rosehip", hy: "Մասուր", en: "Rosehip", ru: "Шиповник" },
      { id: "barberry", hy: "Զրնգենի", en: "Barberry", ru: "Барбарис" },
      { id: "elderberry", hy: "Թանթռվիկ", en: "Elderberry", ru: "Бузина" },
      { id: "cranberry", hy: "Լոռամրգի", en: "Cranberry", ru: "Клюква" },
    ],
  },
  {
    id: "nuts",
    hy: "Ընկույզներ",
    en: "Nuts",
    ru: "Орехи",
    sortOrder: 4,
    items: [
      { id: "walnut", hy: "Ընկույզ", en: "Walnut", ru: "Грецкий орех", featured: true },
      { id: "almond", hy: "Նուշ", en: "Almond", ru: "Миндаль" },
      { id: "hazelnut", hy: "Պնդուկ", en: "Hazelnut", ru: "Фундук" },
      { id: "pistachio", hy: "Պիստակ", en: "Pistachio", ru: "Фисташка" },
      { id: "chestnut", hy: "Շագանակ", en: "Chestnut", ru: "Каштан" },
      { id: "peanut", hy: "Գետնանուշ", en: "Peanut", ru: "Арахис" },
      { id: "pine-nut", hy: "Սոճու ընկույզ", en: "Pine nut", ru: "Кедровый орех" },
    ],
  },
  {
    id: "grains",
    hy: "Հացահատիկ և յուղատու",
    en: "Grains & oilseeds",
    ru: "Зерновые и масличные",
    sortOrder: 5,
    items: [
      { id: "wheat", hy: "Ցորեն", en: "Wheat", ru: "Пшеница", featured: true },
      { id: "barley", hy: "Գարի", en: "Barley", ru: "Ячмень" },
      { id: "corn", hy: "Եգիպտացորեն", en: "Corn", ru: "Кукуруза" },
      { id: "oats", hy: "Վարսակ", en: "Oats", ru: "Овёс" },
      { id: "rye", hy: "Տարեկան", en: "Rye", ru: "Рожь" },
      { id: "millet", hy: "Կորեկ", en: "Millet", ru: "Просо" },
      { id: "buckwheat", hy: "Հնդկացորեն", en: "Buckwheat", ru: "Гречиха" },
      { id: "rice", hy: "Բրինձ", en: "Rice", ru: "Рис" },
      { id: "spelt", hy: "Հաճար", en: "Spelt / emmer", ru: "Полба" },
      { id: "triticale", hy: "Տրիտիկալե", en: "Triticale", ru: "Тритикале" },
      { id: "sorghum", hy: "Սորգո", en: "Sorghum", ru: "Сорго" },
      { id: "sunflower", hy: "Արևածաղիկ", en: "Sunflower", ru: "Подсолнечник" },
      { id: "flax", hy: "Կտավատ", en: "Flax", ru: "Лён" },
      { id: "sesame", hy: "Քունջութ", en: "Sesame", ru: "Кунжут" },
      { id: "rapeseed", hy: "Ռապս", en: "Rapeseed", ru: "Рапс" },
      { id: "soybean", hy: "Սոյա", en: "Soybean", ru: "Соя" },
    ],
  },
  {
    id: "forage",
    hy: "Կեր և խոտ",
    en: "Forage & hay",
    ru: "Корма и сено",
    sortOrder: 6,
    items: [
      { id: "hay", hy: "Խոտ", en: "Hay", ru: "Сено", featured: true },
      { id: "alfalfa", hy: "Առվույտ", en: "Alfalfa", ru: "Люцерна" },
      { id: "clover", hy: "Երեքնուկ", en: "Clover", ru: "Клевер" },
      { id: "silage", hy: "Սիլոս", en: "Silage", ru: "Силос" },
      { id: "straw", hy: "Ծղոտ", en: "Straw", ru: "Солома" },
      { id: "vetch", hy: "Վիկա", en: "Vetch", ru: "Вика" },
      { id: "sudan-grass", hy: "Սուդանի խոտ", en: "Sudan grass", ru: "Суданская трава" },
      { id: "maize-silage", hy: "Եգիպտացորենի սիլոս", en: "Maize silage", ru: "Кукурузный силос" },
      { id: "pasture-grass", hy: "Արոտային խոտ", en: "Pasture grass", ru: "Пастбищная трава" },
      { id: "fodder-beet", hy: "Կերային ճակնդեղ", en: "Fodder beet", ru: "Кормовая свёкла" },
      { id: "compound-feed", hy: "Խառը կեր", en: "Compound feed", ru: "Комбикорм" },
    ],
  },
  {
    id: "herbs",
    hy: "Խոտաբույսեր և համեմունքներ",
    en: "Herbs & spices",
    ru: "Травы и специи",
    sortOrder: 7,
    items: [
      { id: "dill", hy: "Սամիթ", en: "Dill", ru: "Укроп" },
      { id: "parsley", hy: "Մաղադանոս", en: "Parsley", ru: "Петрушка" },
      { id: "cilantro", hy: "Գինձ", en: "Cilantro", ru: "Кинза" },
      { id: "basil", hy: "Ռեհան", en: "Basil", ru: "Базилик" },
      { id: "mint", hy: "Անանուխ", en: "Mint", ru: "Мята" },
      { id: "thyme", hy: "Ուրց", en: "Thyme", ru: "Тимьян" },
      { id: "oregano", hy: "Օրեգանո", en: "Oregano", ru: "Орегано" },
      { id: "rosemary", hy: "Խնկունի", en: "Rosemary", ru: "Розмарин" },
      { id: "tarragon", hy: "Թարխուն", en: "Tarragon", ru: "Тархун" },
      { id: "savory", hy: "Ծոթրին", en: "Summer savory", ru: "Чабер" },
      { id: "fenugreek", hy: "Շամբալա", en: "Fenugreek", ru: "Пажитник" },
      { id: "saffron", hy: "Զաֆրան", en: "Saffron", ru: "Шафран" },
      { id: "bay-leaf", hy: "Դափնու տերև", en: "Bay leaf", ru: "Лавровый лист" },
      { id: "suneli", hy: "Խմելի-սունելի", en: "Khmeli-suneli", ru: "Хмели-сунели" },
      { id: "paprika", hy: "Պապրիկա", en: "Paprika", ru: "Паприка" },
      { id: "wild-thyme", hy: "Վայրի ուրց", en: "Wild thyme", ru: "Чабрец" },
      { id: "lavender", hy: "Նարդոս", en: "Lavender", ru: "Лаванда" },
    ],
  },
  {
    id: "dairy",
    hy: "Կաթնամթերք",
    en: "Dairy",
    ru: "Молочные продукты",
    sortOrder: 8,
    items: [
      { id: "milk", hy: "Կաթ", en: "Milk", ru: "Молоко", featured: true },
      { id: "cheese", hy: "Պանիր", en: "Cheese", ru: "Сыр", featured: true },
      { id: "yogurt", hy: "Մածուն", en: "Matsun / yogurt", ru: "Мацун" },
      { id: "butter", hy: "Կարագ", en: "Butter", ru: "Масло" },
      { id: "tan", hy: "Թան", en: "Tan", ru: "Тан" },
      { id: "sour-cream", hy: "Թթվասեր", en: "Sour cream", ru: "Сметана" },
      { id: "cottage-cheese", hy: "Կաթնաշոռ", en: "Cottage cheese", ru: "Творог" },
      { id: "cream", hy: "Սերուցք", en: "Cream", ru: "Сливки" },
      { id: "lori-cheese", hy: "Լոռի պանիր", en: "Lori cheese", ru: "Сыр Лори" },
      { id: "chanakh", hy: "Չանախ", en: "Chanakh cheese", ru: "Чанах" },
      { id: "chechil", hy: "Չեչիլ", en: "Chechil", ru: "Чечил" },
      { id: "goat-milk", hy: "Այծի կաթ", en: "Goat milk", ru: "Козье молоко" },
      { id: "sheep-milk", hy: "Ոչխարի կաթ", en: "Sheep milk", ru: "Овечье молоко" },
      { id: "whey", hy: "Շիճուկ", en: "Whey", ru: "Сыворотка" },
      { id: "ghee", hy: "Հալած կարագ", en: "Ghee / clarified butter", ru: "Топлёное масло" },
    ],
  },
  {
    id: "eggs",
    hy: "Ձու",
    en: "Eggs",
    ru: "Яйца",
    sortOrder: 9,
    items: [
      { id: "chicken-eggs", hy: "Հավի ձու", en: "Chicken eggs", ru: "Куриные яйца", featured: true },
      { id: "quail-eggs", hy: "Լորի ձու", en: "Quail eggs", ru: "Перепелиные яйца" },
      { id: "duck-eggs", hy: "Բադի ձու", en: "Duck eggs", ru: "Утиные яйца" },
    ],
  },
  {
    id: "meat",
    hy: "Միս և թռչնամիս",
    en: "Meat & poultry",
    ru: "Мясо и птица",
    sortOrder: 10,
    items: [
      { id: "chicken", hy: "Հավ", en: "Chicken", ru: "Курица" },
      { id: "turkey", hy: "Հնդկահավ", en: "Turkey", ru: "Индейка" },
      { id: "beef", hy: "Տավարի միս", en: "Beef", ru: "Говядина" },
      { id: "lamb", hy: "Գառան միս", en: "Lamb", ru: "Ягнятина" },
      { id: "mutton", hy: "Ոչխարի միս", en: "Mutton", ru: "Баранина" },
      { id: "pork", hy: "Խոզի միս", en: "Pork", ru: "Свинина" },
      { id: "rabbit", hy: "Նապաստակ", en: "Rabbit", ru: "Кролик" },
      { id: "duck", hy: "Բադ", en: "Duck", ru: "Утка" },
      { id: "goose", hy: "Սագ", en: "Goose", ru: "Гусь" },
      { id: "goat-meat", hy: "Այծի միս", en: "Goat meat", ru: "Козлятина" },
    ],
  },
  {
    id: "honey",
    hy: "Մեղր և պահածո",
    en: "Honey & preserves",
    ru: "Мёд и консервы",
    sortOrder: 11,
    items: [
      { id: "honey", hy: "Մեղր", en: "Honey", ru: "Мёд", featured: true },
      { id: "jam", hy: "Մուրաբա", en: "Jam", ru: "Варенье" },
      { id: "compote", hy: "Կոմպոտ", en: "Compote", ru: "Компот" },
      { id: "fruit-leather", hy: "Պաստեղ", en: "Fruit leather", ru: "Пастила" },
      { id: "syrup", hy: "Օշարակ", en: "Fruit syrup", ru: "Сироп" },
      { id: "pickles", hy: "Թթու", en: "Pickles", ru: "Соленья" },
      { id: "tomato-paste", hy: "Լոլիկի մածուկ", en: "Tomato paste", ru: "Томатная паста" },
      { id: "beeswax", hy: "Մեղրամոմ", en: "Beeswax", ru: "Пчелиный воск" },
      { id: "propolis", hy: "Պրոպոլիս", en: "Propolis", ru: "Прополис" },
      { id: "royal-jelly", hy: "Մայրական կաթ", en: "Royal jelly", ru: "Маточное молочко" },
      { id: "bee-pollen", hy: "Ծաղկափոշի", en: "Bee pollen", ru: "Пыльца" },
      { id: "flower-honey", hy: "Ծաղկային մեղր", en: "Flower honey", ru: "Цветочный мёд" },
      { id: "mountain-honey", hy: "Լեռնային մեղր", en: "Mountain honey", ru: "Горный мёд" },
    ],
  },
  {
    id: "dried",
    hy: "Չիր և չոր մթերք",
    en: "Dried goods",
    ru: "Сухофрукты и сушёное",
    sortOrder: 12,
    items: [
      { id: "dried-apricot", hy: "Ծիրանի չիր", en: "Dried apricot", ru: "Курага" },
      { id: "dried-peach", hy: "Դեղձի չիր", en: "Dried peach", ru: "Сушёный персик" },
      { id: "dried-plum", hy: "Սալորի չիր", en: "Prunes", ru: "Чернослив" },
      { id: "raisins", hy: "Չամիչ", en: "Raisins", ru: "Изюм" },
      { id: "dried-fig", hy: "Թզի չիր", en: "Dried fig", ru: "Сушёный инжир" },
      { id: "dried-apple", hy: "Խնձորի չիր", en: "Dried apple", ru: "Сушёное яблоко" },
      { id: "dried-mulberry", hy: "Թթի չիր", en: "Dried mulberry", ru: "Сушёная шелковица" },
      { id: "dried-persimmon", hy: "Խուրմայի չիր", en: "Dried persimmon", ru: "Сушёная хурма" },
      { id: "dried-herbs", hy: "Չոր խոտաբույսեր", en: "Dried herbs", ru: "Сушёные травы" },
      { id: "sun-dried-tomato", hy: "Արևային լոլիկ", en: "Sun-dried tomato", ru: "Вяленые томаты" },
    ],
  },
  {
    id: "mushrooms",
    hy: "Սունկ",
    en: "Mushrooms",
    ru: "Грибы",
    sortOrder: 13,
    items: [
      { id: "champignon", hy: "Շամպինիոն", en: "Champignon", ru: "Шампиньон" },
      { id: "oyster-mushroom", hy: "Ոստրե սունկ", en: "Oyster mushroom", ru: "Вёшенка" },
      { id: "wild-mushroom", hy: "Անտառային սունկ", en: "Wild mushrooms", ru: "Лесные грибы" },
      { id: "porcini", hy: "Սպիտակ սունկ", en: "Porcini", ru: "Белый гриб" },
      { id: "morel", hy: "Խոզասունկ", en: "Morel", ru: "Сморчок" },
    ],
  },
  {
    id: "wine",
    hy: "Գինի և խաղողի մթերք",
    en: "Wine & grape products",
    ru: "Вино и продукты винограда",
    sortOrder: 14,
    items: [
      { id: "wine", hy: "Գինի", en: "Wine", ru: "Вино" },
      { id: "grape-must", hy: "Խաղողի մուստ", en: "Grape must", ru: "Виноградное сусло" },
      { id: "grape-juice", hy: "Խաղողի հյութ", en: "Grape juice", ru: "Виноградный сок" },
      { id: "vinegar", hy: "Քացախ", en: "Vinegar", ru: "Уксус" },
      { id: "grape-leaves", hy: "Խաղողի տերև", en: "Grape leaves", ru: "Виноградные листья" },
      { id: "grape-seed-oil", hy: "Խաղողի կորիզի ձեթ", en: "Grape seed oil", ru: "Масло виноградных косточек" },
      { id: "oghee", hy: "Օղի", en: "Oghee / fruit spirit", ru: "Оги / фруктовый спирт" },
      { id: "areni", hy: "Արենի գինի", en: "Areni wine", ru: "Вино Арени" },
    ],
  },
  {
    id: "seedlings",
    hy: "Սածիլներ և տնկիներ",
    en: "Seedlings & saplings",
    ru: "Рассада и саженцы",
    sortOrder: 15,
    items: [
      { id: "fruit-saplings", hy: "Մրգատու տնկիներ", en: "Fruit saplings", ru: "Плодовые саженцы" },
      { id: "grape-cuttings", hy: "Խաղողի կտրոններ", en: "Grape cuttings", ru: "Черенки винограда" },
      { id: "vegetable-seedlings", hy: "Բանջարեղենի սածիլներ", en: "Vegetable seedlings", ru: "Овощная рассада" },
      { id: "flower-seedlings", hy: "Ծաղկի տնկիներ", en: "Flower seedlings", ru: "Цветочная рассада" },
      { id: "tree-saplings", hy: "Ծառատունկ", en: "Tree saplings", ru: "Саженцы деревьев" },
      { id: "berry-plants", hy: "Հատապտղի տնկիներ", en: "Berry plants", ru: "Саженцы ягодных" },
      { id: "seeds-pack", hy: "Սերմեր", en: "Seeds", ru: "Семена" },
    ],
  },
  {
    id: "flowers",
    hy: "Ծաղիկներ",
    en: "Flowers",
    ru: "Цветы",
    sortOrder: 16,
    items: [
      { id: "rose", hy: "Վարդ", en: "Rose", ru: "Роза" },
      { id: "tulip", hy: "Կակաչ", en: "Tulip", ru: "Тюльпан" },
      { id: "gladiolus", hy: "Թրաշուշան", en: "Gladiolus", ru: "Гладиолус" },
      { id: "cut-flowers", hy: "Կտրված ծաղիկներ", en: "Cut flowers", ru: "Срезанные цветы" },
      { id: "ornamental-plants", hy: "Դեկորատիվ բույսեր", en: "Ornamental plants", ru: "Декоративные растения" },
      { id: "chrysanthemum", hy: "Քրիզանթեմ", en: "Chrysanthemum", ru: "Хризантема" },
    ],
  },
  {
    id: "other",
    hy: "Այլ",
    en: "Other",
    ru: "Другое",
    sortOrder: 17,
    items: [
      { id: "wool", hy: "Բուրդ", en: "Wool", ru: "Шерсть" },
      { id: "manure", hy: "Գոմաղբ", en: "Manure", ru: "Навоз" },
      { id: "firewood", hy: "Վառելափայտ", en: "Firewood", ru: "Дрова" },
      { id: "charcoal", hy: "Ածուխ", en: "Charcoal", ru: "Древесный уголь" },
      { id: "sunflower-oil", hy: "Արևածաղկի ձեթ", en: "Sunflower oil", ru: "Подсолнечное масло" },
      { id: "walnut-oil", hy: "Ընկույզի ձեթ", en: "Walnut oil", ru: "Ореховое масло" },
      { id: "other", hy: "Այլ ապրանք", en: "Other product", ru: "Другой продукт", featured: true },
    ],
  },
];

const categories = CATS.map((c) => ({
  id: c.id,
  nameKey: `productCategories.${c.id}`,
  sortOrder: c.sortOrder,
}));

const products = [];
let sortBase = 0;
for (const cat of CATS) {
  sortBase = cat.sortOrder * 100;
  cat.items.forEach((item, i) => {
    products.push({
      id: item.id,
      slug: item.id,
      nameKey: `products.${item.id}`,
      category: cat.id,
      featured: !!item.featured,
      sortOrder: sortBase + i + 1,
    });
  });
}

// uniqueness check
const ids = new Set();
for (const p of products) {
  if (ids.has(p.id)) throw new Error(`Duplicate id: ${p.id}`);
  ids.add(p.id);
}

const catalog = { categories, products };
writeFileSync(join(root, "data", "products.json"), JSON.stringify(catalog, null, 2) + "\n", "utf8");

function patchMessages(locale) {
  const path = join(root, "messages", `${locale}.json`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  const catMap = {};
  const prodMap = {};
  for (const cat of CATS) {
    catMap[cat.id] = cat[locale];
    for (const item of cat.items) {
      prodMap[item.id] = item[locale];
    }
  }
  data.productCategories = catMap;
  data.products = prodMap;
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

patchMessages("hy");
patchMessages("en");
patchMessages("ru");

const byCat = {};
for (const p of products) {
  byCat[p.category] = (byCat[p.category] || 0) + 1;
}
const featured = products.filter((p) => p.featured).length;
console.log(JSON.stringify({ total: products.length, featured, byCat }, null, 2));
