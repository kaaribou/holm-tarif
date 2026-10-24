"""Tests HOLM HP/HC : option HC / HP et option Tempo."""
from datetime import datetime

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.holm_tarif.const import DOMAIN, EVENT_CHANGE
from custom_components.holm_tarif.tarif import tempo_of

TEMPO_VALUES = {"price_hc": 0.2, "price_hp": 0.27, "subscription": 20.0,
                "price_bleu_hc": 0.1296, "price_bleu_hp": 0.1609, "price_blanc_hc": 0.1486,
                "price_blanc_hp": 0.1894, "price_rouge_hc": 0.1568, "price_rouge_hp": 0.7562}


def _local(h, m=0):
    return dt_util.as_utc(datetime(2026, 1, 15, h, m, tzinfo=dt_util.get_default_time_zone()))


async def _setup(hass, options):
    entry = MockConfigEntry(domain=DOMAIN, title="HOLM HP/HC", data={}, options=options, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


@pytest.mark.parametrize("raw,col", [("Bleu", "bleu"), ("BLUE", "bleu"), ("TEMPO_ROUGE", "rouge"), ("HCJW", "blanc"),
                                     ("blanc", "blanc"), ("3", "rouge"), ("inconnu", None), ("unavailable", None), ("🔵", None)])
def test_tempo_of(raw, col):
    assert tempo_of(raw) == col


async def test_hchp_unchanged(hass: HomeAssistant, freezer):
    await hass.config.async_set_time_zone("Europe/Paris")
    freezer.move_to(_local(10))
    await _setup(hass, {"hc_ranges": "22:00-06:00", "values": {"price_hc": 0.2, "price_hp": 0.27}})
    assert hass.states.get("sensor.tarif_actuel").state == "0.27"
    assert hass.states.get("binary_sensor.heures_creuses").state == "off"
    assert hass.states.get("sensor.tempo_couleur_aujourdhui") is None
    assert hass.states.get("number.tarif_prix_bleu_hc") is None
    assert "couleur" not in hass.states.get("binary_sensor.heures_creuses").attributes


async def test_tempo(hass: HomeAssistant, freezer):
    await hass.config.async_set_time_zone("Europe/Paris")
    freezer.move_to(_local(10))
    hass.states.async_set("sensor.rte_tempo_couleur_actuelle", "Blanc", {"options": ["Bleu", "Blanc", "Rouge", "inconnu"]})
    hass.states.async_set("sensor.rte_tempo_prochaine_couleur", "Rouge", {"options": ["Bleu", "Blanc", "Rouge", "inconnu"]})
    hass.states.async_set("sensor.rte_tempo_couleur_actuelle_visuel", "⚪", {"options": ["🔵", "⚪", "🔴", "❓"]})
    await _setup(hass, {"hc_ranges": "22:00-06:00", "tariff": "tempo", "values": TEMPO_VALUES})
    # couleurs trouvées automatiquement, prix Blanc HP à 10 h
    assert hass.states.get("sensor.tempo_couleur_aujourdhui").state == "Blanc"
    assert hass.states.get("sensor.tempo_couleur_demain").state == "Rouge"
    assert hass.states.get("sensor.tempo_couleur_aujourdhui").attributes["source"] == "sensor.rte_tempo_couleur_actuelle"
    assert float(hass.states.get("sensor.tarif_actuel").state) == pytest.approx(0.1894)
    assert hass.states.get("sensor.tarif_actuel").attributes["couleur"] == "Blanc"
    assert hass.states.get("binary_sensor.heures_creuses").attributes["couleur"] == "Blanc"
    assert float(hass.states.get("number.tarif_prix_rouge_hp").state) == pytest.approx(0.7562)
    events = []
    hass.bus.async_listen(EVENT_CHANGE, lambda e: events.append(e.data))
    # le lendemain : jour Rouge
    hass.states.async_set("sensor.rte_tempo_couleur_actuelle", "Rouge", {"options": ["Bleu", "Blanc", "Rouge", "inconnu"]})
    await hass.async_block_till_done()
    assert float(hass.states.get("sensor.tarif_actuel").state) == pytest.approx(0.7562)
    assert events and events[-1]["couleur"] == "Rouge"
    # source momentanément indisponible : la dernière couleur connue est conservée
    hass.states.async_set("sensor.rte_tempo_couleur_actuelle", "unavailable")
    await hass.async_block_till_done()
    assert hass.states.get("sensor.tempo_couleur_aujourdhui").state == "Rouge"
    # heures creuses du jour Rouge à 23 h
    freezer.move_to(_local(23))
    hass.states.async_set("sensor.rte_tempo_couleur_actuelle", "Rouge", {"options": ["Bleu", "Blanc", "Rouge", "inconnu"]})
    await hass.async_block_till_done()
    assert float(hass.states.get("sensor.tarif_actuel").state) == pytest.approx(0.1568)
    # modification d'un prix Tempo par l'entité nombre
    await hass.services.async_call("number", "set_value", {"entity_id": "number.tarif_prix_rouge_hc", "value": 0.16}, blocking=True)
    await hass.async_block_till_done()
    assert float(hass.states.get("sensor.tarif_actuel").state) == pytest.approx(0.16)


async def test_tempo_ws(hass: HomeAssistant, hass_ws_client, freezer):
    await hass.config.async_set_time_zone("Europe/Paris")
    client = await hass_ws_client(hass)       # avant de figer l'heure (jeton d'authentification)
    freezer.move_to(_local(10))
    hass.states.async_set("sensor.couleur_tempo_aujourdhui_linky", "BLEU")
    await _setup(hass, {"hc_ranges": "22:00-06:00", "tariff": "tempo", "tempo_today_entity": "sensor.couleur_tempo_aujourdhui_linky", "values": TEMPO_VALUES})
    await client.send_json({"id": 1, "type": "holm_tarif/get"})
    res = (await client.receive_json())["result"]
    assert res["tariff"] == "tempo" and res["tempo"]["today"] == "Bleu"
    assert {p["key"] for p in res["prices"]} >= {"price_bleu_hc", "price_rouge_hp"}
    await client.send_json({"id": 2, "type": "holm_tarif/set", "prices": {"price_bleu_hp": 0.17}})
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()
    assert float(hass.states.get("sensor.tarif_actuel").state) == pytest.approx(0.17)


async def test_tempo_off_removes_entities(hass: HomeAssistant, freezer):
    await hass.config.async_set_time_zone("Europe/Paris")
    freezer.move_to(_local(10))
    entry = await _setup(hass, {"hc_ranges": "22:00-06:00", "tariff": "tempo", "values": TEMPO_VALUES})
    reg = er.async_get(hass)
    assert reg.async_get("number.tarif_prix_bleu_hc")
    hass.config_entries.async_update_entry(entry, options={**entry.options, "tariff": "hchp"})
    await hass.async_block_till_done()
    assert reg.async_get("number.tarif_prix_bleu_hc") is None
    assert reg.async_get("sensor.tempo_couleur_aujourdhui") is None
    assert hass.states.get("sensor.tarif_actuel").state == "0.27"


async def test_config_flow_tempo(hass: HomeAssistant):
    hass.states.async_set("sensor.rte_tempo_couleur_actuelle", "Bleu", {"options": ["Bleu", "Blanc", "Rouge", "inconnu"]})
    res = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert res["type"] == "form"
    res = await hass.config_entries.flow.async_configure(res["flow_id"], {
        "tariff": "tempo", "hc_ranges": "22:00-06:00", "prix": {"price_hc": 0.2, "price_hp": 0.27},
        "tempo": {"price_bleu_hc": 0.1296, "price_rouge_hp": 0.7562, "tempo_today_entity": "sensor.rte_tempo_couleur_actuelle"},
        "liens": {}})
    assert res["type"] == "create_entry"
    o = res["options"]
    assert o["tariff"] == "tempo" and o["values"]["price_rouge_hp"] == 0.7562 and o["tempo_today_entity"] == "sensor.rte_tempo_couleur_actuelle"
