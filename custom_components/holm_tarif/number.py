"""Prix, taxes et abonnement : réglables depuis Home Assistant et depuis la carte HOLM HP/HC."""
from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode

from .const import PRICE_DEFS
from .entity import TarifEntity


async def async_setup_entry(hass, entry, async_add_entities):
    m = entry.runtime_data
    async_add_entities([PriceNumber(entry, m, k) for k in m.active_keys()])


class PriceNumber(TarifEntity, NumberEntity):
    _domain = "number"
    _attr_mode = NumberMode.BOX
    _attr_native_min_value = 0
    _attr_native_max_value = 1000
    _attr_native_step = 0.00001

    def __init__(self, entry, m, key):
        name, object_id, unit, _dec, _attr = PRICE_DEFS[key]
        super().__init__(entry, m, f"number_{key}", name, object_id)
        self.key = key
        self._attr_native_unit_of_measurement = unit
        self._attr_icon = {"subscription": "mdi:calendar-month", "cspe": "mdi:bank-outline", "tcfe": "mdi:bank-outline",
                           "buyback": "mdi:solar-power-variant", "buyback_tax": "mdi:percent-outline",
                           "price_hp": "mdi:fire"}.get(key) or (
            {"bleu": "mdi:circle", "blanc": "mdi:circle-outline", "rouge": "mdi:alert-circle"}.get(key.split("_")[1]) if key.count("_") == 2 else None) or "mdi:leaf"

    @property
    def native_value(self):
        return self.manager.value(self.key)

    @property
    def extra_state_attributes(self):
        link = self.manager.entities.get(self.key)
        return {"entree_reliee": link} if link else None

    async def async_set_native_value(self, value: float) -> None:
        await self.manager.async_set_value(self.key, value)
