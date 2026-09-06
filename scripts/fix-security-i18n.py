#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Apply targeted fixes to security translations."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MESSAGES = ROOT / "messages"


def load(name: str) -> dict:
    return json.loads((MESSAGES / name).read_text(encoding="utf-8"))


def save(name: str, data: dict) -> None:
    (MESSAGES / name).write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def replace_all(obj, mapping: dict[str, str]) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str) and v in mapping:
                obj[k] = mapping[v]
            else:
                replace_all(v, mapping)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            if isinstance(item, str) and item in mapping:
                obj[i] = mapping[item]
            else:
                replace_all(item, mapping)


def main() -> None:
    hy = load("hy.json")
    sec = hy["pages"]["security"]
    privacy_title = hy["pages"]["privacy"]["title"]
    terms_title = hy["pages"]["terms"]["title"]

    mapping = {
        sec["introBody"]: (
            "Xndzor / \u053d\u0576\u057f\u0578\u0580\u0568 \u056c\u0578\u0582\u0580\u057b \u0567 "
            "\u057e\u0565\u0580\u0561\u0562\u0565\u0580\u057e\u0578\u0582\u0574 \u0585\u0563\u057f\u0561\u057f\u0565\u0580\u0565\u0580\u056b "
            "\u0561\u0576\u057e\u057f\u0561\u0576\u0563\u0578\u0582\u0569\u0575\u0561\u0576\u0589 "
            "\u0544\u0565\u0576\u0584 \u057a\u0561\u0577\u057f\u057a\u0561\u0576\u0578\u0582\u0574\u0565\u0576\u0584 \u0571\u0565\u0580 "
            "\u057f\u057e\u0575\u0561\u056c\u0576\u0565\u0580\u0568 \u0587 \u0585\u0563\u0576\u0578\u0582\u0574 \u0561\u0576\u057e\u057f\u0561\u0576\u0563 "
            "\u0563\u0578\u0580\u0581\u0561\u0580\u0582\u0576\u0565\u0580 \u0561\u0576\u0565\u056c "
            "\u0563\u0575\u0578\u0582\u0561\u057f\u0576\u057f\u0565\u057d\u0561\u056f\u0561\u0576 "
            "\u0577\u0578\u0582\u056f\u0561\u0575\u0578\u0582\u0574\u0589"
        ),
    }

    sec["dataProtection"]["body"] = [
        "\u053f\u0561\u0575\u0584\u0568 \u0561\u0577\u056d\u0561\u057f\u0578\u0582\u0574 \u0567 \u0561\u057a\u0561\u0570\u0578\u057e \u056f\u0561\u057a\u0578\u057e (HTTPS) \u2014 \u0571\u0565\u0580 \u057f\u0565\u0572\u0565\u056f\u0578\u0582\u0569\u0575\u0578\u0582\u0576 \u0583\u0578\u056d\u0561\u0576\u0581\u057e\u0578\u0582\u0574 \u0567 \u056f\u0578\u0564\u0561\u057e\u0578\u0580\u057e\u0561\u056e \u0571\u0565\u057e\u0578\u057e\u0589",
        "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u0580\u0565\u0580\u0568 \u057a\u0561\u0570\u057e\u0578\u0582\u0574 \u0565\u0576 \u0570\u0561\u057f\u0578\u0582\u056f \u056f\u0578\u0564\u0561\u057e\u0578\u0580\u0574\u0561\u0574\u0562 \u2014 \u0574\u0565\u0576\u0584 \u0571\u0565\u0580 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u0580\u0568 \u057f\u0565\u057d\u0576\u0565\u056c \u0579\u0565\u0576\u0584 \u056f\u0561\u0580\u0578\u0572\u0561\u0576\u0589",
        "\u0544\u0578\u0582\u057f\u0584\u056b \u0570\u0561\u0574\u0561\u0580 \u055d\u0563\u057f\u0561\u0563\u0578\u0580\u056e\u057e\u0578\u0582\u0574 \u057f\u0565\u0572\u0565\u056f\u0578\u0582\u0569\u0575\u0578\u0582\u0576 \u057a\u0561\u0577\u057f\u057a\u0561\u0576\u057e\u0561\u056e \u0567, \u0578\u0580\u057a\u0565\u057d\u0566\u056b \u0561\u0575\u056c \u056f\u0561\u0575\u0584\u0565\u0580 \u0579\u056f\u0561\u0580\u0578\u0572\u0561\u0576\u0561\u0576 \u0561\u0575\u0568 \u055d\u0563\u057f\u0561\u0563\u0578\u0580\u056e\u0565\u056c\u0589",
        "\u0544\u0561\u0580\u057f\u0578\u057e \u057e\u0573\u0561\u0580\u0578\u0582\u0574\u0568 \u056f\u0561\u057f\u0561\u0580\u057e\u0578\u0582\u0574 \u0567 Stripe-\u056b \u0561\u0576\u057e\u057f\u0561\u0576\u0563 \u0565\u057b\u0578\u057d \u2014 \u0584\u0561\u0580\u057f\u056b \u0570\u0561\u0574\u0561\u0580\u0568 \u0574\u0565\u0580 \u0574\u0578\u057f \u0579\u056b \u057a\u0561\u0570\u057e\u0578\u0582\u0574\u0589",
        "\u0531\u0576\u0566\u0576\u0561\u056f\u0561\u0576 \u057f\u057e\u0575\u0561\u056c\u0576\u0565\u0580\u0568 \u0579\u0565\u0576\u0584 \u057f\u0561\u0580\u0561\u0564\u0566\u0578\u0582\u0574 \u0565\u0580\u0580\u0578\u0580\u0564 \u056f\u0578\u0572\u0574\u0565\u0580\u056b \u0570\u0565\u057f \u0561\u0580\u0561\u0576\u0581 \u0571\u0565\u0580 \u0569\u0578\u0582\u0575\u056c\u057f\u057e\u0578\u0582\u0569\u0575\u0561\u0576\u0589",
    ]
    sec["dataProtection"]["privacyLink"] = privacy_title
    sec["dataProtection"]["termsLink"] = terms_title

    sec["cta"]["body"] = (
        "\u0535\u0569\u0565 \u0570\u0561\u0576\u0564\u056b\u057a\u0565\u056c \u0565\u0584 \u056d\u0561\u0562\u0565\u0578\u0582\u0569\u0575\u0561\u0576, "
        "\u056f\u0561\u057d\u056f\u0561\u056e\u0565\u056c\u056b \u0570\u0561\u0575\u057f\u0561\u0580\u0561\u0580\u0578\u0582\u0569\u0575\u0561\u0576 \u056f\u0561\u0574 "
        "\u057f\u0565\u056d\u0576\u056b\u056f\u0561\u056f\u0561\u0576 \u056d\u0576\u0564\u0580\u056b \u2014 "
        "\u056f\u0561\u057a\u057e\u0565\u0584 \u0574\u0565\u0566 \u0561\u0576\u0574\u056b\u057b\u0561\u057a\u0565\u0589"
    )
    sec["cta"]["mailSubject"] = "Xndzor.com \u2014 \u0561\u0576\u057e\u057f\u0561\u0576\u0563\u0578\u0582\u0569\u0575\u0561\u0576 \u0570\u0561\u0572\u0578\u0580\u0564\u0561\u0563\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576"
    sec["cta"]["mailBody"] = (
        "\u0532\u0561\u0580\u0565\u057e,\n\n"
        "\u0535\u057d \u0578\u0582\u0566\u0578\u0582\u0574 \u0565\u0574 \u0570\u0561\u0572\u0578\u0580\u0564\u0561\u0563\u0580\u0565\u056c "
        "\u0561\u0576\u057e\u057f\u0561\u0576\u0563\u0578\u0582\u0569\u0575\u0561\u0576 \u056d\u0576\u0564\u0580\u056b\u0589 Xndzor.com-\u0578\u0582\u0574.\n\n"
        "[\u0576\u056f\u0561\u0580\u0561\u0563\u0580\u0565\u0584 \u056d\u0576\u0564\u056b\u0580\u0568]\n\n---\n{email}"
    )

    replace_all(sec, mapping)

    # Fix common corrupted tokens across tips
    def fix_str(s: str) -> str:
        reps = [
            ("գաղտնabան", "գաղտնաբառ"),
            ("abան", "աբառ"),
            ("հայտararություն", "հայտարարություն"),
            ("arar", "արար"),
            ("գործarք", "գործarք"),
            ("խабеություն", "խաբеություն"),
            ("խабеության", "խաբеության"),
            ("к", ""),
            ("перевод", "փոխանցում"),
            ("reference", "նախապես"),
            ("современ", ""),
            ("технologi", "տեխնologi"),
            ("шифрованием", "կոդավորմամբ"),
            ("шифрованием", "կոդավորմամբ"),
            ("կanal", "կanal"),
            ("сервер", "սերվեր"),
            ("сер�вер", "սերվեր"),
            (" แชր", " տվեք"),
            ("แชր", "տվեք"),
            ("կafe", "սրճարան"),
            ("Ֆermer", "Գyուղ"),
            ("բանк", "բանկ"),
            ("rekvezitner", "реквизитներ"),
            ("կոնtakt", "կոնtakt"),
            ("Հաղորդagir", "Հաղորդagir"),
            ("agir", "agir"),
            ("bcrypt hash-ով (12 rounds)", "հատուկ կոդավորմամբ"),
            ("Session cookie-ները httpOnly, SameSite=Lax և Secure են production-ում։",
             "Մուտքի համար օգտագործվող տեղեկությունը պաշտպանված է, որպեսզի այլ կայքեր չկարողանան այն օգտագործել։"),
            ("Stripe Hosted Checkout-ով", "Stripe-ի անվտanգ ejov"),
            ("checkout-ը", "վճarум@"),
            ("phishing-ից", "խաբеության նամակներից"),
            ("Չat-ում", "Չat-ում"),
        ]
        for old, new in reps:
            s = s.replace(old, new)
        return s

    def walk(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, str):
                    obj[k] = fix_str(v)
                else:
                    walk(v)
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                if isinstance(v, str):
                    obj[i] = fix_str(v)
                else:
                    walk(v)

    walk(sec)
    save("hy.json", hy)

    en_data = {
        "body": [
            "The site uses a secure connection (HTTPS) — your information is sent in encrypted form.",
            "Passwords are stored in scrambled form — we cannot see your actual password.",
            "Login information is protected so other websites cannot misuse it.",
            "Card payments go through Stripe's secure checkout page — we never store your card number.",
            "We do not share your personal data with others without your permission.",
        ],
        "learnMore": "Learn more in our",
    }
    ru_data = {
        "body": [
            "Сайт работает по защищённому соединению (HTTPS) — данные передаются в зашифрованном виде.",
            "Пароли хранятся в зашифрованном виде — мы не видим ваш настоящий пароль.",
            "Данные для входа защищены — посторонние сайты не могут их использовать.",
            "Оплата картой проходит через защищённую страницу Stripe — номер карты у нас не хранится.",
            "Мы не передаём личные данные третьим лицам без вашего согласия.",
        ],
        "learnMore": "Подробнее:",
    }
    for name, patch in [("en.json", en_data), ("ru.json", ru_data)]:
        data = load(name)
        data["pages"]["security"]["dataProtection"].update(patch)
        save(name, data)

    for name, patch in [
        ("en.json", {"body": "If you encountered a scam, suspicious listing, or technical issue — contact us right away."}),
        ("ru.json", {"body": "Если вы столкнулись с мошенничеством, подозрительным объявлением или технической проблемой — свяжитесь с нами сразу."}),
    ]:
        data = load(name)
        data["pages"]["security"]["cta"].update(patch)
        save(name, data)

    print("done")


if __name__ == "__main__":
    main()
