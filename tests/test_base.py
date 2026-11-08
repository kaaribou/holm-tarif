"""Tests HOLM HP/HC : option Base (prix unique toute la journée)."""
from datetime import datetime

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.holm_tarif.const import DOMAIN, EVENT_CHANGE

BASE_VALUES = {"price_hc": 0.2, "price_hp": 0.27, "price_base": 0.1952, "subscription": 15.65}


def _local(h, m=0):
    return dt_util.as_utc(datetime(2026, 1, 15, h, m, tzinfo=dt_util.get_default_time_zone()))


async def _setup(hass, options):
    entry = MockConfigEntry(domain=DOMAIN, title="HOLM HP/HC", data={}, options=options, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_base(hass: HomeAssistant, freezer):
    await hass.config.async_set_time_zone("Europe/Paris")
    freezer.move_to(_local(10))
    events = []
    hass.bus.async_listen(EVENT_CHANGE, lambda e: events.append(e.data))
    await _setup(hass, {"hc_ranges": "22:00-06:00", "tariff": "base", "values": BASE_VALUES})
    st = hass.states.get("sensor.tarif_actuel")
    assert float(st.state) == pytest.approx(0.1952)
    assert st.attributes["option"] == "base" and st.attributes["periode"] == "Base"
    assert st.attributes["prix_base"] == pytest.approx(0.1952) and "prix_hc" not in st.attributes
    assert float(hass.states.get("number.tarif_prix_base").state) == pytest.approx(0.1952)
    assert float(hass.states.get("sensor.abonnement_par_jour").state) == pytest.approx(0.5145, abs=1e-4)
    # pas d'heures creuses en Base
    for eid in ("binary_sensor.heures_creuses", "sensor.mode_heure", "sensor.prochain_changement_de_mode",
                "sensor.prochaine_bascule", "number.tarif_prix_hc", "number.tarif_prix_hp"):
        assert hass.states.get(eid) is None, eid
    # même prix la nuit, et aucune bascule
    freezer.move_to(_local(23))
    hass.bus.async_fire("time_changed", {"now": dt_util.utcnow()})
    await hass.async_block_till_done()
    assert float(hass.states.get("sensor.tarif_actuel").state) == pytest.approx(0.1952)
    assert events == []
    await hass.services.async_call("number", "set_value", {"entity_id": "number.tarif_prix_base", "value": 0.2016}, blocking=True)
    await hass.async_block_till_done()
    assert float(hass.states.get("sensor.tarif_actuel").state) == pytest.approx(0.2016)


async def test_switch_hchp_to_base_and_back(hass: HomeAssistant, freezer):
    await hass.config.async_set_time_zone("Europe/Paris")
    freezer.move_to(_local(10))
    entry = await _setup(hass, {"hc_ranges": "22:00-06:00", "values": BASE_VALUES})
    reg = er.async_get(hass)
    assert hass.states.get("sensor.tarif_actuel").state == "0.27"
    assert hass.states.get("sensor.tarif_actuel").attributes["option"] == "hchp"
    assert hass.states.get("number.tarif_prix_base") is None
    hass.config_entries.async_update_entry(entry, options={**entry.options, "tariff": "base"})
    await hass.async_block_till_done()
    assert reg.async_get("binary_sensor.heures_creuses") is None
    assert reg.async_get("number.tarif_prix_hc") is None
    assert float(hass.states.get("sensor.tarif_actuel").state) == pytest.approx(0.1952)
    hass.config_entries.async_update_entry(entry, options={**entry.options, "tariff": "hchp"})
    await hass.async_block_till_done()
    # retour en HC / HP : entités recréées, montants conservés
    assert hass.states.get("binary_sensor.heures_creuses").state == "off"
    assert float(hass.states.get("number.tarif_prix_hc").state) == pytest.approx(0.2)
    assert reg.async_get("number.tarif_prix_base") is None
    assert hass.states.get("sensor.tarif_actuel").state == "0.27"


async def test_base_ws(hass: HomeAssistant, hass_ws_client, freezer):
    await hass.config.async_set_time_zone("Europe/Paris")
    client = await hass_ws_client(hass)
    freezer.move_to(_local(10))
    await _setup(hass, {"hc_ranges": "22:00-06:00", "tariff": "base", "values": BASE_VALUES})
    await client.send_json({"id": 1, "type": "holm_tarif/get"})
    res = (await client.receive_json())["result"]
    keys = {p["key"] for p in res["prices"]}
    assert res["tariff"] == "base" and "price_base" in keys and "price_hc" not in keys


async def test_config_flow_base(hass: HomeAssistant):
    res = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    res = await hass.config_entries.flow.async_configure(res["flow_id"], {
        "tariff": "base", "hc_ranges": "22:00-06:00", "prix": {"price_base": 0.1952, "subscription": 15.65},
        "tempo": {}, "liens": {}})
    assert res["type"] == "create_entry"
    assert res["options"]["tariff"] == "base" and res["options"]["values"]["price_base"] == 0.1952
