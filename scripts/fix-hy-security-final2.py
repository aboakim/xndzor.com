#!/usr/bin/env python3
"""Final targeted codepoint fixes for pages.security."""
import json
from pathlib import Path

HY = Path(__file__).resolve().parents[1] / "messages" / "hy.json"

GYUGH_WRONG = "\u0563\u0575\u0578\u0582\u0563\u0561\u057f"
GYUGH_RIGHT = "\u0563\u0575\u0578\u0582\u0572\u0561\u057f"


def fix_str(s: str) -> str:
    s = s.replace(GYUGH_WRONG, GYUGH_RIGHT)
    s = s.replace("\u0587 \u0569\u057e\u0561\u0576\u0576\u0565\u0580\u0589", "\u0587 \u0569\u057e\u0561\u0576\u0576\u0565\u0580\u0589")
    s = s.replace("\u0561\u0576\u0574\u056b\u057b\u0561\u057a\u0565\u0581\u0589", "\u0561\u0576\u0574\u056b\u057b\u0561\u057a\u0565\u057d\u0589")
    s = s.replace(
        "\u056f\u0565\u0572\u056e \u056f\u0561\u0574 \u0561\u0576\u0570\u0580\u0561\u056a\u0565\u0577\u057f \u0570\u0561\u0575\u057f\u0561\u0580\u0561\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0576\u0565\u0580\u056b \u0574\u0561\u057d\u056b\u0576\u0589",
        "\u056f\u0565\u0572\u056e \u056f\u0561\u0574 \u0561\u0576\u0575\u056b\u0576\u0561\u056f\u0561\u0576 \u0570\u0561\u0575\u057f\u0561\u0580\u0561\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0576\u0565\u0580\u056b \u0574\u0561\u057d\u056b\u0576\u0589",
    )
    s = s.replace("\u0564\u0565\u057a\u056f\u0578\u0582\u0574", "\u0564\u0565\u057a\u056f\u0578\u0582\u0574")
    s = s.replace("\u057a\u0561\u0570\u057a\u0561\u0576\u0565\u056c \u0570\u0561\u0574\u0561\u0575\u056f\u0568", "\u057a\u0561\u0570\u057a\u0561\u0576\u0565\u056c \u0570\u0561\u0574\u0561\u0575\u056f\u0568")
    s = s.replace(
        "\u056f\u0561\u057d\u056f\u0561\u0581\u0565\u056c\u056b",
        "\u056f\u0561\u057d\u056f\u0561\u0581\u0565\u056c\u056b",
    )
    return s


def walk(obj):
    if isinstance(obj, str):
        return fix_str(obj)
    if isinstance(obj, list):
        return [walk(x) for x in obj]
    if isinstance(obj, dict):
        return {k: walk(v) for k, v in obj.items()}
    return obj


def main() -> None:
    data = json.loads(HY.read_text(encoding="utf-8"))
    data["pages"]["security"] = walk(data["pages"]["security"])
    HY.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
