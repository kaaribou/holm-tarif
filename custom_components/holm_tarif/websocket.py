"""API de la carte : lecture et modification des réglages (plages, prix) — modification réservée aux administrateurs."""
from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import CONF_RANGES, DOMAIN, PRICE_DEFS, PRICE_KEYS
from .schedule import format_ranges, parse_ranges


def _entry(hass: HomeAssistant):
    entries = [e for e in hass.config_entries.async_entries(DOMAIN) if getattr(e, "runtime_data", None)]
    return entries[0] if entries else None


@callback
def async_register(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_get)
    websocket_api.async_register_command(hass, ws_set)


def _payload(entry, admin: bool) -> dict:
    m = entry.runtime_data
    return {
        "ranges": [[f"{a // 60:02d}:{a % 60:02d}", f"{b // 60:02d}:{b % 60:02d}"] for a, b in m.ranges],
        "prices": [{"key": k, "name": PRICE_DEFS[k][0], "unit": PRICE_DEFS[k][2], "decimals": PRICE_DEFS[k][3],
                    "value": m.value(k), "link": m.entities.get(k), "entity_id": f"number.{PRICE_DEFS[k][1]}"} for k in PRICE_KEYS],
        "admin": admin,
    }


@websocket_api.websocket_command({vol.Required("type"): "holm_tarif/get"})
@callback
def ws_get(hass, connection, msg):
    entry = _entry(hass)
    if not entry:
        return connection.send_error(msg["id"], "not_loaded", "HOLM HP/HC n'est pas configuré")
    connection.send_result(msg["id"], _payload(entry, connection.user.is_admin))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "holm_tarif/set",
                                  vol.Optional("ranges"): [[str]],
                                  vol.Optional("prices"): {vol.In(PRICE_KEYS): vol.Coerce(float)}})
@websocket_api.async_response
async def ws_set(hass, connection, msg):
    entry = _entry(hass)
    if not entry:
        return connection.send_error(msg["id"], "not_loaded", "HOLM HP/HC n'est pas configuré")
    ranges = None
    if "ranges" in msg:
        try:
            ranges = format_ranges(parse_ranges(", ".join(f"{a}-{b}" for a, b in msg["ranges"])))
        except (ValueError, TypeError):
            return connection.send_error(msg["id"], "bad_ranges", "Plages heures creuses invalides")
    m = entry.runtime_data
    for k, v in (msg.get("prices") or {}).items():
        if v < 0:
            return connection.send_error(msg["id"], "bad_price", "Un prix ne peut pas être négatif")
        if m.value(k) != v:
            await m.async_set_value(k, v)
    if ranges is not None and ranges != entry.options.get(CONF_RANGES):
        hass.config_entries.async_update_entry(entry, options={**entry.options, CONF_RANGES: ranges})   # rechargement automatique
    connection.send_result(msg["id"], {"ok": True, "ranges": ranges})
