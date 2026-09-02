"""Exercise the actual package Jinja, with virtual time and delay_on semantics.

This is not Home Assistant Check Configuration or a live restart test.
Run: python scripts/validation/test_home_occupancy_core.py --dependencies
     tmp/home-occupancy-test-deps
"""

import ast
import copy
from datetime import datetime, timezone
from pathlib import Path
import sys
import unittest

if "--dependencies" in sys.argv:
    index = sys.argv.index("--dependencies")
    sys.path.insert(0, str(Path(sys.argv[index + 1]).resolve()))
    del sys.argv[index:index + 2]

import yaml
from jinja2 import StrictUndefined
from jinja2.sandbox import SandboxedEnvironment

ROOT = Path(__file__).resolve().parents[2]
PACKAGE_PATH = ROOT / "config/packages/home_occupancy_core.yaml"


class UniqueKeyLoader(yaml.SafeLoader):
    """Reject duplicate keys instead of hiding a broken YAML section."""


def unique_mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise ValueError(f"Duplicate YAML key: {key}")
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueKeyLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping
)
PACKAGE = yaml.load(PACKAGE_PATH.read_text(encoding="utf-8"), Loader=UniqueKeyLoader)
BLOCK = PACKAGE["template"][0]
OBSERVATION = "sensor.home_occupancy_observation"
GLOBAL = "sensor.home_occupancy_state"
CONFIRMED = "binary_sensor.home_empty_confirmed"
CANDIDATE = "binary_sensor.home_empty_candidate"
READY = "binary_sensor.home_occupancy_ready"
STRONG = "binary_sensor.home_strong_occupancy_evidence"
WEAK = "binary_sensor.home_weak_occupancy_evidence"
PERSON = "person.bruno_helasio"
COVERAGE = "sensor.home_occupancy_coverage"
ROOMS = BLOCK["variables"]["primary_rooms"]
ENTITIES = {
    entity["default_entity_id"]: entity
    for domain in ("sensor", "binary_sensor")
    for entity in BLOCK[domain]
}


def timestamp(value, default=None):
    try:
        if isinstance(value, datetime):
            return value.timestamp()
        if isinstance(value, (int, float)):
            return float(value)
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
    except (TypeError, ValueError):
        if default is not None:
            return default
        raise


