"""Configuration : plages heures creuses, prix (saisis ici ou reliés à des entrées existantes), compteur Linky facultatif."""
from __future__ import annotations

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import section
from homeassistant.helpers import selector

from .const import (AUTO_DETECT, CONF_LINKY, CONF_LINKY_HC, CONF_RANGES, CONF_VALUES, DEFAULT_LINKY_HC, DEFAULT_RANGES,
                    DOMAIN, NAME, PRICE_DEFS, PRICE_KEYS, SECTION_LINKS, SECTION_PRICES)
from .schedule import format_ranges, parse_ranges

_LINK_SEL = selector.EntitySelector(selector.EntitySelectorConfig(domain=["input_number", "number", "sensor"]))


def _num_sel(key: str) -> selector.NumberSelector:
    unit = "€ / mois" if PRICE_DEFS[key][2] == "EUR" else "€/kWh"
    return selector.NumberSelector(selector.NumberSelectorConfig(min=0, max=1000, step="any", mode="box", unit_of_measurement=unit))


def detect(hass: HomeAssistant) -> dict:
    """Retrouve les entrées de prix déjà créées (input_number.hc_heures_creuses, …)."""
    ids = sorted(e for e in hass.states.async_entity_ids(("input_number", "number")) if not e.startswith("number.tarif_"))
    found: dict = {}
    for key, groups in AUTO_DETECT.items():
        for words in groups:
            hit = next((e for e in ids if all(w in e.split(".", 1)[1] for w in words) and e not in found.values()), None)
            if hit:
                found[key] = hit
                break
    return found


def _sv(v):
    return {"suggested_value": v} if v not in (None, "") else None


def _schema(cur: dict, values: dict, links: dict, links_open: bool) -> vol.Schema:
    prices = {vol.Optional(k, description=_sv(values.get(k))): _num_sel(k) for k in PRICE_KEYS}
    link_fields = {vol.Optional(k, description=_sv(links.get(k))): _LINK_SEL for k in PRICE_KEYS}
    link_fields[vol.Optional(CONF_LINKY, description=_sv(cur.get(CONF_LINKY)))] = selector.EntitySelector()
    link_fields[vol.Optional(CONF_LINKY_HC, default=cur.get(CONF_LINKY_HC, DEFAULT_LINKY_HC))] = str
    return vol.Schema({
        vol.Required(CONF_RANGES, default=cur.get(CONF_RANGES, DEFAULT_RANGES)): str,
        vol.Required(SECTION_PRICES): section(vol.Schema(prices), {"collapsed": False}),
        vol.Required(SECTION_LINKS): section(vol.Schema(link_fields), {"collapsed": not links_open}),
    })


def _flatten(user_input: dict) -> tuple[dict, dict]:
    """Formulaire -> options : {hc_ranges, values: {...}, price_hc: entrée reliée, …, linky…}."""
    errors: dict = {}
    out: dict = {}
    try:
        out[CONF_RANGES] = format_ranges(parse_ranges(user_input.get(CONF_RANGES, "")))
    except ValueError:
        errors[CONF_RANGES] = "bad_ranges"
    prices = user_input.get(SECTION_PRICES) or {}
    links = user_input.get(SECTION_LINKS) or {}
    out[CONF_VALUES] = {k: float(prices[k]) for k in PRICE_KEYS if prices.get(k) is not None}
    for k in PRICE_KEYS:
        if links.get(k):
            out[k] = links[k]
    if links.get(CONF_LINKY):
        out[CONF_LINKY] = links[CONF_LINKY]
    out[CONF_LINKY_HC] = links.get(CONF_LINKY_HC) or DEFAULT_LINKY_HC
    return out, errors


def _link_values(hass: HomeAssistant, links: dict) -> dict:
    out = {}
    for k, eid in links.items():
        st = hass.states.get(eid) if eid else None
        try:
            out[k] = float(st.state)
        except (AttributeError, TypeError, ValueError):
            pass
    return out


class TarifConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        errors: dict = {}
        if user_input is not None:
            data, errors = _flatten(user_input)
            if not errors:
                return self.async_create_entry(title=NAME, data={}, options=data)
        links = detect(self.hass)
        return self.async_show_form(step_id="user", errors=errors,
                                    data_schema=_schema({CONF_RANGES: DEFAULT_RANGES}, _link_values(self.hass, links), links, bool(links)))

    @staticmethod
    @callback
    def async_get_options_flow(entry: ConfigEntry) -> OptionsFlow:
        return TarifOptionsFlow()


class TarifOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input=None):
        errors: dict = {}
        if user_input is not None:
            data, errors = _flatten(user_input)
            if not errors:
                m = getattr(self.config_entry, "runtime_data", None)
                # les montants modifiés ici deviennent les montants conservés par l'intégration
                if m is not None:
                    for k, v in data[CONF_VALUES].items():
                        if m.value(k) != v:
                            await m.async_set_value(k, v)
                return self.async_create_entry(title="", data=data)
        cur = {**self.config_entry.data, **self.config_entry.options}
        m = getattr(self.config_entry, "runtime_data", None)
        values = {k: m.value(k) for k in PRICE_KEYS} if m else dict(cur.get(CONF_VALUES) or {})
        links = {k: cur.get(k) for k in PRICE_KEYS if cur.get(k)}
        return self.async_show_form(step_id="init", errors=errors,
                                    data_schema=_schema(cur, values, links, bool(links) or bool(cur.get(CONF_LINKY))))
