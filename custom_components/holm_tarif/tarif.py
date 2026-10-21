"""Calcul de la période tarifaire (HC / HP), du tarif en cours et de la prochaine bascule."""
from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import datetime

from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.storage import Store
from homeassistant.helpers.event import async_track_point_in_time, async_track_state_change_event, async_track_time_change
from homeassistant.util import dt as dt_util

from .const import (CONF_BUYBACK, CONF_BUYBACK_TAX, CONF_CSPE, CONF_LINKY, CONF_LINKY_HC, CONF_PRICE_HC, CONF_PRICE_HP,
                    CONF_RANGES, CONF_SUBSCRIPTION, CONF_TCFE, CONF_VALUES, DEFAULT_LINKY_HC, DEFAULT_RANGES, EVENT_CHANGE,
                    HC_LABEL, HP_LABEL, PRICE_DEFS, PRICE_KEYS, STORE_KEY)
from .schedule import format_ranges, is_hc, next_change, parse_ranges

_LOGGER = logging.getLogger(__name__)


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def countdown(minutes: int) -> str:
    """Même format que l'ancien capteur modèle : « 2h10m »."""
    minutes = max(0, int(minutes))
    return f"{minutes // 60}h{minutes % 60:02d}m"


class TarifManager:
    def __init__(self, hass: HomeAssistant, options: dict) -> None:
        self.hass = hass
        self.options = options
        try:
            self.ranges = parse_ranges(options.get(CONF_RANGES) or DEFAULT_RANGES)
        except ValueError:
            _LOGGER.warning("Plages heures creuses illisibles : %s", options.get(CONF_RANGES))
            self.ranges = parse_ranges(DEFAULT_RANGES)
        # prix reliés à une entrée existante (input_number…) : l'entrée fait foi, l'intégration l'écrit aussi
        self.entities = {k: options.get(k) or None for k in PRICE_KEYS}
        self.values: dict = {k: v for k, v in (options.get(CONF_VALUES) or {}).items() if _num(v) is not None}
        self._store = Store(hass, 1, STORE_KEY)
        self.linky = options.get(CONF_LINKY) or None
        self.linky_values = [x.strip().casefold() for x in str(options.get(CONF_LINKY_HC) or DEFAULT_LINKY_HC).split(",") if x.strip()]
        self.state: dict = {}
        self._listeners: list[Callable[[], None]] = []
        self._unsubs: list[Callable[[], None]] = []
        self._unsub_point: Callable[[], None] | None = None

    # ---- cycle de vie ----
    async def async_load(self) -> None:
        """Montants conservés par l'intégration (ils priment sur ceux saisis à l'installation)."""
        data = await self._store.async_load() or {}
        self.values.update({k: v for k, v in data.items() if k in PRICE_KEYS and _num(v) is not None})

    def start(self) -> None:
        watch = [e for e in (*self.entities.values(), self.linky) if e]
        if watch:
            self._unsubs.append(async_track_state_change_event(self.hass, watch, self._on_state))
        self._unsubs.append(async_track_time_change(self.hass, self._on_minute, second=0))
        self.update(fire=False)

    def stop(self) -> None:
        for u in self._unsubs:
            u()
        self._unsubs.clear()
        if self._unsub_point:
            self._unsub_point()
            self._unsub_point = None

    def add_listener(self, cb: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(cb)
        return lambda: self._listeners.remove(cb)

    @callback
    def _on_state(self, event: Event) -> None:
        self.update()

    @callback
    def _on_minute(self, now: datetime) -> None:
        self.update()

    @callback
    def _on_point(self, now: datetime) -> None:
        self._unsub_point = None
        self.update()

    # ---- lectures ----
    def value(self, key: str) -> float | None:
        eid = self.entities.get(key)
        if eid:
            st = self.hass.states.get(eid)
            v = _num(st.state) if st else None
            if v is not None:
                return v
        return _num(self.values.get(key))

    async def async_set_value(self, key: str, value: float) -> None:
        """Nouveau prix : conservé par l'intégration et recopié dans l'entrée reliée."""
        if key not in PRICE_KEYS:
            raise ValueError(key)
        value = round(float(value), 6)
        self.values[key] = value
        await self._store.async_save(self.values)
        eid = self.entities.get(key)
        if eid and self.hass.states.get(eid) is not None:
            dom = eid.split(".", 1)[0]
            if dom in ("input_number", "number"):
                await self.hass.services.async_call(dom, "set_value", {"entity_id": eid, "value": value}, blocking=True)
        self.update(fire=False)

    def prices(self) -> dict:
        return {PRICE_DEFS[k][4]: self.value(k) for k in PRICE_KEYS}

    def linky_hc(self) -> bool | None:
        if not self.linky:
            return None
        st = self.hass.states.get(self.linky)
        if st is None or st.state in ("unknown", "unavailable", ""):
            return None
        s = st.state.strip().casefold()
        if s in ("on", "true"):
            return True
        if s in ("off", "false"):
            return False
        return any(s == v or (len(v) > 2 and v in s) for v in self.linky_values)

    # ---- calcul ----
    def _sync_links(self) -> None:
        """Garde une copie des prix lus dans les entrées reliées (utile si l'entrée disparaît un jour)."""
        changed = False
        for k, eid in self.entities.items():
            st = self.hass.states.get(eid) if eid else None
            v = _num(st.state) if st else None
            if v is not None and _num(self.values.get(k)) != v:
                self.values[k] = v
                changed = True
        if changed:
            self._store.async_delay_save(lambda: self.values, 5)

    @callback
    def update(self, fire: bool = True) -> None:
        self._sync_links()
        now = dt_util.now()
        sched = is_hc(now, self.ranges)
        lk = self.linky_hc()
        hc = sched if lk is None else lk
        nxt, nxt_hc = next_change(now, self.ranges)
        if lk is not None and lk != sched:
            nxt_hc = not hc         # le compteur prime : la prochaine bascule ramène l'autre période
        minutes = max(0, int((nxt - now).total_seconds() // 60) + (1 if (nxt - now).total_seconds() % 60 else 0))
        label_next = HC_LABEL if nxt_hc else HP_LABEL
        price = self.value(CONF_PRICE_HC if hc else CONF_PRICE_HP)
        sub = self.value(CONF_SUBSCRIPTION)
        prev = self.state.get("hc")
        self.state = {
            "hc": hc,
            "period": HC_LABEL if hc else HP_LABEL,
            "source": "compteur" if lk is not None else "horaires",
            "price": price,
            "next": nxt,
            "next_hc": nxt_hc,
            "next_label": label_next,
            "minutes": minutes,
            "text": f"{label_next} dans {countdown(minutes)}",
            "at": f"{nxt.hour:02d}h{nxt.minute:02d}",
            "ranges": format_ranges(self.ranges),
            "prices": self.prices(),
            "subscription_day": round(sub * 12 / 365, 4) if sub is not None else None,
        }
        if self._unsub_point is None or prev is not None and prev != hc:
            if self._unsub_point:
                self._unsub_point()
            self._unsub_point = async_track_point_in_time(self.hass, self._on_point, nxt)
        if fire and prev is not None and prev != hc:
            self.hass.bus.async_fire(EVENT_CHANGE, {"periode": self.state["period"], "heures_creuses": hc,
                                                   "tarif": price, "prochaine_bascule": nxt.isoformat()})
        for cb in list(self._listeners):
            cb()
