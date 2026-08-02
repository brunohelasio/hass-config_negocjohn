"""Expose Tuya IPC motion messages to the Bruno dashboard."""

from __future__ import annotations

import base64
import binascii
from collections import deque
from datetime import datetime, timedelta, timezone
import json
import logging
from typing import Any, Iterable

from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.event import async_track_time_interval

DOMAIN = "bruno_tuya_motion"
LOGGER = logging.getLogger(__name__)

CAMERA_ENTITIES = (
    "camera.sl_camera_2",
    "camera.vr_camera_2",
    "camera.cz_camera_2",
    "camera.as_camera_2",
    "camera.of_camera_2",
    "camera.camera_quarto_casal_2",
    "camera.qmi_camera_2",
    "camera.qma_camera_2",
)

INITIATIVE_MESSAGE = "initiative_message"
MOTION_COMMAND = "ipc_motion"
REFRESH_INTERVAL = timedelta(seconds=15)
MAX_RECENT_EVENTS = 256


async def async_setup(hass: HomeAssistant, _config: dict[str, Any]) -> bool:
    """Set up the YAML-driven motion bridge."""
    bridge = BrunoTuyaMotionBridge(hass)
    hass.data[DOMAIN] = bridge
    bridge.setup()
    return True


class BrunoTuyaMotionBridge:
    """Translate raw Tuya initiative_message packets into HA states."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._queues: dict[int, Any] = {}
        self._device_to_camera: dict[str, str] = {}
        self._recent_event_ids: deque[str] = deque()
        self._recent_event_set: set[str] = set()
        self._unmapped_devices_logged: set[str] = set()
        self._remove_interval: Any = None
        self._missing_queue_logged = False

    @callback
    def setup(self) -> None:
        """Initialize states and attach to the active Tuya queues."""
        self._initialize_states()
        self._refresh(None)
        self._remove_interval = async_track_time_interval(
            self.hass, self._refresh, REFRESH_INTERVAL
        )
        self.hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, self._stop)

    @callback
    def _initialize_states(self) -> None:
        for camera_entity in CAMERA_ENTITIES:
            state_entity = self._state_entity(camera_entity)
            if self.hass.states.get(state_entity) is not None:
                continue
            self.hass.states.async_set(
                state_entity,
                "ready",
                {
                    "event_type": "ready",
                    "camera_entity": camera_entity,
                    "source": INITIATIVE_MESSAGE,
                },
            )

    @callback
    def _refresh(self, _now: datetime | None) -> None:
        self._rebuild_device_map()
        current_queues = {
            id(queue): queue
            for queue in self._iter_message_queues()
            if callable(getattr(queue, "add_message_listener", None))
        }

        for queue_id, queue in tuple(self._queues.items()):
            if queue_id in current_queues:
                continue
            self._detach(queue)
            self._queues.pop(queue_id, None)

        for queue_id, queue in current_queues.items():
            if queue_id in self._queues:
                continue
            try:
                queue.add_message_listener(self._on_message)
            except Exception as err:  # pragma: no cover - depends on Tuya runtime
                LOGGER.warning("Unable to attach to Tuya message queue: %s", err)
                continue
            self._queues[queue_id] = queue

        if self._queues:
            self._missing_queue_logged = False
        elif not self._missing_queue_logged:
            LOGGER.warning(
                "No compatible Tuya message queue is available; retrying every %s seconds",
                int(REFRESH_INTERVAL.total_seconds()),
            )
            self._missing_queue_logged = True

    def _iter_message_queues(self) -> Iterable[Any]:
        seen: set[int] = set()

        for domain in ("xtend_tuya", "tuya"):
            for entry in self.hass.config_entries.async_entries(domain):
                runtime = getattr(entry, "runtime_data", None)
                if runtime is None:
                    continue

                manager = (
                    getattr(runtime, "multi_manager", None)
                    or getattr(runtime, "manager", None)
                    or getattr(runtime, "device_manager", None)
                )
                candidates: list[Any] = [
                    getattr(runtime, "mq", None),
                    getattr(manager, "mq", None),
                ]

                accounts = getattr(manager, "accounts", None)
                if isinstance(accounts, dict):
                    for account in accounts.values():
                        candidates.extend(self._account_queues(account))

                candidates.extend(self._account_queues(manager))

                for queue in candidates:
                    if queue is None or id(queue) in seen:
                        continue
                    seen.add(id(queue))
                    yield queue

    @staticmethod
    def _account_queues(account: Any) -> list[Any]:
        if account is None:
            return []

        queues = [getattr(account, "mq", None)]
        for data_name in ("iot_account", "sharing_account"):
            account_data = getattr(account, data_name, None)
            device_manager = getattr(account_data, "device_manager", None)
            queues.append(getattr(account_data, "mq", None))
            queues.append(getattr(device_manager, "mq", None))
        return queues

    @callback
    def _rebuild_device_map(self) -> None:
        entity_registry = er.async_get(self.hass)
        device_registry = dr.async_get(self.hass)
        mapping: dict[str, str] = {}

        for camera_entity in CAMERA_ENTITIES:
            entity_entry = entity_registry.async_get(camera_entity)
            if entity_entry is None or entity_entry.device_id is None:
                continue
            device_entry = device_registry.async_get(entity_entry.device_id)
            if device_entry is None:
                continue
            for _identifier_domain, identifier in device_entry.identifiers:
                if identifier:
                    mapping[str(identifier)] = camera_entity

        self._device_to_camera = mapping

    def _on_message(self, message: Any) -> None:
        try:
            self.hass.loop.call_soon_threadsafe(self._handle_message, message)
        except RuntimeError:
            return

    @callback
    def _handle_message(self, message: Any) -> None:
        decoded_message = self._as_mapping(message)
        if decoded_message is None:
            return

        data = decoded_message.get("data")
        if not isinstance(data, dict):
            data = decoded_message

        device_id = str(data.get("devId") or decoded_message.get("devId") or "")
        if not device_id:
            return

        payload = self._motion_payload(data.get("status"))
        if payload is None:
            return

        camera_entity = self._device_to_camera.get(device_id)
        if camera_entity is None:
            self._rebuild_device_map()
            camera_entity = self._device_to_camera.get(device_id)
        if camera_entity is None:
            if device_id not in self._unmapped_devices_logged:
                LOGGER.warning(
                    "Ignoring ipc_motion from Tuya device %s because no dashboard camera is mapped",
                    device_id,
                )
                self._unmapped_devices_logged.add(device_id)
            return

        self._unmapped_devices_logged.discard(device_id)

        event_id = str(
            data.get("dataId")
            or decoded_message.get("dataId")
            or f"{device_id}:{payload.get('time') or data.get('t') or datetime.now(timezone.utc).timestamp()}"
        )
        if not self._remember_event(event_id):
            return

        event_time = payload.get("time") or data.get("t")
        detected_at = self._event_timestamp(event_time)
        self.hass.states.async_set(
            self._state_entity(camera_entity),
            event_id[:255],
            {
                "event_type": MOTION_COMMAND,
                "camera_entity": camera_entity,
                "device_id": device_id,
                "detected_at": detected_at,
                "source": INITIATIVE_MESSAGE,
            },
        )

    @staticmethod
    def _as_mapping(value: Any) -> dict[str, Any] | None:
        if isinstance(value, dict):
            return value
        if isinstance(value, (bytes, bytearray)):
            try:
                value = value.decode("utf-8")
            except UnicodeDecodeError:
                return None
        if not isinstance(value, str):
            return None
        try:
            decoded = json.loads(value)
        except json.JSONDecodeError:
            return None
        return decoded if isinstance(decoded, dict) else None

    def _motion_payload(self, status: Any) -> dict[str, Any] | None:
        if isinstance(status, dict):
            status_items = [status]
        elif isinstance(status, list):
            status_items = status
        else:
            return None

        for item in status_items:
            if not isinstance(item, dict):
                continue
            code = str(item.get("code") or "")
            has_dp_212 = "212" in item or 212 in item
            if code != INITIATIVE_MESSAGE and not has_dp_212:
                continue
            for raw_value in (item.get("212"), item.get(212), item.get("value")):
                payload = self._decode_payload(raw_value)
                if payload is None or payload.get("cmd") != MOTION_COMMAND:
                    continue
                if payload.get("alarm") is False:
                    continue
                return payload
        return None

    @staticmethod
    def _decode_payload(value: Any) -> dict[str, Any] | None:
        if isinstance(value, dict):
            return value
        if not isinstance(value, str) or not value.strip():
            return None

        value = value.strip()
        try:
            decoded = json.loads(value)
        except json.JSONDecodeError:
            decoded = None
        if isinstance(decoded, dict):
            return decoded

        padded = value + ("=" * (-len(value) % 4))
        for decoder in (base64.b64decode, base64.urlsafe_b64decode):
            try:
                decoded_bytes = decoder(padded)
                decoded = json.loads(decoded_bytes.decode("utf-8"))
            except (binascii.Error, ValueError, UnicodeDecodeError, json.JSONDecodeError):
                continue
            if isinstance(decoded, dict):
                return decoded
        return None

    def _remember_event(self, event_id: str) -> bool:
        if event_id in self._recent_event_set:
            return False
        if len(self._recent_event_ids) >= MAX_RECENT_EVENTS:
            oldest = self._recent_event_ids.popleft()
            self._recent_event_set.discard(oldest)
        self._recent_event_ids.append(event_id)
        self._recent_event_set.add(event_id)
        return True

    @staticmethod
    def _event_timestamp(value: Any) -> str:
        try:
            timestamp = float(value)
        except (TypeError, ValueError):
            return datetime.now(timezone.utc).isoformat()
        if timestamp > 10_000_000_000:
            timestamp /= 1000
        try:
            return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()
        except (OSError, OverflowError, ValueError):
            return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _state_entity(camera_entity: str) -> str:
        return f"{DOMAIN}.{camera_entity.split('.', 1)[1]}"

    def _detach(self, queue: Any) -> None:
        remove_listener = getattr(queue, "remove_message_listener", None)
        if not callable(remove_listener):
            return
        try:
            remove_listener(self._on_message)
        except Exception:
            pass

    @callback
    def _stop(self, _event: Event) -> None:
        if self._remove_interval is not None:
            self._remove_interval()
            self._remove_interval = None
        for queue in self._queues.values():
            remove_listener = getattr(queue, "remove_message_listener", None)
            if not callable(remove_listener):
                continue
            try:
                remove_listener(self._on_message)
            except Exception:
                pass
        self._queues.clear()