class House:
    """Minimal HA template context; no service calls, network, or real devices."""

    def __init__(self):
        self.clock = 1_800_000_000.0
        self.states = {}
        self.attributes = {}
        self.pending = {}
        self.last_results = {}
        self.env = SandboxedEnvironment(undefined=StrictUndefined)
        self.env.globals.update(
            states=lambda entity: self.states.get(entity, "unknown"),
            is_state=lambda entity, state: self.states.get(entity, "unknown") == state,
            state_attr=lambda entity, attr: self.attributes.get(entity, {}).get(attr),
            now=lambda: datetime.fromtimestamp(self.clock, timezone.utc),
            as_timestamp=timestamp,
            as_datetime=lambda value: datetime.fromtimestamp(timestamp(value), timezone.utc),
        )
        self.variables = {}
        self.load_variables()
        self.states[PERSON] = "not_home"
        for room in ROOMS:
            self.states[f"sensor.{room}_presence_health"] = "ok"
            self.states[f"binary_sensor.{room}_occupancy"] = "off"
            self.states[f"binary_sensor.{room}_motion_recent"] = "off"
        for entity in ("binary_sensor.pir_motion_sensor_corredor_movimento",
                       "binary_sensor.lv_sensor_presenca_movimento",
                       "binary_sensor.lavabo_motion_recent", "binary_sensor.lavabo_occupancy"):
            self.states[entity] = "off"
        self.states["sensor.desktop_melg9vv_office_pc_session_state"] = "Locked"
        for entity in BLOCK["variables"]["office_activity_entities"]:
            self.states[entity] = "off"
        self.settle()

    def render(self, value):
        if not isinstance(value, str) or not any(marker in value for marker in ("{{", "{%")):
            return value
        rendered = self.env.from_string(value).render(**self.variables).strip()
        try:
            return ast.literal_eval(rendered)
        except (ValueError, SyntaxError):
            return rendered

    def load_variables(self):
        self.variables = {}
        for name, value in BLOCK["variables"].items():
            self.variables[name] = self.render(copy.deepcopy(value))

    def update_entity(self, entity_id):
        config = ENTITIES[entity_id]
        result = self.render(config["state"])
        if entity_id.startswith("binary_sensor."):
            if not isinstance(result, bool):
                raise AssertionError(f"Expected native bool for {entity_id}, got {result!r}")
            previous = self.last_results.get(entity_id)
            if result != previous:
                self.pending.pop(entity_id, None)
                self.last_results[entity_id] = result
                if result and config.get("delay_on") and self.states.get(entity_id) != "on":
                    self.pending[entity_id] = self.clock + config["delay_on"]["seconds"]
                else:
                    self.states[entity_id] = "on" if result else "off"
            if entity_id in self.pending and self.clock >= self.pending[entity_id]:
                self.states[entity_id] = "on"
                del self.pending[entity_id]
        else:
            self.states[entity_id] = str(result)
        self.attributes[entity_id] = {
            key: self.render(value) for key, value in config.get("attributes", {}).items()
        }

    def settle(self):
        self.update_entity(OBSERVATION)
        for entity in BLOCK["binary_sensor"]:
            self.update_entity(entity["default_entity_id"])
        self.update_entity(COVERAGE)
        self.update_entity(GLOBAL)

    def set(self, **changes):
        self.states.update(changes)
        self.settle()

    def advance(self, seconds):
        self.clock += seconds
        self.settle()

    def restart_or_reload(self, startup_delay=0):
        # Deliberately retain the old ON/empty state, as HA can restore it.
        self.pending.clear()
        self.last_results.clear()
        # HA resolves ScriptVariables again in _async_template_startup, after
        # async_at_start, not at configuration parsing / constructor time.
        self.clock += startup_delay
        self.load_variables()
        self.settle()

    def confirm_empty(self):
        self.advance(60)
        self.advance(900)


