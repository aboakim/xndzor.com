#!/usr/bin/env python3
"""Apply clean Armenian pages.security to messages/hy.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HY = ROOT / "messages" / "hy.json"
SRC = Path(__file__).resolve().parent / "hy-security-data.json"


def main() -> None:
    security = json.loads(SRC.read_text(encoding="utf-8"))
    data = json.loads(HY.read_text(encoding="utf-8"))
    data["pages"]["security"] = security

    data["pages"]["help"]["eyebrow"] = "Օգնություն"
    data["pages"]["help"]["title"] = "Օգնություն"

    data["pages"]["terms"]["title"] = "Օգտագործման պայմաններ"
    data["pages"]["terms"]["lede"] = (
        "Հարթակը օգտագործելիս դուք համաձայնում եք ստորև նշված կանոններին։"
    )

    HY.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("OK")


if __name__ == "__main__":
    main()
