"""Capteurs : mode heure, tarif actuel, prochain changement, prochaine bascule, abonnement par jour, couleurs Tempo."""
from __future__ import annotations

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity

from .const import HC_LABEL, HP_LABEL, PRICE_DEFS, TEMPO_LABELS, TEMPO_UNKNOWN
from .entity import TarifEntity


async def async_setup_entry(hass, entry, async_add_entities):
    m = entry.runtime_data
    ents = [ModeSensor(entry, m), PriceSensor(entry, m), NextTextSensor(entry, m), NextTimeSensor(entry, m), SubscriptionDaySensor(entry, m)]
    if m.tempo:
        ents += [TempoColorSensor(entry, m, False), TempoColorSensor(entry, m, True)]
    async_add_entities(ents)


class ModeSensor(TarifEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = [HC_LABEL, HP_LABEL]

    def __init__(self, entry, m):
        super().__init__(entry, m, "mode_heure", "Mode heure")

    @property
    def native_value(self):
        return self.manager.state.get("period")

    @property
    def icon(self):
        return "mdi:leaf-circle-outline" if self.manager.state.get("hc") else "mdi:fire-circle"

    @property
    def extra_state_attributes(self):
        s = self.manager.state
        return {"heures_creuses": s.get("hc"), "plages_hc": s.get("ranges"), "source": s.get("source")}


class PriceSensor(TarifEntity, SensorEntity):
    _attr_native_unit_of_measurement = "EUR/kWh"
    _attr_suggested_display_precision = 4

    def __init__(self, entry, m):
        super().__init__(entry, m, "tarif_actuel", "Tarif actuel")

    @property
    def native_value(self):
        return self.manager.state.get("price")

    @property
    def icon(self):
        return "mdi:cash-clock"

    @property
    def extra_state_attributes(self):
        s = self.manager.state
        tempo = {"couleur": TEMPO_LABELS.get(s.get("tempo"), TEMPO_UNKNOWN)} if self.manager.tempo else {}
        return {"periode": s.get("period"), **tempo, **(s.get("prices") or {}),
                "reglages": {PRICE_DEFS[k][4]: f"number.{PRICE_DEFS[k][1]}" for k in PRICE_DEFS},
                "entrees_reliees": {PRICE_DEFS[k][4]: v for k, v in self.manager.entities.items() if v}}


class NextTextSensor(TarifEntity, SensorEntity):
    def __init__(self, entry, m):
        super().__init__(entry, m, "prochain_changement", "Prochain changement de mode", "prochain_changement_de_mode")

    @property
    def native_value(self):
        return self.manager.state.get("text")

    @property
    def icon(self):
        return "mdi:timer-sand"

    @property
    def extra_state_attributes(self):
        s = self.manager.state
        nxt = s.get("next")
        return {"prochaine_periode": s.get("next_label"), "a": s.get("at"), "minutes_restantes": s.get("minutes"),
                "date": nxt.isoformat() if nxt else None}


class NextTimeSensor(TarifEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, entry, m):
        super().__init__(entry, m, "prochaine_bascule", "Prochaine bascule")

    @property
    def native_value(self):
        return self.manager.state.get("next")

    @property
    def icon(self):
        return "mdi:swap-horizontal-circle-outline"

    @property
    def extra_state_attributes(self):
        return {"prochaine_periode": self.manager.state.get("next_label")}


class SubscriptionDaySensor(TarifEntity, SensorEntity):
    _attr_native_unit_of_measurement = "EUR"
    _attr_suggested_display_precision = 2

    def __init__(self, entry, m):
        super().__init__(entry, m, "abonnement_par_jour", "Abonnement par jour")

    @property
    def available(self):
        return self.manager.state.get("subscription_day") is not None

    @property
    def native_value(self):
        return self.manager.state.get("subscription_day")

    @property
    def icon(self):
        return "mdi:calendar-today"


class TempoColorSensor(TarifEntity, SensorEntity):
    """Couleur Tempo du jour ou de demain (Bleu / Blanc / Rouge), avec les prix de cette couleur."""
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = [*TEMPO_LABELS.values(), TEMPO_UNKNOWN]

    def __init__(self, entry, m, tomorrow: bool):
        self.tomorrow = tomorrow
        key = "tempo_couleur_demain" if tomorrow else "tempo_couleur_aujourdhui"
        super().__init__(entry, m, key, "Couleur Tempo de demain" if tomorrow else "Couleur Tempo du jour")

    def _col(self):
        return self.manager.state.get("tempo_tomorrow" if self.tomorrow else "tempo")

    @property
    def native_value(self):
        return TEMPO_LABELS.get(self._col(), TEMPO_UNKNOWN)

    @property
    def icon(self):
        return {"bleu": "mdi:circle", "blanc": "mdi:circle-outline", "rouge": "mdi:alert-circle"}.get(self._col(), "mdi:help-circle-outline")

    @property
    def extra_state_attributes(self):
        c = self._col()
        src = self.manager.tempo_tomorrow if self.tomorrow else self.manager.tempo_today
        out = {"source": src}
        if c:
            out.update({"prix_hc": self.manager.value(f"price_{c}_hc"), "prix_hp": self.manager.value(f"price_{c}_hp")})
        return out