class OccupancyCoreTests(unittest.TestCase):
    def setUp(self):
        self.h = House()

    def test_only_observation_entities_no_actions_or_triggers(self):
        self.assertEqual(set(PACKAGE), {"template"})
        self.assertEqual(set(BLOCK), {"variables", "sensor", "binary_sensor"})
        self.assertEqual(len(ENTITIES), 8)
        self.assertEqual(len({v["unique_id"] for v in ENTITIES.values()}), 8)
        self.assertEqual(ENTITIES[CONFIRMED]["delay_on"], {"seconds": 900})
        self.assertNotIn("availability", ENTITIES[CONFIRMED])
        self.assertEqual(BLOCK["variables"]["startup_observation_seconds"], 60)
        self.assertEqual(BLOCK["variables"]["minimum_healthy_rooms"], 5)

    def test_boot_is_unknown_without_positive_evidence(self):
        self.assertEqual(self.h.states[GLOBAL], "unknown")
        self.assertEqual(self.h.states[CANDIDATE], "off")
        self.assertEqual(self.h.states[CONFIRMED], "off")
        self.assertEqual(self.h.attributes[GLOBAL]["reason"], "startup_observation")

    def test_person_home_immediately_even_during_boot(self):
        self.h.set(**{PERSON: "home"})
        self.assertEqual(self.h.states[GLOBAL], "occupied")
        self.assertEqual(self.h.states[STRONG], "on")

    def test_each_healthy_occupied_room_is_strong(self):
        for room in ROOMS:
            with self.subTest(room=room):
                h = House()
                h.set(**{f"binary_sensor.{room}_occupancy": "on"})
                self.assertEqual(h.states[GLOBAL], "occupied")

    def test_each_primary_motion_is_weak(self):
        for room in ROOMS:
            with self.subTest(room=room):
                h = House()
                h.set(**{f"binary_sensor.{room}_motion_recent": "on"})
                self.assertEqual(h.states[GLOBAL], "probably_occupied")
                self.assertEqual(h.states[STRONG], "off")

    def test_named_zone_is_away_but_unknown_is_not(self):
        self.h.advance(60)
        for value in ("not_home", "Trabalho", "Escola"):
            self.h.set(**{PERSON: value})
            self.assertEqual(self.h.states[GLOBAL], "probably_empty")
        for value in ("unknown", "unavailable", "", "none"):
            self.h.set(**{PERSON: value})
            self.assertEqual(self.h.states[GLOBAL], "unknown")
            self.assertEqual(self.h.states[CANDIDATE], "off")

    def test_confirmation_requires_full_900_seconds_after_warmup(self):
        self.h.advance(59)
        self.assertEqual(self.h.states[CANDIDATE], "off")
        self.h.advance(1)
        self.assertEqual(self.h.states[GLOBAL], "probably_empty")
        self.h.advance(899)
        self.assertEqual(self.h.states[CONFIRMED], "off")
        self.h.advance(1)
        self.assertEqual(self.h.states[GLOBAL], "empty_confirmed")

    def test_repeated_true_renders_do_not_restart_delay(self):
        self.h.advance(60)
        deadline = self.h.pending[CONFIRMED]
        for _ in range(14):
            self.h.advance(60)
            self.assertEqual(self.h.pending[CONFIRMED], deadline)
        self.h.advance(60)
        self.assertEqual(self.h.states[GLOBAL], "empty_confirmed")

    def test_motion_cancels_and_restarts_instead_of_pausing(self):
        self.h.advance(60)
        self.h.advance(899)
        self.h.set(**{"binary_sensor.sala_motion_recent": "on"})
        self.assertEqual(self.h.states[GLOBAL], "probably_occupied")
        self.assertNotIn(CONFIRMED, self.h.pending)
        self.h.set(**{"binary_sensor.sala_motion_recent": "off"})
        self.h.advance(899)
        self.assertEqual(self.h.states[CONFIRMED], "off")
        self.h.advance(1)
        self.assertEqual(self.h.states[GLOBAL], "empty_confirmed")

    def test_occupancy_cancels_confirmation_immediately(self):
        self.h.confirm_empty()
        self.h.set(**{"binary_sensor.q_marina_occupancy": "on"})
        self.assertEqual(self.h.states[GLOBAL], "occupied")
        self.assertEqual(self.h.states[CONFIRMED], "off")

    def test_one_or_two_failed_rooms_degrade_without_forcing_unknown(self):
        self.h.advance(60)
        self.h.set(**{"sensor.sala_presence_health": "stale"})
        self.assertEqual(self.h.states[COVERAGE], "degraded")
        self.assertEqual(self.h.states[GLOBAL], "probably_empty")
        self.h.set(**{"sensor.office_presence_health": "unavailable"})
        self.h.advance(3600)
        self.assertEqual(self.h.states[COVERAGE], "degraded")
        self.assertEqual(self.h.states[CONFIRMED], "off")

    def test_third_failed_room_is_structural_loss(self):
        self.h.advance(60)
        for room in ROOMS[:3]:
            self.h.set(**{f"sensor.{room}_presence_health": "unknown"})
        self.assertEqual(self.h.states[COVERAGE], "insufficient")
        self.assertEqual(self.h.states[GLOBAL], "unknown")

    def test_positive_evidence_wins_under_insufficient_coverage(self):
        for room in ROOMS[:6]:
            self.h.set(**{f"sensor.{room}_presence_health": "unavailable"})
        self.h.set(**{"binary_sensor.q_miguel_occupancy": "on"})
        self.assertEqual(self.h.states[COVERAGE], "insufficient")
        self.assertEqual(self.h.states[GLOBAL], "occupied")
        self.h.set(**{"binary_sensor.q_miguel_occupancy": "off", PERSON: "home"})
        self.assertEqual(self.h.states[GLOBAL], "occupied")

    def test_unhealthy_occupied_source_is_not_strong(self):
        for health in ("stale", "degraded", "initializing", "unknown", "unavailable"):
            with self.subTest(health=health):
                self.h.set(**{"sensor.sala_presence_health": health,
                              "binary_sensor.sala_occupancy": "on"})
                self.assertEqual(self.h.states[STRONG], "off")

    def test_missing_fact_is_not_silence(self):
        self.h.confirm_empty()
        del self.h.states["binary_sensor.q_casal_occupancy"]
        self.h.settle()
        self.assertEqual(self.h.states[COVERAGE], "degraded")
        self.assertEqual(self.h.states[CONFIRMED], "off")

    def test_health_recovery_requires_new_complete_window(self):
        self.h.advance(60)
        self.h.advance(890)
        self.h.set(**{"sensor.sala_presence_health": "degraded"})
        self.h.advance(500)
        self.h.set(**{"sensor.sala_presence_health": "ok"})
        self.h.advance(899)
        self.assertEqual(self.h.states[CONFIRMED], "off")
        self.h.advance(1)
        self.assertEqual(self.h.states[CONFIRMED], "on")

    def test_restart_and_reload_clear_restored_confirmation(self):
        for event in ("restart", "template_reload"):
            with self.subTest(event=event):
                self.h.confirm_empty()
                self.assertEqual(self.h.states[CONFIRMED], "on")
                self.h.restart_or_reload()
                self.assertEqual(self.h.states[GLOBAL], "unknown")
                self.assertEqual(self.h.states[CONFIRMED], "off")
                self.assertEqual(self.h.states[CANDIDATE], "off")
                self.h.advance(60)
                self.h.advance(899)
                self.assertEqual(self.h.states[CONFIRMED], "off")
                self.h.advance(1)
                self.assertEqual(self.h.states[GLOBAL], "empty_confirmed")

    def test_load_timestamp_is_not_a_sliding_window(self):
        loaded = self.h.variables["observer_loaded_at"]
        self.h.advance(240)
        self.assertEqual(self.h.variables["observer_loaded_at"], loaded)
        self.assertEqual(self.h.states[READY], "on")
        self.h.restart_or_reload()
        self.assertGreater(self.h.variables["observer_loaded_at"], loaded)
        self.assertEqual(self.h.states[READY], "off")

    def test_slow_boot_starts_observation_when_listeners_start(self):
        self.h.confirm_empty()
        self.h.restart_or_reload(startup_delay=180)
        self.assertEqual(self.h.states[CONFIRMED], "off")
        self.assertEqual(self.h.states[GLOBAL], "unknown")
        self.h.advance(60)
        self.h.advance(899)
        self.assertEqual(self.h.states[CONFIRMED], "off")
        self.h.advance(1)
        self.assertEqual(self.h.states[GLOBAL], "empty_confirmed")

    def test_corridor_offline_vetoes_absence_before_health_catches_up(self):
        self.h.confirm_empty()
        self.h.set(**{"binary_sensor.pir_motion_sensor_corredor_movimento": "unavailable"})
        self.assertEqual(self.h.states[COVERAGE], "degraded")
        self.assertEqual(self.h.states[CONFIRMED], "off")

    def test_corridor_raw_pulse_cancels_before_fact_cascade(self):
        self.h.confirm_empty()
        self.h.set(**{"binary_sensor.pir_motion_sensor_corredor_movimento": "on"})
        self.assertEqual(self.h.states[GLOBAL], "probably_occupied")
        self.assertEqual(self.h.states[CONFIRMED], "off")

    def test_lavabo_is_supplemental_not_spatial_proof(self):
        self.h.set(**{"binary_sensor.lavabo_occupancy": "on"})
        self.assertEqual(self.h.states[GLOBAL], "probably_occupied")
        self.assertEqual(self.h.states[STRONG], "off")

    def test_lavabo_raw_pulse_cannot_be_lost_in_fact_cascade(self):
        self.h.confirm_empty()
        self.h.set(**{"binary_sensor.lv_sensor_presenca_movimento": "on"})
        self.assertEqual(self.h.states[GLOBAL], "probably_occupied")
        self.assertEqual(self.h.states[CONFIRMED], "off")

    def test_lavabo_offline_does_not_make_synthetic_off_credible(self):
        self.h.confirm_empty()
        self.h.set(**{"binary_sensor.lv_sensor_presenca_movimento": "unavailable"})
        self.assertEqual(self.h.states[COVERAGE], "degraded")
        self.assertEqual(self.h.states[CONFIRMED], "off")
        self.assertIn("binary_sensor.lv_sensor_presenca_movimento",
                      self.h.attributes[COVERAGE]["invalid_sources"])

    def test_supervised_office_activity_is_only_weak(self):
        self.h.set(**{
            "binary_sensor.office_pc_active": "on",
            "sensor.desktop_melg9vv_office_pc_session_state": "Unlocked",
            "sensor.desktop_melg9vv_office_pc_idle_time": datetime.fromtimestamp(
                self.h.clock - 30, timezone.utc).isoformat(),
        })
        self.assertEqual(self.h.states[GLOBAL], "probably_occupied")
        self.assertEqual(self.h.states[STRONG], "off")
        self.h.advance(271)
        self.assertEqual(self.h.states[GLOBAL], "probably_empty")

    def test_frozen_future_or_missing_office_timestamp_is_ignored(self):
        self.h.advance(60)
        self.h.set(**{"binary_sensor.office_pc_active": "on",
                      "sensor.desktop_melg9vv_office_pc_session_state": "Unlocked"})
        for value in ("unknown", "unavailable", "bad-date",
                      datetime.fromtimestamp(self.h.clock - 301, timezone.utc).isoformat(),
                      datetime.fromtimestamp(self.h.clock + 1, timezone.utc).isoformat()):
            self.h.set(**{"sensor.desktop_melg9vv_office_pc_idle_time": value})
            self.assertEqual(self.h.states[WEAK], "off")

    def test_devices_and_all_camera_events_are_ignored(self):
        self.h.advance(60)
        self.h.set(**{"light.grupo_luzes_sala": "on", "climate.ac_sala": "cool",
                      "media_player.echo_pop_office": "playing", "switch.macbook": "on"})
        for prefix in ("sl", "vr", "cz", "as", "of", "qc", "qmi", "qma"):
            self.h.set(**{f"binary_sensor.{prefix}_camera_motion_region_detection": "on",
                          f"bruno_tuya_motion.{prefix}": "ipc_motion"})
        self.h.advance(900)
        self.assertEqual(self.h.states[GLOBAL], "empty_confirmed")
        self.assertEqual(self.h.states[WEAK], "off")

    def test_snapshot_guards_against_old_confirmed_on(self):
        self.h.confirm_empty()
        self.h.states[PERSON] = "home"
        self.h.update_entity(OBSERVATION)
        # Intentionally do not update the binary sensors first.
        self.h.update_entity(GLOBAL)
        self.assertEqual(self.h.states[CONFIRMED], "on")
        self.assertEqual(self.h.states[GLOBAL], "occupied")

    def test_assessment_missing_fails_closed(self):
        self.h.confirm_empty()
        self.h.attributes[OBSERVATION] = {}
        self.h.update_entity(CONFIRMED)
        self.h.update_entity(GLOBAL)
        self.assertEqual(self.h.states[CONFIRMED], "off")
        self.assertEqual(self.h.states[GLOBAL], "unknown")

    def test_diagnostics_match_decision(self):
        self.h.set(**{"binary_sensor.office_motion_recent": "on"})
        self.assertEqual(self.h.attributes[GLOBAL]["reason"], "recent_human_evidence")
        self.assertIn("binary_sensor.office_motion_recent", self.h.attributes[GLOBAL]["weak_sources"])
        self.assertFalse(self.h.attributes[GLOBAL]["physical_actions_enabled"])
        self.assertEqual(self.h.attributes[GLOBAL]["camera_evidence"], "excluded_by_user")


if __name__ == "__main__":
    unittest.main(verbosity=2)
