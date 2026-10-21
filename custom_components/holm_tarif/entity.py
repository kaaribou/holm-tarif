"""Base commune des entités : noms et identifiants fixes, identiques aux anciens capteurs modèles
(sensor.mode_heure, sensor.tarif_actuel…), pour garder l'historique et les cartes existantes."""
from __future__ import annotations

from homeassistant.helpers.entity import Entity


class TarifEntity(Entity):
    _attr_should_poll = False
    _attr_has_entity_name = False
    _domain = "sensor"

    def __init__(self, entry, manager, key: str, name: str, object_id: str | None = None) -> None:
        self.manager = manager
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_name = name
        # identifiant imposé (pas de préfixe d'appareil) : sensor.mode_heure plutôt que sensor.holm_hp_hc_mode_heure
        self.entity_id = f"{self._domain}.{object_id or key}"

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.manager.add_listener(self.async_write_ha_state))
