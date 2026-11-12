"""Display helpers shared by the models and the admin (same formats as the website)."""


def format_price(cents: int) -> str:
    """1500 → "15 €", 1250 → "12,50 €"."""
    if cents % 100 == 0:
        return f"{cents // 100} €"

    return f"{cents / 100:.2f} €".replace(".", ",")


def format_duration(minutes: int) -> str:
    """30 → "30 min", 75 → "1 h 15 min"."""
    hours, rest = divmod(minutes, 60)

    if hours == 0:
        return f"{rest} min"

    return f"{hours} h" if rest == 0 else f"{hours} h {rest} min"
