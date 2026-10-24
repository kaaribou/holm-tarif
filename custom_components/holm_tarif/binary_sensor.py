"""Heures creuses : allumé pendant les heures creuses."""
from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity

from .const import TEMPO_LABELS, TEMPO_UNKNOWN
from .entity import TarifEntity


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([HCBinarySensor(entry, entry.runtime_data)])


class HCBinarySensor(TarifEntity, BinarySensorEntity):
    _domain = "binary_sensor"

    def __init__(self, entry, m):
        super().__init__(entry, m, "heures_creuses", "Heures creuses")

    @property
    def is_on(self):
        return self.manager.state.get("hc")

    @property
    def icon(self):
        return "mdi:leaf-circle-outline" if self.is_on else "mdi:fire-circle"

    @property
    def extra_state_attributes(self):
        s = self.manager.state
        nxt = s.get("next")
        return {"periode": s.get("period"), "tarif": s.get("price"), "plages_hc": s.get("ranges"),
                "prochaine_bascule": nxt.isoformat() if nxt else None, "prochaine_periode": s.get("next_label"),
                "source": s.get("source"),
                **({"couleur": TEMPO_LABELS.get(s.get("tempo"), TEMPO_UNKNOWN)} if self.manager.tempo else {})}
