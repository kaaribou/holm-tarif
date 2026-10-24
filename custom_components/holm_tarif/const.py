"""Constantes de HOLM HP/HC, Tarification et abonnement."""
DOMAIN = "holm_tarif"
VERSION = "1.1.0"
NAME = "HOLM HP/HC"

CONF_RANGES = "hc_ranges"
CONF_PRICE_HC = "price_hc"
CONF_PRICE_HP = "price_hp"
CONF_SUBSCRIPTION = "subscription"
CONF_CSPE = "cspe"
CONF_TCFE = "tcfe"
CONF_BUYBACK = "buyback"
CONF_BUYBACK_TAX = "buyback_tax"
CONF_LINKY = "linky_entity"
CONF_LINKY_HC = "linky_hc_values"
CONF_TARIFF = "tariff"
TARIFF_HCHP = "hchp"
TARIFF_TEMPO = "tempo"
CONF_TEMPO_TODAY = "tempo_today_entity"
CONF_TEMPO_TOMORROW = "tempo_tomorrow_entity"
SECTION_TEMPO = "tempo"

# Tempo : couleurs (valeur exposée, libellé)
TEMPO_COLORS = ("bleu", "blanc", "rouge")
TEMPO_LABELS = {"bleu": "Bleu", "blanc": "Blanc", "rouge": "Rouge"}
TEMPO_UNKNOWN = "Inconnu"
TEMPO_KEYS = tuple(f"price_{c}_{p}" for c in TEMPO_COLORS for p in ("hc", "hp"))

DEFAULT_RANGES = "22:00-06:00"
DEFAULT_LINKY_HC = "HC, HC.., heures creuses, creuses"

# Entrées existantes reprises automatiquement si elles sont présentes (mots-clés cherchés dans l'id)
AUTO_DETECT = {
    CONF_PRICE_HC: (("heures_creuses",), ("hc",)),
    CONF_PRICE_HP: (("heures_pleines",), ("hp",)),
    CONF_SUBSCRIPTION: (("abonnement",),),
    CONF_CSPE: (("cspe",), ("contribution",)),
    CONF_TCFE: (("tcfe",), ("taxe_sur_la_consommation",)),
    CONF_BUYBACK: (("rachat",),),
    CONF_BUYBACK_TAX: (("taxe_revente",),),
}
PRICE_KEYS = (CONF_PRICE_HC, CONF_PRICE_HP, CONF_SUBSCRIPTION, CONF_CSPE, CONF_TCFE, CONF_BUYBACK, CONF_BUYBACK_TAX)
CONF_VALUES = "values"        # montants saisis à l'installation (ensuite conservés par l'intégration)
SECTION_PRICES = "prix"
SECTION_LINKS = "liens"

# clé -> (nom, identifiant de l'entité nombre, unité, nombre de décimales, attribut exposé)
PRICE_DEFS = {
    CONF_PRICE_HC: ("Prix heures creuses", "tarif_prix_hc", "EUR/kWh", 5, "prix_hc"),
    CONF_PRICE_HP: ("Prix heures pleines", "tarif_prix_hp", "EUR/kWh", 5, "prix_hp"),
    CONF_SUBSCRIPTION: ("Abonnement mensuel", "tarif_abonnement", "EUR", 2, "abonnement_mensuel"),
    CONF_CSPE: ("CSPE / accise", "tarif_cspe", "EUR/kWh", 5, "cspe"),
    CONF_TCFE: ("TCFE", "tarif_tcfe", "EUR/kWh", 5, "tcfe"),
    CONF_BUYBACK: ("Prix de rachat du surplus", "tarif_prix_rachat", "EUR/kWh", 5, "prix_rachat"),
    CONF_BUYBACK_TAX: ("Taxe sur la revente", "tarif_taxe_revente", "EUR/kWh", 5, "taxe_revente"),
}
for _c in TEMPO_COLORS:
    for _p, _pl in (("hc", "heures creuses"), ("hp", "heures pleines")):
        PRICE_DEFS[f"price_{_c}_{_p}"] = (f"Prix Tempo {TEMPO_LABELS[_c]} {_pl}", f"tarif_prix_{_c}_{_p}", "EUR/kWh", 5, f"prix_{_c}_{_p}")
ALL_KEYS = PRICE_KEYS + TEMPO_KEYS
STORE_KEY = "holm_tarif.values"

HC_LABEL = "Heures Creuses"
HP_LABEL = "Heures Pleines"
EVENT_CHANGE = "holm_tarif_changement"

STATIC_PATH = "/holm_tarif_static"
CARD_NAME = "holm-tarif-card.js"
CARD_URL = f"{STATIC_PATH}/{CARD_NAME}"
