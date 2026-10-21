"""HOLM HP/HC, Tarification et abonnement : heures creuses / pleines, tarif en cours et abonnement."""
from __future__ import annotations

import hashlib
import logging
import os

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr

from .const import CARD_NAME, CARD_URL, DOMAIN, STATIC_PATH, VERSION
from .tarif import TarifManager
from .websocket import async_register

_LOGGER = logging.getLogger(__name__)
PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR, Platform.NUMBER]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    if not data.get("ws"):
        async_register(hass)
        data["ws"] = True
    await _async_setup_card(hass)
    manager = TarifManager(hass, {**entry.data, **entry.options})
    await manager.async_load()
    manager.start()
    # les premières versions créaient un appareil « HOLM HP/HC » : il n'a plus d'entité, on le retire
    dev_reg = dr.async_get(hass)
    for device in dr.async_entries_for_config_entry(dev_reg, entry.entry_id):
        dev_reg.async_remove_device(device.id)
    entry.runtime_data = manager
    entry.async_on_unload(manager.stop)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_reload))
    return True


async def _async_setup_card(hass: HomeAssistant) -> None:
    """Sert la carte HOLM HP/HC et la déclare une seule fois dans les ressources du tableau de bord."""
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("card"):
        return
    data["card"] = True
    try:
        www = os.path.join(os.path.dirname(__file__), "www")
        await hass.http.async_register_static_paths([StaticPathConfig(STATIC_PATH, www, False)])
        digest = await hass.async_add_executor_job(_file_hash, os.path.join(www, CARD_NAME))
        url = f"{CARD_URL}?v={VERSION}-{digest}"
        if not await _register_resource(hass, url):
            add_extra_js_url(hass, url)
    except Exception as err:  # noqa: BLE001 — la carte est un bonus, l'intégration doit démarrer
        _LOGGER.warning("Carte HOLM HP/HC non déclarée : %s", err)


async def _register_resource(hass: HomeAssistant, url: str) -> bool:
    try:
        lovelace = hass.data.get("lovelace")
        resources = getattr(lovelace, "resources", None) or (lovelace.get("resources") if isinstance(lovelace, dict) else None)
        if resources is None or not hasattr(resources, "async_create_item"):
            return False
        if not getattr(resources, "loaded", True):
            await resources.async_load()
            resources.loaded = True
        items = list(resources.async_items())
        mine = [r for r in items if str(r.get("url", "")).split("?")[0] == CARD_URL]
        if not mine:
            await resources.async_create_item({"res_type": "module", "url": url})
        elif mine[0].get("url") != url:
            await resources.async_update_item(mine[0]["id"], {"res_type": "module", "url": url})
        return True
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Ressource Lovelace non enregistrée (%s), chargement par extra_js_url", err)
        return False


def _file_hash(path: str) -> str:
    try:
        with open(path, "rb") as f:
            return hashlib.sha1(f.read()).hexdigest()[:8]
    except OSError:
        return "0"


async def _reload(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
