import { i as w, a as ra, M as na, C as sa, r as O, e as v, b as A, O as H, p as la, m as R, R as ca, c as G, d as da, f as pa, g as ma, o as I, h as ha, j as N, k as ua, l as ga, s as ba, A as b, n as l, q as xa, t as fa, u as va, v as wa, w as F } from "./main.i7nzQBTG.js";
const _a = {
  sala: {
    title: "Sala",
    background: "/local/images/sala_estar.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/sala_estar.jpg?v=20260702-all-images-1",
    spotifyDeviceName: "Echo Show",
    climateDeviceName: "Gree",
    tvStandbyImage: "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    tvApps: [
      {
        key: "netflix",
        label: "Netflix",
        image: "/local/images/netflix_bg.jpg?v=20260702-all-images-1",
        script: "script.sala_tv_open_netflix"
      },
      {
        key: "prime",
        label: "Prime Video",
        image: "/local/images/prime_video_tile.png?v=20260702-all-images-1",
        script: "script.sala_tv_open_prime"
      },
      {
        key: "disney",
        label: "Disney+",
        image: "/local/images/dp_bg.jpg?v=20260702-all-images-1",
        script: "script.sala_tv_open_disney"
      },
      {
        key: "max",
        label: "Max",
        image: "/local/images/HBOMax_bg.jpg?v=20260702-all-images-1",
        script: "script.sala_tv_open_hbo"
      }
    ],
    entities: {
      curtain: "cover.cortina_varanda_cortina_2",
      curtainPercentControl: "number.cortina_varanda_percent_control",
      activeSensor: "sensor.living_room_active",
      semanticSensor: "sensor.sala_semantic_state_supervised",
      motionRecent: "binary_sensor.sala_motion_recent",
      occupancy: "binary_sensor.sala_occupancy",
      presence: "binary_sensor.sensor_4_in_1_sala_presence",
      illuminance: "sensor.sensor_4_in_1_sala_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_sala_temperature",
        "sensor.sl_sensor_temp_humid_temperatura"
      ],
      humidity: [
        "sensor.sensor_4_in_1_sala_humidity",
        "sensor.sl_sensor_temp_humid_umidade"
      ],
      roomGroup: "light.grupo_luzes_sala",
      cameraMain: "camera.sl_camera_profile_1",
      cameraSecondary: "camera.vr_camera_profile_1",
      activeCameraSelect: "input_select.bento_active_camera",
      // TV híbrida: power/volume pela Android TV Remote estável; metadata/artwork pela ADB.
      tv: "media_player.smart_tv_pro_2",
      tvMedia: "media_player.android_tv_192_168_3_17",
      tvRemote: "remote.smart_tv_pro",
      spotify: "media_player.spotifyplus_bruno_helasio",
      speaker: "media_player.echo_show",
      climate: "climate.sl_ar_condicionado",
      ps5: "switch.ps5_power",
      ps5Image: "/local/images/ps5.png?v=20260702-all-images-1",
      lights: [
        {
          entity: "light.sala_switch_2",
          name: "Luz principal",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.sala_switch_1",
          name: "Led esquerdo",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.sala_switch_3",
          name: "Led direito",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.sala_2_switch_2",
          name: "Luz principal",
          iconType: "ledstrip",
          zone: "varanda"
        },
        {
          entity: "light.varanda_switch_2",
          name: "Pendente",
          iconType: "pendant",
          zone: "varanda"
        },
        {
          entity: "light.varanda_switch_1",
          name: "Area gourmet",
          iconType: "ledstrip",
          zone: "varanda"
        },
        {
          entity: "light.sala_2_switch_3",
          name: "Cristaleira",
          iconType: "ledstrip",
          zone: "varanda"
        }
      ],
      cameras: [
        {
          entity: "camera.sl_camera_profile_1",
          name: "Sala Principal",
          shortName: "Sala",
          controls: [
            {
              key: "sound",
              label: "Som",
              description: "Detecção de som",
              icon: "mdi:microphone-outline",
              entity: "switch.sl_camera_deteccao_de_som"
            },
            {
              key: "motion",
              label: "Mov.",
              description: "Alarme de movimento",
              icon: "mdi:run-fast",
              entity: "switch.sl_camera_alarme_de_movimento"
            },
            {
              key: "privacy",
              label: "Priv.",
              description: "Modo de privacidade",
              icon: "mdi:eye-off-outline",
              entity: "switch.sl_camera_modo_de_privacidade"
            }
          ]
        },
        {
          entity: "camera.vr_camera_profile_1",
          name: "Sala Lateral",
          shortName: "Varanda",
          controls: [
            {
              key: "sound",
              label: "Som",
              description: "Detecção de som",
              icon: "mdi:microphone-outline",
              entity: "switch.vr_camera_deteccao_de_som"
            },
            {
              key: "motion",
              label: "Mov.",
              description: "Alarme de movimento",
              icon: "mdi:run-fast",
              entity: "switch.vr_camera_alarme_de_movimento"
            },
            {
              key: "privacy",
              label: "Priv.",
              description: "Modo de privacidade",
              icon: "mdi:eye-off-outline",
              entity: "switch.vr_camera_modo_de_privacidade"
            }
          ]
        }
      ]
    }
  },
  office: {
    title: "Office",
    background: "/local/images/office.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/office.jpg?v=20260702-all-images-1",
    spotifyDeviceName: "Echo Pop Office",
    climateDeviceName: "Gree",
    pcImage: "/local/images/office_pc.png?v=20260702-all-images-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    entities: {
      activeSensor: "sensor.office_active",
      semanticSensor: "sensor.office_semantic_state_supervised",
      motionRecent: "binary_sensor.office_motion_recent",
      occupancy: "binary_sensor.office_occupancy",
      meeting: "binary_sensor.office_meeting_active",
      working: "binary_sensor.office_working_active",
      presence: "binary_sensor.sensor_4_in_1_office_presence",
      illuminance: "sensor.sensor_4_in_1_office_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_office_temperature"
      ],
      humidity: [
        "sensor.sensor_4_in_1_office_humidity"
      ],
      roomGroup: "light.grupo_luzes_office",
      cameraMain: "camera.of_camera_profile_1",
      spotify: "media_player.spotifyplus_bruno_helasio",
      speaker: "media_player.echo_pop_office",
      climate: "climate.ac_office",
      pcActive: "binary_sensor.office_pc_active",
      pcPower: "button.desktop_melg9vv_pc_office_switch",
      pcShutdown: "button.desktop_melg9vv_pc_office_desliga",
      pcSleep: "button.desktop_melg9vv_pc_office_sleep",
      pcRestart: "button.desktop_melg9vv_pc_office_reiniciar",
      pcLock: "button.desktop_melg9vv_pc_office_bloquear",
      pcSession: "sensor.desktop_melg9vv_office_pc_session_state",
      pcIdle: "sensor.desktop_melg9vv_office_pc_idle_time",
      pcWindow: "sensor.desktop_melg9vv_office_pc_active_window",
      lights: [
        {
          entity: "light.office_switch_3",
          name: "Luz central",
          iconType: "light_flush",
          zone: "office"
        },
        {
          entity: "light.office_switch_2",
          name: "Luz ambiente",
          iconType: "light_flush",
          zone: "office"
        },
        {
          entity: "light.office_switch_1",
          name: "Luz estante",
          iconType: "ledstrip",
          zone: "office"
        }
      ],
      cameras: [
        {
          entity: "camera.of_camera_profile_1",
          name: "Office",
          shortName: "Office",
          controls: [
            {
              key: "sound",
              label: "Som",
              description: "Detecção de som",
              icon: "mdi:microphone-outline",
              entity: "switch.of_camera_deteccao_de_som"
            },
            {
              key: "motion",
              label: "Mov.",
              description: "Alarme de movimento",
              icon: "mdi:run-fast",
              entity: "switch.of_camera_alarme_de_movimento"
            },
            {
              key: "privacy",
              label: "Priv.",
              description: "Modo de privacidade",
              icon: "mdi:eye-off-outline",
              entity: "switch.of_camera_modo_de_privacidade"
            }
          ]
        }
      ]
    }
  },
  cozinha: {
    title: "Cozinha",
    background: "/local/images/cozinha.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/cozinha.jpg?v=20260702-all-images-1",
    entities: {
      activeSensor: "sensor.cozinha_active",
      semanticSensor: "sensor.cozinha_semantic_state_supervised",
      motionRecent: "binary_sensor.cozinha_motion_recent",
      occupancy: "binary_sensor.cozinha_occupancy",
      presence: "binary_sensor.sensor_4_in_1_cozinha_presence",
      illuminance: "sensor.sensor_4_in_1_cozinha_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_cozinha_temperature",
        "sensor.temperatura_cozinha",
        "sensor.cozinha_temperature",
        "sensor.cozinha_temperatura"
      ],
      humidity: [
        "sensor.sensor_4_in_1_cozinha_humidity",
        "sensor.umidade_cozinha",
        "sensor.cozinha_humidity",
        "sensor.cozinha_umidade"
      ],
      roomGroup: "light.grupo_luzes_cozinha",
      cameraMain: "camera.cz_camera_profile_1",
      cameraSecondary: "camera.as_camera_profile_1",
      dishwasher: "sensor.lava_loucas_operation_state",
      dishwasherPower: "switch.cz_tomada_maq_lav_louca_socket_1",
      lights: [
        {
          entity: "light.cozinha_switch_2",
          name: "Luz principal 1",
          iconType: "ledstrip",
          zone: "cozinha"
        },
        {
          entity: "light.cozinha_switch_3",
          name: "Luz principal 2",
          iconType: "ledstrip",
          zone: "cozinha"
        },
        {
          entity: "light.cozinha_switch_1",
          name: "Lavanderia",
          iconType: "light_flush",
          zone: "cozinha"
        }
      ],
      appliances: [
        {
          key: "dishwasher",
          name: "Lava-louças",
          entity: "switch.cz_tomada_maq_lav_louca_socket_1",
          stateEntity: "sensor.lava_loucas_operation_state",
          moreInfoEntity: "switch.cz_tomada_maq_lav_louca_socket_1",
          image: "/local/images/lava_louca.png?v=20260702-all-images-1",
          activeStates: [
            "on",
            "run"
          ],
          activeAttr: "dishwasher_running",
          activeLabel: "Lavando",
          onLabel: "Ligada",
          idleLabel: "Ligada",
          offLabel: "Desligada"
        },
        {
          key: "airfryer",
          name: "Air fryer",
          image: "/local/images/air_fry.png?v=20260702-all-images-1",
          placeholder: !0,
          placeholderLabel: "Sem tomada"
        },
        {
          key: "fridge",
          name: "Geladeira",
          image: "/local/images/geladeira.png?v=20260702-all-images-1",
          placeholder: !0,
          placeholderLabel: "Sem tomada"
        },
        {
          key: "microwave",
          name: "Micro-ondas",
          image: "/local/images/microondas.png?v=20260702-all-images-1",
          placeholder: !0,
          placeholderLabel: "Sem tomada"
        },
        {
          key: "washer",
          name: "Lavadora",
          image: "/local/images/lava_roupa.png?v=20260702-all-images-1",
          placeholder: !0,
          placeholderLabel: "Wi-Fi pendente"
        }
      ],
      cameras: [
        {
          entity: "camera.cz_camera_profile_1",
          name: "Cozinha",
          shortName: "Cozinha",
          controls: [
            {
              key: "sound",
              label: "Som",
              description: "Detecção de som",
              icon: "mdi:microphone-outline",
              entity: "switch.cz_camera_deteccao_de_som"
            },
            {
              key: "motion",
              label: "Mov.",
              description: "Alarme de movimento",
              icon: "mdi:run-fast",
              entity: "switch.cz_camera_alarme_de_movimento"
            },
            {
              key: "privacy",
              label: "Priv.",
              description: "Modo de privacidade",
              icon: "mdi:eye-off-outline",
              entity: "switch.cz_camera_modo_de_privacidade"
            }
          ]
        },
        {
          entity: "camera.as_camera_profile_1",
          name: "Area de Servico",
          shortName: "Area"
        }
      ]
    }
  },
  casal: {
    title: "Q. Casal",
    background: "/local/images/quarto_casal.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/quarto_casal.jpg?v=20260702-all-images-1",
    spotifyDeviceName: "Echo Pop Quarto Casal",
    climateDeviceName: "Gree",
    tvStandbyImage: "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    tvApps: [
      {
        key: "netflix",
        label: "Netflix",
        image: "/local/images/netflix_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "prime",
        label: "Prime Video",
        image: "/local/images/prime_video_tile.png?v=20260702-all-images-1"
      },
      {
        key: "disney",
        label: "Disney+",
        image: "/local/images/dp_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "max",
        label: "Max",
        image: "/local/images/HBOMax_bg.jpg?v=20260702-all-images-1"
      }
    ],
    lightZoneLabels: {
      sala: "Quarto",
      varanda: "Suíte"
    },
    lightZoneIcons: {
      varanda: "hugeicons:shower-head"
    },
    entities: {
      activeSensor: "sensor.quarto_casal_active",
      semanticSensor: "sensor.q_casal_semantic_state_supervised",
      motionRecent: "binary_sensor.q_casal_motion_recent",
      occupancy: "binary_sensor.q_casal_occupancy",
      presence: "binary_sensor.sensor_4_in_1_q_casal_presence",
      illuminance: "sensor.sensor_4_in_1_q_casal_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_q_casal_temperature"
      ],
      humidity: [
        "sensor.sensor_4_in_1_q_casal_humidity"
      ],
      roomGroup: "light.grupo_quarto_casal",
      cameraMain: "camera.qc_camera_profile_1",
      spotify: "media_player.spotifyplus_bruno_helasio",
      speaker: "media_player.echo_pop_quarto_casal",
      climate: "climate.qc_ar_condicionado",
      lights: [
        {
          entity: "light.qc_luz_principal",
          name: "Luz principal",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.quarto_casal_switch_1",
          name: "Luzes quadros",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_casal_2_switch_2",
          name: "Luz sanca",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_casal_switch_2",
          name: "Luzes closet",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.suite_casal_switch_1",
          name: "Luz principal",
          iconType: "light_flush",
          zone: "varanda"
        },
        {
          entity: "light.suite_casal_switch_2",
          name: "Luz azul",
          iconType: "light_flush",
          zone: "varanda"
        }
      ],
      cameras: [
        {
          entity: "camera.qc_camera_profile_1",
          name: "Quarto Casal",
          shortName: "Casal"
        }
      ]
    }
  },
  marina: {
    title: "Q. Marina",
    background: "/local/images/quarto_marina.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/quarto_marina.jpg?v=20260702-all-images-1",
    spotifyDeviceName: "Echo Pop Marina",
    climateDeviceName: "Gree",
    tvStandbyImage: "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    tvApps: [
      {
        key: "netflix",
        label: "Netflix",
        image: "/local/images/netflix_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "prime",
        label: "Prime Video",
        image: "/local/images/prime_video_tile.png?v=20260702-all-images-1"
      },
      {
        key: "disney",
        label: "Disney+",
        image: "/local/images/dp_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "max",
        label: "Max",
        image: "/local/images/HBOMax_bg.jpg?v=20260702-all-images-1"
      }
    ],
    lightZoneLabels: {
      sala: "Quarto",
      varanda: "Suíte"
    },
    lightZoneIcons: {
      varanda: "hugeicons:shower-head"
    },
    entities: {
      activeSensor: "sensor.quarto_marina_active",
      motionRecent: "binary_sensor.q_marina_motion_recent",
      occupancy: "binary_sensor.q_marina_occupancy",
      semanticSensor: "sensor.q_marina_semantic_state_supervised",
      presence: "binary_sensor.sensor_4_in_1_q_marina_presence",
      illuminance: "sensor.sensor_4_in_1_q_marina_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_q_marina_temperature",
        "sensor.temperatura_quarto_marina",
        "sensor.qma_temperatura"
      ],
      humidity: [
        "sensor.sensor_4_in_1_q_marina_humidity",
        "sensor.umidade_quarto_marina",
        "sensor.qma_umidade"
      ],
      roomGroup: "light.grupo_luzes_quarto_marina",
      cameraMain: "camera.qma_camera_profile_1",
      spotify: "media_player.spotifyplus_bruno_helasio",
      speaker: "media_player.echo_pop_marina",
      climate: [
        "climate.ac_quarto_marina",
        "climate.q_marina_ar_condicionado",
        "climate.q_marina_ac",
        "climate.qma_ar_condicionado",
        "climate.qma_ac",
        "climate.quarto_marina_ar_condicionado",
        "climate.quarto_marina_ac",
        "climate.ar_condicionado_quarto_marina",
        "climate.ar_condicionado_marina",
        "climate.marina_ar_condicionado",
        "climate.marina_ac"
      ],
      lights: [
        {
          entity: "light.quarto_marina_switch_4",
          name: "Luz principal",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_marina_switch_1",
          name: "Arandela",
          iconType: "sconce",
          zone: "sala"
        },
        {
          entity: "light.quarto_marina_switch_2",
          name: "Estante",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_marina_switch_3",
          name: "Luz cortineiro",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.suite_marina_switch_2",
          name: "Luz principal",
          iconType: "light_flush",
          zone: "varanda"
        },
        {
          entity: "light.suite_marina_switch_1",
          name: "Luz azul",
          iconType: "light_flush",
          zone: "varanda"
        }
      ],
      cameras: [
        {
          entity: "camera.qma_camera_profile_1",
          name: "Quarto Marina",
          shortName: "Marina"
        }
      ]
    }
  },
  miguel: {
    title: "Q. Miguel",
    background: "/local/images/quarto_miguel.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/quarto_miguel.jpg?v=20260702-all-images-1",
    climateDeviceName: "Gree",
    tvStandbyImage: "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    tvApps: [
      {
        key: "netflix",
        label: "Netflix",
        image: "/local/images/netflix_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "prime",
        label: "Prime Video",
        image: "/local/images/prime_video_tile.png?v=20260702-all-images-1"
      },
      {
        key: "disney",
        label: "Disney+",
        image: "/local/images/dp_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "max",
        label: "Max",
        image: "/local/images/HBOMax_bg.jpg?v=20260702-all-images-1"
      }
    ],
    lightZoneLabels: {
      sala: "Quarto",
      varanda: "Suíte"
    },
    lightZoneIcons: {
      varanda: "hugeicons:shower-head"
    },
    entities: {
      activeSensor: "sensor.quarto_miguel_active",
      semanticSensor: "sensor.q_miguel_semantic_state_supervised",
      motionRecent: "binary_sensor.q_miguel_motion_recent",
      occupancy: "binary_sensor.q_miguel_occupancy",
      presence: "binary_sensor.sensor_4_in_1_q_miguel_presence",
      illuminance: "sensor.sensor_4_in_1_q_miguel_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_q_miguel_temperature",
        "sensor.temperatura_quarto_miguel",
        "sensor.qmi_temperatura"
      ],
      humidity: [
        "sensor.sensor_4_in_1_q_miguel_humidity",
        "sensor.umidade_quarto_miguel",
        "sensor.qmi_umidade"
      ],
      roomGroup: "light.grupo_luzes_quarto_miguel",
      cameraMain: "camera.qmi_camera_profile_1",
      climate: "climate.ac_quarto_miguel",
      lights: [
        {
          entity: "light.quarto_miguel_switch_2",
          name: "Luz principal",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_2_switch_1",
          name: "Luzes armario",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_2_switch_2",
          name: "Arandela poltrona",
          iconType: "sconce",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_2_switch_3",
          name: "Arandela berco",
          iconType: "sconce",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_switch_1",
          name: "Luz prateleiras",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_switch_3",
          name: "Luz cortineiro",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.suite_miguel_switch_1",
          name: "Luz suite",
          iconType: "light_flush",
          zone: "varanda"
        },
        {
          entity: "light.suite_miguel_switch_2",
          name: "Luz azul suite",
          iconType: "light_flush",
          zone: "varanda"
        }
      ],
      cameras: [
        {
          entity: "camera.qmi_camera_profile_1",
          name: "Quarto Miguel",
          shortName: "Miguel"
        }
      ]
    }
  }
};
function ya(u, a, o, e = {}) {
  return u.callService(a, o, e);
}
const E = /* @__PURE__ */ new Set(), S = { timer: void 0, ouvindoVisibilidade: !1 }, qa = 1e3;
function W() {
  for (const u of [...E])
    try {
      u();
    } catch {
    }
}
function J() {
  return typeof document < "u" && document.visibilityState === "hidden";
}
function K() {
  S.timer !== void 0 || E.size === 0 || J() || (S.timer = globalThis.setInterval(W, qa));
}
function aa() {
  S.timer !== void 0 && (globalThis.clearInterval(S.timer), S.timer = void 0);
}
function ka() {
  if (J()) {
    aa();
    return;
  }
  E.size > 0 && (W(), K());
}
function za() {
  S.ouvindoVisibilidade || typeof document > "u" || (document.addEventListener("visibilitychange", ka), S.ouvindoVisibilidade = !0);
}
function Aa(u) {
  E.add(u), za(), K();
  let a = !1;
  return () => {
    a || (a = !0, E.delete(u), E.size === 0 && aa());
  };
}
const Ca = [
  "camera.sl_camera_profile_1",
  "camera.vr_camera_profile_1",
  "camera.cz_camera_profile_1",
  "camera.as_camera_profile_1",
  "camera.of_camera_profile_1",
  "camera.qc_camera_profile_1",
  "camera.qmi_camera_profile_1",
  "camera.qma_camera_profile_1"
];
function V(u) {
  return !!u && Ca.includes(u);
}
const Sa = w`
:host {
  --room-gap: 10px;
  --room-radius: var(--bruno-liquid-card-radius, 18px);
  --room-radius-small: var(--bruno-liquid-card-radius-compact, 16px);
  --room-cell-radius: var(--bruno-liquid-cell-radius, 16px);
  --accent: var(--bruno-liquid-accent, 150, 190, 255);
  --accent-blue: 96, 165, 250;
  --accent-cyan: 79, 172, 254;
  --accent-amber: 255, 183, 77;
  --media-screen-height: 150px;
  --ac-h: 320px;
  --text-main: rgba(245,250,255,0.96);
  --text-soft: rgba(255,255,255,0.62);
  --text-dim: rgba(255,255,255,0.42);
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--text-main);
  font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  overflow: hidden;
}
* {
  box-sizing: border-box;
  letter-spacing: 0;
}
button {
  font: inherit;
  color: inherit;
  border: 0;
  outline: 0;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
.hero-panel {
}
.side-panel {
  grid-area: side;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: clamp(56.16px, 3.96cqi, 93.6px) minmax(0, 1fr);
  gap: var(--room-gap);
}
.tv-card {
  grid-area: tv;
}
.ps5-card {
  grid-area: ps5;
}
.room-rail-mount {
  grid-area: frame-left;
  min-width: 0;
  min-height: 0;
  position: relative;
  z-index: 3;
}
.room-rail-mount > * {
  height: 100%;
}
.subview-topbar {
  grid-area: frame-top;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
}
.subview-room {
  grid-column: 2;
  text-align: center;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(226,232,240,0.82);
  white-space: nowrap;
}
.subview-clock {
  grid-column: 3;
  justify-self: end;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,0.86);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  line-height: 1;
}
.subview-clock small {
  color: rgba(226,232,240,0.55);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
}
.room-sidebar::before {
  display: none;
}
.room-nav-button::after {
  display: none;
}
.room-nav-button:hover, .room-nav-button:focus, .room-nav-button:focus-visible {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.05);
  outline: none;
}
.room-nav-button.is-active {
  color: #fff;
  background: rgba(255,255,255,0.085);
  border: none;
  box-shadow: none;
}
.room-nav-button.is-active svg {
  stroke: rgb(var(--accent));
}
.room-nav-home {
  margin-bottom: clamp(6.24px, 0.44cqi, 10.4px);
}
.room-nav-label {
  display: block;
  font-size: clamp(7.41px, 0.52cqi, 12.35px);
  line-height: 1.05;
  font-weight: 600;
  color: inherit;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.room-nav-button svg {
  width: clamp(14.82px, 1.04cqi, 24.7px);
  height: clamp(14.82px, 1.04cqi, 24.7px);
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.55;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));
  pointer-events: none;
}
.glass-card {
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: 0;
  border-radius: var(--room-radius);
  overflow: hidden;
  color: var(--text-main);
  background: var(--bruno-liquid-surface-off-background, radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%), radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%), linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)), linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32)) );
  backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
  -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
  border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
  box-shadow: var(--bruno-liquid-surface-off-shadow, inset 0 1px 0 rgba(255,255,255,0.18), inset 1px 0 0 rgba(255,255,255,0.10), inset -1px -1px 0 rgba(255,255,255,0.026), 0 18px 44px rgba(0,0,0,0.27), 0 0 24px rgba(110,150,210,0.055) );
  transition: background var(--bruno-liquid-motion-medium, 220ms cubic-bezier(0.2, 0.8, 0.2, 1)), border-color var(--bruno-liquid-motion-fast, 160ms ease), box-shadow var(--bruno-liquid-motion-medium, 220ms cubic-bezier(0.2, 0.8, 0.2, 1));
}
.glass-card::before {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: 0;
  pointer-events: none;
  border-radius: calc(var(--room-radius) - 1px);
  background: var(--bruno-liquid-surface-off-sheen, radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%), radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%), linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%), linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%) );
  opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
}
.glass-card::after {
  content: "";
  position: absolute;
  inset: var(--bruno-subview-card-edge-inset, auto 16px 8px 16px);
  z-index: var(--bruno-subview-card-edge-z, 0);
  height: var(--bruno-subview-card-edge-height, 1px);
  padding: var(--bruno-subview-card-edge-padding, 0);
  box-sizing: border-box;
  pointer-events: none;
  border-radius: var(--bruno-subview-card-edge-radius, 999px);
  background: var(--bruno-subview-card-edge-background, var(--bruno-liquid-surface-bottom-line, linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)));
  -webkit-mask: var(--bruno-subview-card-edge-mask, none);
  -webkit-mask-composite: var(--bruno-subview-card-edge-webkit-composite, source-over);
  mask: var(--bruno-subview-card-edge-mask, none);
  mask-composite: var(--bruno-subview-card-edge-composite, add);
  opacity: var(--bruno-subview-card-edge-opacity, var(--bruno-liquid-surface-bottom-line-opacity, 0));
}
.glass-card > * {
  position: relative;
  z-index: 1;
}
.glass-card.is-active {
  --text-main: rgba(248,251,255,0.96);
  --text-soft: rgba(255,255,255,0.52);
  background: var(--bruno-liquid-surface-on-background, radial-gradient(170px 134px at 12% -10%, rgba(255,255,255,0.38), rgba(255,255,255,0.105) 52%, transparent 75%), radial-gradient(165px 148px at 98% 94%, rgba(135,185,245,0.24), transparent 68%), radial-gradient(122px 96px at 27% 18%, rgba(255,232,126,0.105), transparent 71%), linear-gradient(180deg, rgba(255,255,255,0.225), rgba(255,255,255,0.073) 43%, rgba(255,255,255,0.108)), linear-gradient(155deg, rgba(42,51,65,0.72), rgba(23,28,38,0.58) 52%, rgba(13,16,24,0.44)) );
  backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
  -webkit-backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
  border-color: var(--bruno-liquid-surface-on-border-color, rgba(255,255,255,0.24));
  box-shadow: var(--bruno-liquid-surface-on-shadow, inset 0 1px 0 rgba(255,255,255,0.32), inset 1px 0 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.18), 0 0 22px rgba(255,255,255,0.09), 0 0 34px rgba(120,170,235,0.10), 0 18px 42px rgba(0,0,0,0.28) );
}
.glass-card.is-active::before {
  background: var(--bruno-liquid-surface-on-sheen, radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%), radial-gradient(118px 110px at 96% 96%, rgba(120,178,245,0.22), transparent 74%), radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%), linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%), linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%) );
  opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
}
.hero-bg {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  top: clamp(-23.4px, -0.99cqi, -14.04px);
  bottom: clamp(-26px, -1.1cqi, -15.6px);
  left: clamp(-20.8px, -0.88cqi, -12.48px);
  right: clamp(-111.8px, -4.73cqi, -67.08px);
  background: linear-gradient(90deg, rgba(4,10,18,0.82) 0%, rgba(5,10,18,0.66) 12%, rgba(6,12,20,0.42) 24%, rgba(7,13,22,0.22) 38%, rgba(7,13,22,0.10) 50%, rgba(7,13,22,0.14) 60%, rgba(7,13,22,0.30) 70%, rgba(7,13,22,0.54) 82%, rgba(7,13,22,0.80) 92%, rgba(7,13,22,0.94) 100% ), linear-gradient(180deg, rgba(4,8,14,0.78) 0%, rgba(4,8,14,0.46) 10%, rgba(4,8,14,0.18) 22%, rgba(4,8,14,0.04) 34%, rgba(4,8,14,0.00) 46%, rgba(4,8,14,0.00) 58%, rgba(4,8,14,0.10) 72%, rgba(4,8,14,0.28) 84%, rgba(4,8,14,0.56) 94%, rgba(4,8,14,0.78) 100% ), radial-gradient(680px 220px at 12% 4%, rgba(255,255,255,0.07), transparent 56%), radial-gradient(900px 320px at 74% 52%, rgba(255,255,255,0.03), transparent 66%), var(--hero-image) left center / auto 100% no-repeat, var(--hero-fallback-image) left center / auto 100% no-repeat;
  opacity: 1;
  filter: saturate(1.01) brightness(0.90);
  mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.46) 94%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.46) 94%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
}
.hero-bg::before, .hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hero-bg::before {
  background: linear-gradient(90deg, rgba(4,10,18,0.72) 0%, rgba(4,10,18,0.56) 12%, rgba(5,10,18,0.34) 24%, rgba(5,10,18,0.14) 38%, rgba(5,10,18,0.02) 50%, rgba(5,10,18,0.08) 60%, rgba(5,10,18,0.22) 72%, rgba(5,10,18,0.46) 84%, rgba(5,10,18,0.74) 100% ), linear-gradient(180deg, rgba(3,8,14,0.62) 0%, rgba(3,8,14,0.34) 12%, rgba(3,8,14,0.08) 26%, rgba(3,8,14,0.00) 40%, rgba(3,8,14,0.00) 62%, rgba(3,8,14,0.10) 76%, rgba(3,8,14,0.30) 90%, rgba(3,8,14,0.60) 100% );
}
.hero-bg::after {
  background: radial-gradient(720px 220px at 8% 2%, rgba(255,255,255,0.08), transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 20%), linear-gradient(0deg, rgba(0,0,0,0.22), rgba(0,0,0,0.00) 34%);
  opacity: 0.58;
}
.hero-top {
  display: flex;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.back-button, .control-button {
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.08));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.back-button bruno-icon, .control-button bruno-icon {
  --mdc-icon-size: 18px;
}
.hero-title, .module-title {
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  color: var(--text-main);
  white-space: nowrap;
}
.hero-subtitle, .module-subtitle {
  margin-top: clamp(3.12px, 0.22cqi, 5.2px);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  font-weight: 600;
  color: var(--text-soft);
}
.chip-button, .online-chip, .state-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  min-height: clamp(23.4px, 1.65cqi, 39px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
  color: rgba(255,255,255,0.86);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  white-space: nowrap;
}
.chip-button.is-active, .online-chip {
  background: rgba(24,134,190,0.36);
  border-color: rgba(96,190,255,0.46);
}
.curtain-control-row {
  display: grid;
  grid-template-columns: minmax(clamp(73.32px, 5.16cqi, 122.2px), auto) minmax(clamp(74.88px, 5.27cqi, 124.8px), 1fr) auto;
  align-items: center;
  gap: clamp(14.04px, 0.99cqi, 23.4px);
  min-width: 0;
}
.curtain-identity, .title-with-chip {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  min-width: 0;
}
.curtain-icon-shell {
  width: clamp(21.84px, 1.54cqi, 36.4px);
  height: clamp(21.84px, 1.54cqi, 36.4px);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.17), rgba(255,255,255,0.04) 56%, rgba(0,0,0,0.18)), rgba(18,20,21,0.52);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(12px) saturate(1.18);
  -webkit-backdrop-filter: blur(12px) saturate(1.18);
}
.curtain-title {
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: 0;
  color: rgba(255,255,255,0.96);
  white-space: nowrap;
}
.curtain-status {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: clamp(3.9px, 0.27cqi, 6.5px);
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  white-space: nowrap;
}
.curtain-status-text {
  color: var(--curtain-gold);
}
.curtain-status-percent {
  color: rgba(255,255,255,0.78);
  font-weight: 800;
}
.curtain-main-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  min-width: 0;
}
.curtain-action-button.is-muted {
  color: rgba(255,255,255,0.88);
}
.curtain-action-button.is-active {
  color: var(--curtain-gold);
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--curtain-gold-rgb),0.180));
  background: var(--bruno-liquid-control-warm-background, rgba(var(--curtain-gold-rgb),0.038));
  box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
}
.curtain-action-button:active {
  transform: translateY(1px);
  color: var(--curtain-gold);
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--curtain-gold-rgb),0.180));
  background: var(--bruno-liquid-control-warm-background, rgba(var(--curtain-gold-rgb),0.038));
}
.curtain-action-button:disabled, .curtain-mark:disabled, .curtain-range:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}
.curtain-svg {
  display: block;
  fill: rgba(255,255,255,0.70);
  stroke: rgba(255,255,255,0.58);
  stroke-width: 1.78;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}
.curtain-svg.is-main {
  fill: rgba(255,255,255,0.78);
  stroke: rgba(255,255,255,0.54);
}
.curtain-svg.is-stop {
  fill: rgba(255,255,255,0.64);
  stroke: rgba(255,255,255,0.54);
}
.curtain-slider-zone {
  position: relative;
  display: grid;
  gap: 0;
  min-width: 0;
}
.curtain-slider-glow {
  position: absolute;
  left: 0;
  top: -3px;
  width: var(--curtain-position);
  height: clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.11), rgba(var(--curtain-gold-rgb),0.020));
  filter: blur(8px);
  pointer-events: none;
}
.curtain-range {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 3px;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.055);
  background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.62) 0 var(--curtain-position), rgba(var(--curtain-gold-rgb),0.24) var(--curtain-position), rgba(255,255,255,0.11) var(--curtain-position) 100%);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.24);
  cursor: pointer;
  accent-color: var(--curtain-gold);
}
.curtain-range::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 999px;
  background: transparent;
}
.curtain-range::-webkit-slider-thumb {
  width: clamp(9.36px, 0.66cqi, 15.6px);
  height: clamp(9.36px, 0.66cqi, 15.6px);
  margin-top: clamp(-5.85px, -0.25cqi, -3.51px);
  -webkit-appearance: none;
  appearance: none;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.30);
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.86), rgba(var(--curtain-gold-rgb),0.74) 58%, rgba(20,20,20,0.78));
  box-shadow: 0 0 7px rgba(var(--curtain-gold-rgb),0.22), 0 2px 6px rgba(0,0,0,0.34);
}
.curtain-range::-moz-range-track {
  height: 3px;
  border-radius: 999px;
  background: transparent;
}
.curtain-range::-moz-range-progress {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.62), rgba(var(--curtain-gold-rgb),0.24));
}
.curtain-range::-moz-range-thumb {
  width: clamp(9.36px, 0.66cqi, 15.6px);
  height: clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.30);
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.86), rgba(var(--curtain-gold-rgb),0.74) 58%, rgba(20,20,20,0.78));
  box-shadow: 0 0 7px rgba(var(--curtain-gold-rgb),0.22), 0 2px 6px rgba(0,0,0,0.34);
}
.curtain-marks {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: clamp(5.46px, 0.38cqi, 9.1px);
}
.curtain-mark {
  position: relative;
  min-width: 0;
  height: clamp(17.16px, 1.21cqi, 28.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) 0 0;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.42);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 700;
  letter-spacing: 0;
  cursor: pointer;
}
.curtain-mark::before {
  content: "";
  position: absolute;
  top: 1px;
  left: 50%;
  width: 1px;
  height: clamp(3.12px, 0.22cqi, 5.2px);
  transform: translateX(-50%);
  border-radius: 999px;
  background: rgba(255,255,255,0.28);
}
.curtain-mark.is-active {
  color: var(--curtain-gold);
}
.curtain-mark.is-active::before {
  background: rgba(var(--curtain-gold-rgb),0.72);
}
.module-icon, .micro-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: clamp(21.84px, 1.54cqi, 36.4px);
  height: clamp(21.84px, 1.54cqi, 36.4px);
  border-radius: 50%;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.13);
  color: rgba(210,225,240,0.82);
}
.module-icon bruno-icon, .micro-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
}
.soft-button, .primary-button {
  min-height: clamp(28.08px, 1.98cqi, 46.8px);
  padding: 0 clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: var(--bruno-liquid-control-radius, 14px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  color: rgba(255,255,255,0.88);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
}
.soft-button.is-primary, .primary-button {
  background: var(--bruno-liquid-control-blue-background, rgba(24,134,190,0.42));
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,190,255,0.50));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.18));
}
.status-item:last-child {
  border-right: 0;
}
.status-item strong {
  display: block;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.status-item span:not(.micro-icon) {
  display: block;
  margin-top: clamp(3.12px, 0.22cqi, 5.2px);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  color: var(--text-soft);
}
.micro-icon.tone-amber {
  color: rgb(255,183,77);
  background: rgba(255,183,77,0.10);
  border-color: rgba(255,183,77,0.22);
}
.micro-icon.tone-blue {
  color: rgb(180,215,255);
  background: rgba(96,165,250,0.10);
  border-color: rgba(96,165,250,0.20);
}
.micro-icon.tone-cyan {
  color: rgb(111,224,241);
  background: rgba(111,224,241,0.10);
  border-color: rgba(111,224,241,0.20);
}
.micro-icon.tone-green {
  color: rgb(134,224,152);
  background: rgba(134,224,152,0.10);
  border-color: rgba(134,224,152,0.20);
}
.lights-card, .cameras-card, .tv-card, .ps5-card, .spotify-card, .ac-card {
  padding: clamp(10.92px, 0.77cqi, 18.2px);
}
.module-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  min-height: clamp(26.52px, 1.87cqi, 44.2px);
  margin-bottom: clamp(6.24px, 0.44cqi, 10.4px);
}
.head-actions {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.all-label {
  color: rgb(255,154,18);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 900;
}
.chip-button {
  min-width: clamp(40.56px, 2.86cqi, 67.6px);
}
.lights-groups {
  position: relative;
  z-index: 1;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
  align-items: stretch;
  min-height: 0;
  height: 100%;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.light-group {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(4.68px, 0.33cqi, 7.8px);
}
.light-group-label {
  color: rgba(255,255,255,0.54);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 900;
  text-transform: uppercase;
}
.lights-divider {
  align-self: stretch;
  width: 1px;
  border-radius: 999px;
  background: linear-gradient(180deg, transparent, rgba(255,255,255,0.16), rgba(255,183,77,0.26), rgba(255,255,255,0.12), transparent);
  box-shadow: 0 0 14px rgba(255,183,77,0.10);
}
.light-group-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.light-tile.is-on {
  color: rgba(255,255,255,0.98);
  background: var(--bruno-liquid-cell-active-warm-background, radial-gradient(76px 48px at 18% 12%, rgba(255,255,255,0.28), transparent 72%), radial-gradient(96px 58px at 94% 82%, rgba(255,183,77,0.24), transparent 72%), linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.074)), linear-gradient(180deg, rgba(255,183,77,0.10), rgba(255,183,77,0.03)) );
  border-color: var(--bruno-liquid-cell-active-warm-border, rgba(255,205,95,0.44));
  box-shadow: var(--bruno-liquid-cell-active-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.22), inset 1px 0 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.08), 0 0 20px rgba(255,183,77,0.17) );
}
.lights-zone-rail::before {
  content: "";
  position: absolute;
  inset: 1px;
  pointer-events: none;
  border-radius: calc(var(--room-cell-radius) - 1px);
  background: radial-gradient(52px 78px at 50% 20%, rgba(255,191,74,0.10), transparent 66%), linear-gradient(135deg, rgba(255,255,255,0.11), transparent 34%, transparent 70%, rgba(255,188,65,0.05));
  opacity: 0.88;
}
.rail-zone, .rail-state, .rail-track {
  position: relative;
  z-index: 1;
}
.rail-zone {
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 900;
  color: rgba(255,231,176,0.68);
  text-shadow: 0 1px 2px rgba(0,0,0,0.34);
}
.rail-state {
  min-width: clamp(28.08px, 1.98cqi, 46.8px);
  min-height: clamp(16.38px, 1.15cqi, 27.3px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: rgba(255,205,95,0.95);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 900;
  background: rgba(255,183,77,0.10);
  border: 1px solid rgba(255,183,77,0.20);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 calc(14px * var(--rail-glow, 0)) rgba(255,183,77,0.18);
}
.rail-state strong {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  color: rgba(255,235,177,0.98);
}
.rail-track {
  position: relative;
  width: clamp(32.76px, 2.31cqi, 54.6px);
  height: 100%;
  min-height: clamp(96.72px, 6.81cqi, 161.2px);
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,245,210,0.10), rgba(255,196,83,0.035)), radial-gradient(circle at 50% 8%, rgba(255,255,255,0.16), transparent 30%), rgba(8,15,28,0.72);
  border: 1px solid rgba(255,222,152,0.30);
  box-shadow: inset 0 0 16px rgba(255,228,170,0.10), inset 6px 0 14px rgba(255,255,255,0.035), inset -8px 0 16px rgba(0,0,0,0.28), 0 0 calc(18px * var(--rail-glow, 0)) rgba(255,187,67,0.18), 0 0 calc(42px * var(--rail-glow, 0)) rgba(255,158,35,0.12);
}
.rail-track::before {
  content: "";
  position: absolute;
  inset: clamp(3.12px, 0.22cqi, 5.2px);
  border-radius: inherit;
  border: 1px solid rgba(255,255,255,0.08);
  pointer-events: none;
  z-index: 4;
}
.rail-track::after {
  content: "";
  position: absolute;
  top: clamp(8.58px, 0.6cqi, 14.3px);
  left: clamp(7.8px, 0.55cqi, 13px);
  width: clamp(10.14px, 0.71cqi, 16.9px);
  height: 72%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.034), transparent);
  opacity: 0.42;
  pointer-events: none;
  z-index: 5;
  filter: blur(0.2px);
}
.rail-fill {
  position: absolute;
  left: clamp(3.9px, 0.27cqi, 6.5px);
  right: clamp(3.9px, 0.27cqi, 6.5px);
  bottom: clamp(3.9px, 0.27cqi, 6.5px);
  height: calc((100% - 10px) * var(--rail-fill-ratio, 0));
  min-height: calc(24px * var(--rail-glow, 0));
  border-radius: 999px;
  background: radial-gradient(circle at 40% 12%, rgba(255,255,255,0.95), transparent 20%), linear-gradient(180deg, #fff6c9 0%, #ffe18a 24%, #ffc247 58%, #ff9f1f 100%);
  box-shadow: 0 0 calc(16px * var(--rail-glow, 0)) rgba(255,226,138,0.70), 0 0 calc(34px * var(--rail-glow, 0)) rgba(255,184,61,0.44), 0 0 calc(64px * var(--rail-glow, 0)) rgba(255,145,31,0.25);
  opacity: var(--rail-glow, 0);
  transition: height 550ms cubic-bezier(.22,.9,.32,1), min-height 350ms ease, opacity 350ms ease, box-shadow 450ms ease;
}
.rail-fill::before {
  content: "";
  position: absolute;
  top: 0;
  left: clamp(4.68px, 0.33cqi, 7.8px);
  right: clamp(4.68px, 0.33cqi, 7.8px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.82);
  filter: blur(3px);
  opacity: 0.90;
}
.rail-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(255,255,255,0.25), transparent 38%, rgba(255,255,255,0.18));
  opacity: 0.70;
  mix-blend-mode: screen;
}
.rail-ambient-glow {
  position: absolute;
  left: 50%;
  bottom: clamp(15.6px, 1.1cqi, 26px);
  width: clamp(67.08px, 4.73cqi, 111.8px);
  height: var(--rail-ambient-height, 22px);
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(255,183,55,0.30), rgba(255,139,22,0.12), transparent 72%);
  filter: blur(16px);
  opacity: var(--rail-glow, 0);
  pointer-events: none;
  transition: height 550ms cubic-bezier(.22,.9,.32,1), opacity 350ms ease;
}
.rail-dimmer-ghost {
  position: absolute;
  inset: clamp(5.46px, 0.38cqi, 9.1px);
  border-radius: inherit;
  border: 1px dashed rgba(255,255,255,0.12);
  opacity: 0;
  pointer-events: none;
}
.light-tile.is-placeholder {
  opacity: 0.55;
}
.light-tile:hover, .camera-thumb-overlay:hover, .soft-button:hover, .control-button:hover {
  transform: translateY(-1px);
}
.light-tile.is-on .light-icon {
  --light-color: var(--state-icon-active-color, #f0c040);
  color: rgb(255,210,86);
  filter: drop-shadow(0 0 10px rgba(255,183,77,0.34));
}
.tpl-light-icon {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  color: var(--light-color);
}
.tpl-light-icon svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
.tpl-light-icon .light-color {
  fill: var(--light-color);
}
.tpl-light-icon .flush-beam {
  transform-origin: -100% 46%;
  animation: bruno-light-flush-on 2s ease forwards;
}
.tpl-light-icon .pendant-swing {
  transform-box: fill-box;
  transform-origin: top center;
  animation: bruno-light-pendant-on 1.7s ease-in-out;
}
.tpl-light-glow {
  position: absolute;
  inset: 3px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,214,99,0.45), transparent 68%);
  filter: blur(7px);
  opacity: 0.95;
}
@keyframes bruno-light-flush-on {
from {
  transform: scaleY(0);
}
to {
  transform: scaleY(1);
}
}
@keyframes bruno-light-pendant-on {
0% {
  transform: rotateZ(0deg);
}
23% {
  transform: rotateZ(-10deg);
}
56% {
  transform: rotateZ(10deg);
}
70% {
  transform: rotateZ(-2deg);
}
85% {
  transform: rotateZ(2deg);
}
100% {
  transform: rotateZ(0deg);
}
}
.light-tile small {
  grid-area: status;
  min-width: 0;
  color: rgba(255,205,95,0.92);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cameras-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.online-chip span, .state-chip span, .live-dot {
  width: clamp(4.68px, 0.33cqi, 7.8px);
  height: clamp(4.68px, 0.33cqi, 7.8px);
  border-radius: 50%;
  background: #2ee77a;
  box-shadow: 0 0 10px rgba(46,231,122,0.5);
}
.camera-stage {
  position: relative;
  z-index: 1;
  min-height: 0;
  height: 100%;
}
.camera-main {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.11);
  text-align: left;
}
.camera-row-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.018);
}
.camera-row-image img, .poster-card img, .spotify-art img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.camera-row-image img {
  z-index: 1;
  opacity: 0;
  filter: brightness(0.86) saturate(0.94);
}
.camera-row-image img.is-loaded {
  opacity: 1;
}
.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.18);
}
.camera-placeholder bruno-icon {
  display: none;
  --mdc-icon-size: 36px;
}
.camera-main::after, .camera-thumb-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: transparent;
}
.camera-main.has-loaded-image::after, .camera-thumb-overlay.has-loaded-image::after {
  background: linear-gradient(90deg, rgba(4,8,16,0.52), rgba(4,8,16,0.10) 68%, rgba(4,8,16,0.42));
}
.camera-row-copy, .camera-chevron {
  position: absolute;
  z-index: 2;
}
.camera-row-copy span, .camera-thumb-name {
  display: inline-flex;
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
}
.camera-chevron {
  right: clamp(10.92px, 0.77cqi, 18.2px);
  top: clamp(10.92px, 0.77cqi, 18.2px);
  --mdc-icon-size: 19px;
  color: rgba(255,255,255,0.82);
}
.camera-thumb-overlay {
  position: absolute;
  z-index: 3;
  right: clamp(9.36px, 0.66cqi, 15.6px);
  bottom: clamp(9.36px, 0.66cqi, 15.6px);
  width: min(44%, clamp(123.24px, 8.68cqi, 205.4px));
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 14px;
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 26px rgba(0,0,0,0.36);
  text-align: left;
}
.camera-thumb-overlay .camera-row-image {
  border-radius: 14px;
}
.camera-thumb-overlay::after {
  background: linear-gradient(180deg, rgba(3,8,15,0.06), rgba(3,8,15,0.74));
}
.camera-thumb-overlay span {
  position: absolute;
  z-index: 4;
  left: clamp(7.8px, 0.55cqi, 13px);
  bottom: clamp(5.46px, 0.38cqi, 9.1px);
  max-width: calc(100% - clamp(15.6px, 1.1cqi, 26px));
  color: rgba(255,255,255,0.92);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tv-card, .ps5-card, .spotify-card, .ac-card {
  min-height: 0;
}
.tv-body, .ac-body {
  position: relative;
  z-index: 1;
  height: calc(100% - clamp(35.88px, 2.53cqi, 59.8px));
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(10.92px, 0.77cqi, 18.2px);
  align-items: stretch;
}
.tv-main, .spotify-copy, .ac-main, .ps5-copy {
  min-width: 0;
}
.media-title {
  margin-top: clamp(6.24px, 0.44cqi, 10.4px);
  color: white;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  line-height: 1.1;
  font-weight: 800;
}
.media-subtitle {
  margin-top: clamp(3.9px, 0.27cqi, 6.5px);
  color: var(--text-soft);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 600;
}
.control-row {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  margin-top: 0;
}
.control-button.is-main {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%), linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58)) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.22), 0 0 22px rgba(96,165,250,0.24) );
}
.control-button.is-tool {
  color: rgba(210,245,230,0.96);
  background: var(--bruno-liquid-control-green-background, radial-gradient(circle at 50% 16%, rgba(46,231,122,0.22), transparent 72%), rgba(255,255,255,0.075) );
  border-color: var(--bruno-liquid-control-green-border, rgba(46,231,122,0.22));
  box-shadow: var(--bruno-liquid-control-green-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
}
.volume-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) clamp(29.64px, 2.09cqi, 49.4px);
  align-items: center;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  margin-top: 0;
  color: rgba(255,255,255,0.66);
}
.volume-row bruno-icon {
  --mdc-icon-size: 15px;
}
.volume-row strong {
  color: rgba(255,255,255,0.88);
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 800;
}
.volume-row input {
  width: 100%;
  min-width: 0;
  accent-color: rgb(28,214,104);
}
.poster-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text-dim);
  overflow: hidden;
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
}
.tv-card .poster-card, .spotify-art {
  aspect-ratio: 1 / 1;
  height: var(--media-screen-height, 150px);
  min-height: var(--media-screen-height, 150px);
  max-height: var(--media-screen-height, 150px);
  width: auto;
  max-width: 100%;
  justify-self: center;
}
.tv-card .tv-body {
  grid-template-rows: var(--media-screen-height, 154px) auto;
}
.tv-card .poster-card {
  grid-row: 1;
  min-height: 0;
}
.tv-card .tv-main {
  grid-row: 2;
}
.tv-card .control-row {
}
.ps5-body {
  position: relative;
  z-index: 1;
  height: calc(100% - clamp(35.88px, 2.53cqi, 59.8px));
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(clamp(90.48px, 6.37cqi, 150.8px), 1fr) auto;
  gap: clamp(7.8px, 0.55cqi, 13px);
  align-items: stretch;
}
.ps5-minimal {
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ps5-copy {
  grid-row: 2;
  display: grid;
  align-content: end;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  height: 100%;
}
.ps5-copy > strong {
  align-self: end;
  color: rgb(45,225,118);
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 800;
}
.ps5-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ps5-image {
  grid-row: 1;
  justify-self: center;
  align-self: center;
  width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform: scale(1.08);
  filter: drop-shadow(0 18px 28px rgba(0,0,0,0.42));
}
.ps5-footer {
  min-height: 0;
  display: grid;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
}
.device-state {
  display: inline-flex;
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  width: fit-content;
  color: rgba(255,255,255,0.82);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
}
.ps5-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(31.2px, 2.2cqi, 52px);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ps5-meta span, .ac-meta span {
  display: grid;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  min-width: 0;
  padding: clamp(7.8px, 0.55cqi, 13px) clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 12px;
  color: var(--text-soft);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  background: rgba(255,255,255,0.052);
  border: 1px solid rgba(255,255,255,0.10);
}
.ps5-meta strong, .ac-meta strong {
  color: white;
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spotify-card {
  grid-area: spotify;
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  min-height: 0;
}
.spotify-body {
  position: relative;
  z-index: 1;
  display: grid;
}
.spotify-art {
  position: relative;
  inset: auto;
  aspect-ratio: 1 / 1;
  height: var(--media-screen-height, 168px);
  min-height: var(--media-screen-height, 168px);
  max-height: var(--media-screen-height, 168px);
  width: auto;
  max-width: 100%;
  justify-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--room-radius-small);
  background: radial-gradient(circle at 50% 45%, rgba(96,165,250,0.14), transparent 42%), rgba(5,10,20,0.72);
  overflow: hidden;
  color: rgba(255,255,255,0.22);
}
.spotify-art.has-art::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 64%, rgba(2,8,18,0.46));
}
.spotify-art bruno-icon {
  --mdc-icon-size: 70px;
}
.spotify-copy {
}
.spotify-card .media-title {
  margin-top: 0;
}
.spotify-controls {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.tv-card .control-button, .spotify-controls .control-button {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  border-radius: 13px;
}
.temperature-pill {
  align-self: start;
  min-width: clamp(45.24px, 3.19cqi, 75.4px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: clamp(5.46px, 0.38cqi, 9.1px) clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  color: rgba(255,255,255,0.92);
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  line-height: 1;
  font-weight: 800;
  background: rgba(255,255,255,0.070);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
}
.temperature-slider input {
  width: 100%;
  min-width: 0;
  accent-color: rgb(96,165,250);
}
.climate-mode-row, .fan-mode-row {
  display: grid;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.climate-mode, .fan-mode, .climate-stepper {
  min-height: clamp(29.64px, 2.09cqi, 49.4px);
  border-radius: var(--bruno-liquid-control-radius, 14px);
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.09));
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.050));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.06));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.climate-mode:disabled, .fan-mode:disabled {
  opacity: 0.42;
  cursor: default;
}
.climate-mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.66);
}
.climate-mode bruno-icon {
  --mdc-icon-size: 17px;
}
.climate-mode.is-active {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,183,255,0.34), transparent 72%), rgba(38,92,154,0.42) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.34));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.14), 0 0 14px rgba(96,165,250,0.16) );
}
.climate-mode.is-power-on {
  color: rgba(255,255,255,0.96);
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,165,250,0.34), transparent 72%), rgba(38,92,138,0.38) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,165,250,0.32));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.12), 0 0 14px rgba(96,165,250,0.16) );
}
.climate-stepper button {
  height: clamp(29.64px, 2.09cqi, 49.4px);
  background: transparent;
  color: rgba(255,255,255,0.82);
  font-size: clamp(13.26px, 0.93cqi, 22.1px);
}
.climate-stepper span {
  text-align: center;
  color: rgba(255,255,255,0.88);
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 800;
}
.fan-label {
  display: block;
  color: rgba(255,255,255,0.90);
  font-weight: 800;
  margin-top: 3px;
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
}
.fan-mode.is-active {
  color: rgba(255,255,255,0.94);
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,183,255,0.24), transparent 72%), rgba(38,92,154,0.32) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.28));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.14));
}
.climate-mode:active, .fan-mode:active, .climate-stepper button:active {
  transform: translateY(1px);
  border-color: rgba(96,183,255,0.42);
}
.climate-trend {
  min-height: 0;
  height: clamp(81.12px, 5.71cqi, 135.2px);
  margin: clamp(-10.4px, -0.44cqi, -6.24px) clamp(-18.2px, -0.77cqi, -10.92px) clamp(-18.2px, -0.77cqi, -10.92px);
  border-radius: 0 0 calc(var(--room-radius) - 1px) calc(var(--room-radius) - 1px);
  overflow: hidden;
  background: transparent;
}
.climate-trend svg {
  display: block;
  width: 100%;
  height: 100%;
}
.trend-area {
  fill: rgba(96,165,250,0.16);
}
.trend-line {
  fill: none;
  stroke: rgba(96,165,250,0.76);
  stroke-width: 2.35;
  stroke-linecap: round;
  filter: drop-shadow(0 0 8px rgba(96,165,250,0.32));
}
.spotify-volume {
}
.tv-card, .spotify-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  overflow: hidden;
}
.tv-body, .spotify-body {
  height: auto;
  min-height: 0;
  grid-template-columns: 1fr;
  grid-template-rows: var(--media-screen-height, 154px) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  align-items: stretch;
}
.tv-main, .spotify-copy {
  display: grid;
  grid-template-rows: clamp(28.08px, 1.98cqi, 46.8px) clamp(18.72px, 1.32cqi, 31.2px);
  align-content: start;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding-top: clamp(9.36px, 0.66cqi, 15.6px);
  min-width: 0;
  overflow: hidden;
}
.tv-card .control-row, .spotify-controls {
  margin-top: 2px;
}
.tv-card .volume-row, .spotify-volume {
  margin-top: 2px;
}
.media-source {
  margin-top: 2px;
  color: white;
  font-weight: 800;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
}
.spotify-card .media-title, .spotify-title {
  max-width: 100%;
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  white-space: nowrap;
  overflow: hidden;
}
.spotify-title span {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}
.spotify-card .media-subtitle {
  margin-top: -2px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.state-chip {
  align-self: start;
  min-height: clamp(21.84px, 1.54cqi, 36.4px);
  max-width: clamp(59.28px, 4.18cqi, 98.8px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 1180px) {
.side-panel {
  grid-template-rows: auto minmax(0, 1fr);
}
.status-item {
  padding: 0 clamp(7.8px, 0.55cqi, 13px);
}
}
@media (max-width: 760px) {
:host {
  height: auto;
  overflow: visible;
}
.hero-stage {
  min-height: clamp(335.4px, 23.63cqi, 559px);
}
.hero-content {
  grid-template-columns: 1fr;
}
.hero-clock {
  font-size: clamp(54.6px, 3.85cqi, 91px);
}
.status-item:nth-child(even) {
  border-right: 0;
}
.curtain-dock {
  grid-template-columns: 1fr;
}
.side-panel {
  grid-template-rows: auto;
}
.lights-groups {
  height: auto;
  grid-template-columns: 1fr;
}
.lights-divider {
  display: none;
}
.light-group-grid {
  grid-template-rows: none;
  grid-auto-rows: minmax(clamp(73.32px, 5.16cqi, 122.2px), auto);
}
.cameras-card {
  min-height: clamp(304.2px, 21.43cqi, 507px);
}
.tv-card, .ps5-card, .spotify-card, .ac-card {
  min-height: clamp(202.8px, 14.29cqi, 338px);
}
.spotify-card {
  min-height: clamp(280.8px, 19.78cqi, 468px);
}
.tv-body, .ac-body {
  grid-template-columns: 1fr;
}
}
.content-left, .right-column {
  min-width: 0;
  min-height: 0;
  height: 100%;
}
.content-left {
  grid-area: content;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr) var(--ac-h, 320px);
  gap: var(--room-gap);
}
.cams-media-row {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--room-gap);
}
.right-control-grid {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(clamp(227.76px, 16.04cqi, 379.6px), 0.55fr);
  grid-template-rows: minmax(clamp(205.92px, 14.51cqi, 343.2px), 1fr) minmax(clamp(227.76px, 16.04cqi, 379.6px), 1fr);
  grid-template-areas: "lights ac" "media ac";
  gap: var(--room-gap);
}
.hero-panel, .cameras-card, .lights-card, .media-hub-card, .ac-card {
  min-width: 0;
  min-height: 0;
}
.hero-panel, .cameras-card, .lights-card, .media-hub-card, .ac-card, .curtain-card {
  grid-area: auto;
}
.subview-topband {
  grid-area: topband;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.topband-badges {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0;
  overflow: hidden;
}
.tb-badge {
  --tone: 154,160,166;
  height: clamp(35.88px, 2.53cqi, 59.8px);
  display: grid;
  grid-template-columns: clamp(17.16px, 1.21cqi, 28.6px) auto;
  align-items: center;
  column-gap: clamp(7.02px, 0.49cqi, 11.7px);
  padding: 0 clamp(12.48px, 0.88cqi, 20.8px);
  color: rgba(255,255,255,0.92);
}
.tb-badge + .tb-badge {
  border-left: 1px solid rgba(255,255,255,0.10);
}
.tb-badge-icon {
  width: clamp(17.16px, 1.21cqi, 28.6px);
  height: clamp(17.16px, 1.21cqi, 28.6px);
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.44);
}
.tb-badge-icon bruno-icon {
  --mdc-icon-size: 18px;
}
.tb-badge-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1.02;
}
.tb-badge-title {
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 600;
  color: rgba(255,255,255,0.60);
}
.tb-badge-sub {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  font-weight: 600;
  color: rgba(255,255,255,0.42);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: clamp(132.6px, 9.34cqi, 221px);
}
.tb-badge.is-active .tb-badge-icon {
  color: rgb(var(--tone));
  filter: drop-shadow(0 0 8px rgba(var(--tone),0.45));
}
.tb-badge.is-active .tb-badge-title {
  color: rgba(255,255,255,0.94);
}
.tb-badge.is-active .tb-badge-sub {
  color: rgb(var(--tone));
}
.topband-clock {
  text-align: right;
  line-height: 1.05;
  white-space: nowrap;
}
.topband-clock span[data-clock] {
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
  color: rgba(248,251,255,0.96);
}
.topband-clock small {
  display: block;
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-soft);
}
.hero-atmosphere {
  height: 100%;
}
.hero-atmosphere .hero-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0;
}
.curtain-overlay {
  align-self: stretch;
  width: 100% !important;
  max-width: 100% !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  padding: 0;
}
.subview-footer {
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  grid-area: bottomband;
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  background: transparent;
}
.subview-footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: clamp(6.24px, 0.44cqi, 10.4px);
  right: clamp(6.24px, 0.44cqi, 10.4px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent);
}
.subview-presence {
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 600;
  color: rgba(255,255,255,0.52);
}
.subview-presence bruno-icon {
  flex: 0 0 auto;
  --mdc-icon-size: 16px;
  color: rgba(255,255,255,0.42);
}
.lights-head {
  flex: 0 0 auto;
}
.lights-zones::-webkit-scrollbar {
  width: 0;
}
.light-zone {
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
}
.light-zone.is-expanded {
  background: rgba(255,255,255,0.055);
}
.zone-header {
  display: grid;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr) auto auto;
  align-items: center;
  gap: clamp(8.58px, 0.6cqi, 14.3px);
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(10.92px, 0.77cqi, 18.2px);
  cursor: pointer;
}
.zone-icon {
  width: clamp(26.52px, 1.87cqi, 44.2px);
  height: clamp(26.52px, 1.87cqi, 44.2px);
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(255,196,90,0.30);
  background: rgba(255,196,90,0.08);
  color: rgba(255,196,90,0.92);
}
.zone-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
}
.zone-id {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.zone-id strong {
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 700;
  color: var(--text-main);
}
.zone-id small {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 600;
  color: var(--text-soft);
}
.zone-off {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 700;
  color: rgba(255,196,90,0.92);
  white-space: nowrap;
  cursor: pointer;
}
.zone-chevron {
  --mdc-icon-size: 20px;
  color: var(--text-soft);
}
.zone-preview {
  padding: 0 clamp(10.92px, 0.77cqi, 18.2px) clamp(9.36px, 0.66cqi, 15.6px);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 600;
  color: var(--text-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zl-tile {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: "icon sw" ". ." "name name";
  align-items: center;
  text-align: left;
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 16px;
  color: var(--text-main);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.zl-tile:hover {
  background: rgba(255,255,255,0.06);
}
.zl-tile.is-on {
  background: rgba(255,183,77,0.10);
  border-color: rgba(255,205,95,0.42);
}
.zl-tile.is-wide {
  grid-column: 1 / -1;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto;
  grid-template-areas: "icon name sw";
  align-items: center;
  align-content: center;
  column-gap: clamp(7.8px, 0.55cqi, 13px);
}
.zl-tile.is-wide .zl-icon {
  width: clamp(21.84px, 1.54cqi, 36.4px);
}
.zl-icon {
  grid-area: icon;
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  display: grid;
  place-items: center start;
  --light-color: #9da0a2;
  color: var(--light-color);
}
.zl-tile.is-on .zl-icon {
  --light-color: #f0c040;
  color: var(--light-color);
  filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
}
.zl-icon .tpl-light-icon {
  width: clamp(21.06px, 1.48cqi, 35.1px);
  height: clamp(21.06px, 1.48cqi, 35.1px);
}
.zl-icon svg {
  width: 100%;
  height: 100%;
}
.zl-icon .tpl-light-icon svg g, .zl-icon .tpl-light-icon svg path {
  stroke-width: 1.09;
}
.zl-icon .tpl-light-icon.icon-ledstrip svg path {
  stroke-width: 1.45;
}
.zl-name {
  grid-area: name;
  min-width: 0;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zl-switch {
  grid-area: sw;
  position: relative;
  width: clamp(29.64px, 2.09cqi, 49.4px);
  height: clamp(17.16px, 1.21cqi, 28.6px);
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.14);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.zl-tile.is-on .zl-switch {
  background: linear-gradient(90deg, rgba(255,176,54,0.95), rgba(255,206,120,0.95));
  border-color: rgba(255,196,90,0.55);
}
.zl-knob {
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%);
  width: clamp(12.48px, 0.88cqi, 20.8px);
  height: clamp(12.48px, 0.88cqi, 20.8px);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  transition: left 0.2s ease;
}
.zl-tile.is-on .zl-knob {
  left: calc(100% - clamp(14.04px, 0.99cqi, 23.4px));
}
.light-row:hover {
  background: rgba(255,255,255,0.04);
}
.light-row.is-on .light-row-icon {
  --light-color: #f0c040;
  color: var(--light-color);
  filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
}
.light-row-icon .tpl-light-icon {
  width: var(--bruno-liquid-icon-control, 23px);
  height: var(--bruno-liquid-icon-control, 23px);
}
.light-row-icon svg {
  width: 100%;
  height: 100%;
}
.light-row.is-on .light-bar {
  background: linear-gradient(90deg, rgba(255,176,54,0.96), rgba(255,206,120,0.96));
  border-color: rgba(255,196,90,0.55);
  box-shadow: 0 0 12px rgba(255,176,54,0.55), 0 0 4px rgba(255,176,54,0.6), inset 0 1px 0 rgba(255,255,255,0.45);
}
.ac-card.ac-card-lean {
  display: grid;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr) clamp(49.92px, 3.52cqi, 83.2px);
  gap: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
.ac-lean-head {
  position: relative;
  z-index: 3;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(7.8px, 0.55cqi, 13px) 0 clamp(10.92px, 0.77cqi, 18.2px);
}
.ac-head-title {
  display: inline-flex;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-width: 0;
}
.ac-top-stack {
  position: absolute;
  top: clamp(3.9px, 0.27cqi, 6.5px);
  right: clamp(7.8px, 0.55cqi, 13px);
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(11.7px, 0.82cqi, 19.5px);
}
.ac-more-button {
  flex: 0 0 auto;
}
.ac-power-floating {
  width: clamp(35.88px, 2.53cqi, 59.8px);
  height: clamp(35.88px, 2.53cqi, 59.8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.66);
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}
.ac-power-floating bruno-icon {
  --mdc-icon-size: 34px;
}
.ac-power-floating:hover, .ac-power-floating:focus-visible {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.045);
}
.ac-power-floating.is-active {
  color: rgba(150,205,255,0.98);
  background: rgba(96,165,250,0.075);
  box-shadow: 0 0 18px rgba(44,175,255,0.22);
}
.ac-power-floating:active {
  transform: translateY(1px);
}
.ac-power-floating:disabled {
  opacity: 0.42;
  cursor: default;
}
.ac-lean-mid {
  position: relative;
  z-index: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) 2px;
}
.ac-ring {
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}
.ac-ring .icg-shell {
  width: min(94%, clamp(260.52px, 18.35cqi, 434.2px));
  /* ANTERIOR (rollback): translateY(3px) scale(1.06) deslocava a caixa toda,
     inclusive margens e controles vizinhos. O diâmetro cresce no SVG. */
  transform: translateY(3px);
}
.ac-lean-foot {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
  align-items: end;
}
.ac-control-wrap {
  position: relative;
  min-width: 0;
}
.ac-action {
  width: 100%;
  min-width: 0;
  min-height: clamp(39px, 2.75cqi, 65px);
  display: grid;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  padding: clamp(5.46px, 0.38cqi, 9.1px) clamp(7.8px, 0.55cqi, 13px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
.ac-action:hover, .ac-action.is-open {
  background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
}
.ac-action:disabled {
  opacity: 0.42;
  cursor: default;
}
.ac-action-icon {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(26.52px, 1.87cqi, 44.2px);
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.82);
  flex: 0 0 auto;
}
.ac-action:hover .ac-action-icon, .ac-action.is-open .ac-action-icon {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
}
.ac-action-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-control, 23px);
}
.ac-action-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ac-action-text small {
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 650;
  color: rgba(255,255,255,0.58);
}
.ac-action-text strong {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.94);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ac-popover {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + clamp(6.24px, 0.44cqi, 10.4px));
  z-index: 12;
  display: grid;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding: clamp(4.68px, 0.33cqi, 7.8px);
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: var(--bruno-liquid-popup-background, linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660)) );
  border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
  box-shadow: var(--bruno-liquid-popup-shadow, inset 0 1px 0 rgba(255,255,255,0.100), 0 18px 36px rgba(0,0,0,0.300) );
  backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
  -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
}
.ac-popover-option {
  min-width: 0;
  min-height: clamp(24.96px, 1.76cqi, 41.6px);
  display: grid;
  grid-template-columns: clamp(14.04px, 0.99cqi, 23.4px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: 9px;
  border: 0;
  background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
  color: rgba(255,255,255,0.82);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 750;
  text-align: left;
  cursor: pointer;
}
.ac-popover-option bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
  color: rgba(255,255,255,0.72);
}
.ac-popover-option span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-popover-option:hover, .ac-popover-option.is-active {
  color: rgba(255,255,255,0.98);
  background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
}
.ac-popover-option:hover bruno-icon, .ac-popover-option.is-active bruno-icon {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
}
.ac-popover-option:disabled {
  opacity: 0.48;
  cursor: default;
}
.room-sidebar {
  grid-area: frame-left;
  position: relative;
  z-index: 3;
  isolation: isolate;
  align-self: center;
  justify-self: center;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  overflow: visible;
  width: clamp(45.24px, 3.19cqi, 75.4px);
  height: auto;
  max-height: calc(100% - clamp(4.68px, 0.33cqi, 7.8px));
  grid-auto-rows: clamp(31.2px, 2.2cqi, 52px);
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(6.24px, 0.44cqi, 10.4px);
}
.room-nav-button {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) 2px clamp(5.46px, 0.38cqi, 9.1px);
  border-radius: 13px;
  color: rgba(255,255,255,0.60);
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  transition: background 160ms ease, color 160ms ease;
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  min-width: clamp(31.2px, 2.2cqi, 52px);
  min-height: clamp(31.2px, 2.2cqi, 52px);
  max-width: clamp(31.2px, 2.2cqi, 52px);
  max-height: clamp(31.2px, 2.2cqi, 52px);
}
.hero-stage {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--text-main);
  border-radius: 0;
  overflow: visible;
}
.hero-content {
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto minmax(0, 1fr) auto;
  padding: clamp(11.7px, 0.82cqi, 19.5px) clamp(14.04px, 0.99cqi, 23.4px) clamp(10.92px, 0.77cqi, 18.2px);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.hero-headline {
  grid-column: 1;
  grid-row: 2;
  align-self: start;
  justify-self: start;
  margin-top: clamp(9.36px, 0.66cqi, 15.6px);
}
.hero-date-line {
  margin: 0 0 clamp(8.58px, 0.6cqi, 14.3px);
  color: rgba(255,255,255,0.54);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: clamp(4.68px, 0.33cqi, 7.8px);
}
.hero-clock {
  line-height: 0.96;
  font-weight: 220;
  font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 10px 32px rgba(0,0,0,0.28);
  margin-top: clamp(6.24px, 0.44cqi, 10.4px);
  font-size: clamp(clamp(42.12px, 2.97cqi, 70.2px), 7.1vh, clamp(57.72px, 4.07cqi, 96.2px));
}
.scene-pill {
  width: fit-content;
  max-width: min(clamp(195px, 13.74cqi, 325px), 100%);
  min-height: clamp(23.4px, 1.65cqi, 39px);
  margin-top: clamp(9.36px, 0.66cqi, 15.6px);
  display: inline-flex;
  align-items: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  color: rgba(255,255,255,0.88);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 24px rgba(0,0,0,0.20);
}
.scene-pill bruno-icon {
  --mdc-icon-size: 15px;
  color: rgb(255,205,95);
}
.curtain-dock {
  --curtain-gold-rgb: var(--bruno-liquid-warm-accent, 242,194,102);
  --curtain-gold: rgb(var(--curtain-gold-rgb));
  grid-row: 3;
  grid-column: 1 / -1;
  align-self: end;
  display: grid;
  grid-template-columns: 1fr;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  width: min(clamp(405.6px, 28.57cqi, 676px), 100%);
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.curtain-action-button {
  width: clamp(59.28px, 4.18cqi, 98.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(3.9px, 0.27cqi, 6.5px);
  padding: 0 clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.15));
  background: var(--bruno-liquid-control-background, linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018)), rgba(255,255,255,0.030) );
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  color: rgba(255,255,255,0.88);
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
  min-width: clamp(60.84px, 4.29cqi, 101.4px);
}
.status-rail {
  display: grid;
  gap: 0;
  padding: 0;
  min-height: clamp(49.92px, 3.52cqi, 83.2px);
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.status-item {
  display: grid;
  align-items: center;
  min-width: 0;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  border-right: 1px solid rgba(255,255,255,0.08);
  grid-template-columns: auto minmax(0, 1fr);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
}
.status-chevron {
  --mdc-icon-size: 17px;
  color: rgba(255,255,255,0.58);
  display: none;
}
.lights-card .module-head {
  margin-bottom: 0;
  align-items: start;
  min-height: clamp(31.2px, 2.2cqi, 52px);
}
.lights-title-row {
  display: flex;
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  min-width: 0;
}
.zone-toggle, .media-tabs {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px;
  background: rgba(255,255,255,0.065);
  border: 1px solid rgba(255,255,255,0.11);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}
.zone-toggle button {
  min-height: clamp(23.4px, 1.65cqi, 39px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  color: rgba(255,255,255,0.62);
  background: transparent;
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 900;
}
.head-actions .chip-button {
  min-height: clamp(26.52px, 1.87cqi, 44.2px);
  padding: 0 clamp(10.92px, 0.77cqi, 18.2px);
}
.chip-button-icon {
  display: inline-flex;
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
}
.chip-button-icon bruno-icon {
  --mdc-icon-size: 15px;
}
.zone-toggle button.is-active {
  color: rgba(255,255,255,0.96);
  background: rgba(255,255,255,0.12);
}
.lights-single-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(10.92px, 0.77cqi, 18.2px) clamp(7.8px, 0.55cqi, 13px);
}
.lights-zone-rail {
  position: relative;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  justify-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: clamp(7.02px, 0.49cqi, 11.7px) clamp(5.46px, 0.38cqi, 9.1px);
  overflow: hidden;
  border-radius: var(--room-cell-radius);
  color: rgba(255,255,255,0.74);
  background: linear-gradient(145deg, rgba(255,255,255,0.072), rgba(255,255,255,0.026)), rgba(8,14,26,0.50);
  border: 1px solid rgba(255,224,160,0.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(255,200,100,0.045), 0 12px 26px rgba(0,0,0,0.20);
  backdrop-filter: blur(22px) saturate(1.34);
  -webkit-backdrop-filter: blur(22px) saturate(1.34);
  display: grid;
}
.lights-groups, .lights-divider, .light-group-label {
  display: none;
}
.light-tile {
  position: relative;
  display: grid;
  grid-template-rows: auto auto;
  grid-template-areas: "icon title" "icon status";
  align-items: center;
  align-content: center;
  text-align: left;
  border-radius: var(--room-cell-radius);
  color: rgba(255,255,255,0.86);
  background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.055));
  border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.11));
  box-shadow: var(--bruno-liquid-cell-shadow, inset 0 1px 0 rgba(255,255,255,0.08));
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  min-height: 0;
  grid-template-columns: clamp(46.8px, 3.3cqi, 78px) minmax(0, 1fr);
  column-gap: clamp(8.58px, 0.6cqi, 14.3px);
  padding: clamp(8.58px, 0.6cqi, 14.3px) clamp(9.36px, 0.66cqi, 15.6px);
}
.light-icon {
  grid-area: icon;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  --light-color: var(--state-icon-color, #9da0a2);
  color: rgba(255,255,255,0.74);
  width: clamp(46.8px, 3.3cqi, 78px);
  height: clamp(46.8px, 3.3cqi, 78px);
}
.light-tile strong {
  grid-area: title;
  min-width: 0;
  align-self: end;
  line-height: 1.12;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(11.54px, 0.81cqi, 19.24px);
}
.cameras-card.cameras-card-controls {
  padding: 0;
  display: grid;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
}
.cameras-head {
  flex: 0 0 auto;
}
.camera-settings-button.is-active {
  color: rgba(255,255,255,0.86);
  background: rgba(255,255,255,0.055);
}
.camera-pip-stage {
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  min-height: 0;
  height: 100%;
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
}
.camera-feed {
  height: 100%;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}
.camera-primary-feed {
  width: 100%;
}
.camera-pip-feed {
  position: absolute;
  z-index: 5;
  right: clamp(15.6px, 1.1cqi, 26px);
  bottom: clamp(17.16px, 1.21cqi, 28.6px);
  width: min(36%, clamp(117px, 8.24cqi, 195px));
  height: clamp(67.08px, 4.73cqi, 111.8px);
  border-radius: 13px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.10);
}
.camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: clamp(59.28px, 4.18cqi, 98.8px);
}
.camera-pip-feed .camera-row-copy {
  left: clamp(7.02px, 0.49cqi, 11.7px);
  right: clamp(7.02px, 0.49cqi, 11.7px);
  bottom: clamp(6.24px, 0.44cqi, 10.4px);
  gap: 0;
}
.camera-pip-feed .camera-row-copy strong {
  max-width: 100%;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.camera-pip-feed .camera-row-copy span {
  display: none;
}
.camera-pip-feed::after {
  background: linear-gradient(180deg, rgba(4,8,16,0.04), rgba(4,8,16,0.52));
}
.camera-state-surface {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  align-content: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: clamp(12.48px, 0.88cqi, 20.8px);
  color: rgba(255,255,255,0.78);
  text-align: center;
  background: radial-gradient(circle at 50% 42%, rgba(96,165,250,0.12), transparent 58%), rgba(5,8,14,0.76);
  backdrop-filter: blur(8px) saturate(0.9);
  -webkit-backdrop-filter: blur(8px) saturate(0.9);
}
.camera-state-surface bruno-icon {
  display: none;
  --mdc-icon-size: 32px;
  color: rgba(255,255,255,0.64);
}
.camera-state-surface span {
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 760;
  line-height: 1.1;
}
.camera-pip-feed .camera-state-surface {
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding: clamp(6.24px, 0.44cqi, 10.4px);
}
.camera-pip-feed .camera-state-surface bruno-icon {
  --mdc-icon-size: 22px;
}
.camera-pip-feed .camera-state-surface span {
  font-size: clamp(7.02px, 0.49cqi, 11.7px);
}
.camera-feed.is-private .camera-row-image img, .camera-feed.is-unavailable .camera-row-image img {
  opacity: 0;
}
.live-dot.is-muted {
  background: rgba(255,255,255,0.34);
  box-shadow: none;
}
.camera-control-strip {
  position: absolute;
  left: clamp(7.8px, 0.55cqi, 13px);
  right: clamp(7.8px, 0.55cqi, 13px);
  bottom: clamp(7.8px, 0.55cqi, 13px);
  z-index: 7;
  min-height: clamp(45.24px, 3.19cqi, 75.4px);
  display: grid;
  align-items: stretch;
  padding: clamp(3.12px, 0.22cqi, 5.2px) 0;
  border: 0;
  border-radius: 0;
  background: linear-gradient(180deg, rgba(3,7,13,0.08), rgba(3,7,13,0.40)), rgba(6,8,12,0.18);
  backdrop-filter: blur(10px) saturate(0.95);
  -webkit-backdrop-filter: blur(10px) saturate(0.95);
}
.camera-controls {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
}
.camera-control {
  position: relative;
  min-width: 0;
  min-height: clamp(39px, 2.75cqi, 65px);
  display: grid;
  grid-template-columns: clamp(14.04px, 0.99cqi, 23.4px) auto clamp(21.84px, 1.54cqi, 36.4px);
  align-items: center;
  justify-content: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(255,255,255,0.62);
  cursor: pointer;
  text-align: left;
  transition: color 160ms ease, background 160ms ease, opacity 160ms ease;
}
.camera-control + .camera-control::before {
  content: "";
  position: absolute;
  left: 0;
  top: clamp(8.58px, 0.6cqi, 14.3px);
  bottom: clamp(8.58px, 0.6cqi, 14.3px);
  width: 1px;
  background: rgba(255,255,255,0.105);
}
.camera-control:hover, .camera-control:focus-visible {
  color: rgba(255,255,255,0.90);
  background: rgba(255,255,255,0.036);
  outline: none;
}
.camera-control:focus-visible {
  box-shadow: inset 0 0 0 1px rgba(138,196,255,0.42);
}
.camera-control bruno-icon {
  --mdc-icon-size: 17px;
}
.camera-control-label {
  min-width: 0;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 760;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.camera-control-switch {
  position: relative;
  justify-self: start;
  width: clamp(20.28px, 1.43cqi, 33.8px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.30);
  transition: background 160ms ease, box-shadow 160ms ease;
}
.camera-control-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: clamp(6.24px, 0.44cqi, 10.4px);
  height: clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: 50%;
  background: rgba(255,255,255,0.74);
  box-shadow: 0 1px 3px rgba(0,0,0,0.30);
  transition: transform 160ms ease, background 160ms ease;
}
.camera-control.is-on {
  color: rgba(218,248,230,0.94);
}
.camera-control.is-on .camera-control-switch {
  background: rgba(46,231,122,0.58);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.18), 0 0 8px rgba(46,231,122,0.18);
}
.camera-control.is-on .camera-control-switch::after {
  transform: translateX(12px);
  background: rgba(255,255,255,0.96);
}
.camera-control.is-unavailable, .camera-control:disabled {
  opacity: 0.34;
  cursor: not-allowed;
}
.camera-row-copy {
  display: grid;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  left: clamp(10.92px, 0.77cqi, 18.2px);
  right: clamp(10.92px, 0.77cqi, 18.2px);
  bottom: clamp(10.92px, 0.77cqi, 18.2px);
  transition: bottom 220ms ease;
}
.camera-pip-stage.is-controls-open .camera-primary-feed .camera-row-copy {
  bottom: clamp(59.28px, 4.18cqi, 98.8px);
}
.camera-row-copy strong {
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  line-height: 1.08;
}
.media-hub-card {
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.media-hub-head {
  align-items: start;
  min-height: clamp(29.64px, 2.09cqi, 49.4px);
  margin-bottom: 0;
}
.media-tabs {
  gap: 2px;
  max-width: 62%;
}
.media-tabs button {
  min-width: 0;
  min-height: clamp(23.4px, 1.65cqi, 39px);
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: clamp(3.9px, 0.27cqi, 6.5px);
  padding: 3px clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: 999px;
  color: rgba(255,255,255,0.58);
  background: transparent;
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 900;
}
.media-tabs button.is-selected {
  color: rgba(255,255,255,0.96);
  background: rgba(255,255,255,0.12);
}
.media-tabs small {
  grid-column: 2;
  max-width: clamp(51.48px, 3.63cqi, 85.8px);
  color: rgba(255,255,255,0.46);
  font-size: clamp(6.24px, 0.44cqi, 10.4px);
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.source-dot {
  grid-row: 1 / 3;
  width: clamp(4.68px, 0.33cqi, 7.8px);
  height: clamp(4.68px, 0.33cqi, 7.8px);
  border-radius: 50%;
  background: rgba(255,255,255,0.24);
}
.media-tabs button.is-source-active .source-dot {
  background: #2ee77a;
  box-shadow: 0 0 10px rgba(46,231,122,0.52);
}
.media-hub-body {
  min-height: 0;
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(clamp(145.08px, 10.22cqi, 241.8px), 0.86fr) minmax(0, 1fr);
  grid-template-rows: minmax(clamp(160.68px, 11.32cqi, 267.8px), 1fr);
  grid-template-areas: "visual content";
  align-items: stretch;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.media-visual {
  grid-area: visual;
  position: relative;
  min-height: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--room-radius-small);
  color: rgba(255,255,255,0.22);
  background: radial-gradient(circle at 52% 34%, rgba(96,165,250,0.15), transparent 54%), rgba(5,10,20,0.74);
  border: 1px solid rgba(255,255,255,0.10);
}
.media-visual img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.media-standby-image {
  position: static !important;
  inset: auto !important;
  width: 92% !important;
  height: 92% !important;
  object-fit: contain !important;
  opacity: 0.96;
  filter: drop-shadow(0 18px 28px rgba(0,0,0,0.42));
}
.media-tv-standby {
  width: 96% !important;
  height: 86% !important;
}
.media-spotify-standby {
  width: 72% !important;
  height: 78% !important;
}
.media-visual bruno-icon {
  --mdc-icon-size: 64px;
}
.media-hub-content {
  grid-area: content;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: clamp(31.2px, 2.2cqi, 52px) minmax(clamp(95.16px, 6.7cqi, 158.6px), 1fr) auto;
  align-content: stretch;
  gap: clamp(8.58px, 0.6cqi, 14.3px);
}
.media-ps5-image {
  position: static !important;
  width: 108% !important;
  height: 100% !important;
  object-fit: contain !important;
  filter: drop-shadow(0 18px 26px rgba(0,0,0,0.42));
}
.media-details {
  grid-area: auto;
  min-width: 0;
  min-height: clamp(31.2px, 2.2cqi, 52px);
  display: grid;
  grid-template-rows: clamp(15.6px, 1.1cqi, 26px) clamp(12.48px, 0.88cqi, 20.8px);
  align-content: start;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding-top: 1px;
}
.media-details strong {
  min-width: 0;
  color: white;
  font-size: clamp(13.26px, 0.93cqi, 22.1px);
  line-height: 1.08;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-details small, .media-details em {
  min-width: 0;
  color: var(--text-soft);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  line-height: 1.25;
  font-style: normal;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-details em {
  color: rgba(255,255,255,0.48);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
}
.media-action-stack {
  grid-area: auto;
  --media-action-size: 55px;
  display: grid;
  align-content: center;
  align-self: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  min-width: 0;
}
.media-primary-actions, .media-secondary-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, var(--media-action-size));
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}
.media-primary-actions.is-wide {
  grid-template-columns: minmax(0, 1fr) var(--media-action-size);
  gap: clamp(7.02px, 0.49cqi, 11.7px);
}
.media-primary-actions.is-wide .primary-button {
  min-height: var(--media-action-size);
  border-radius: var(--bruno-liquid-control-radius, 14px);
}
.media-action-button, .media-action-spacer, .media-identity-cell {
  width: var(--media-action-size);
  height: var(--media-action-size);
}
.media-action-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  color: rgba(255,255,255,0.82);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.08));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.media-action-button bruno-icon {
  --mdc-icon-size: 20px;
}
.media-action-button.is-main {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%), linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58)) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.22), 0 0 22px rgba(96,165,250,0.24) );
}
.media-action-button.is-tool {
  color: rgba(210,245,230,0.96);
  background: var(--bruno-liquid-control-green-background, radial-gradient(circle at 50% 16%, rgba(46,231,122,0.22), transparent 72%), rgba(255,255,255,0.075) );
  border-color: var(--bruno-liquid-control-green-border, rgba(46,231,122,0.22));
  box-shadow: var(--bruno-liquid-control-green-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
}
.media-action-button:disabled {
  opacity: 0.42;
  cursor: default;
}
.media-action-spacer {
  display: block;
  pointer-events: none;
  visibility: hidden;
}
.media-identity-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: rgba(210,222,236,0.58);
}
.media-identity-cell.is-active {
  color: rgba(255,255,255,0.96);
}
.tpl-media-icon {
  width: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
  display: block;
  filter: drop-shadow(0 8px 14px rgba(0,0,0,0.30));
}
.media-identity-cell.is-active .tpl-media-icon {
  filter: drop-shadow(0 0 12px rgba(96,190,255,0.34)) drop-shadow(0 8px 14px rgba(0,0,0,0.30));
}
.tpl-media-icon svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
.tpl-media-icon svg g, .tpl-media-icon svg path {
  stroke-width: 0.67;
}
.tpl-media-icon.icon-spotify.is-active {
  color: #1ed760;
  filter: drop-shadow(0 0 12px rgba(46,231,122,0.36)) drop-shadow(0 8px 14px rgba(0,0,0,0.30));
}
.media-image-button {
  background: rgba(255,255,255,0.07);
}
.media-button-art {
  position: absolute;
  inset: 0;
  background-image: var(--media-app-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.media-image-button::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
}
.media-hub-extra {
  grid-area: auto;
  min-width: 0;
  align-self: end;
}
.media-extra-info {
  min-height: clamp(26.52px, 1.87cqi, 44.2px);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 12px;
  color: var(--text-soft);
  background: rgba(255,255,255,0.052);
  border: 1px solid rgba(255,255,255,0.10);
}
.media-extra-info strong {
  color: rgba(255,255,255,0.88);
  text-align: right;
}
.media-hub-card.mh-accordion {
  position: relative;
  padding: 0;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
  border-radius: var(--bruno-liquid-card-radius, 18px);
  background: var(--bruno-liquid-surface-off-background, linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)), rgba(9,11,15,0.105) );
  border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-surface-off-shadow, inset 0 1px 0 rgba(255,255,255,0.090), 0 10px 28px rgba(0,0,0,0.145));
  backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
  -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
}
.media-hub-card.mh-accordion::before {
  opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.10);
}
.media-hub-card.mh-accordion::after {
  display: var(--bruno-subview-card-edge-display, none);
}
.mh-head {
  position: relative;
  z-index: 1;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(7.8px, 0.55cqi, 13px) 0 clamp(10.92px, 0.77cqi, 18.2px);
}
.mh-head-title {
  display: inline-flex;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-width: 0;
}
.mh-menu {
  width: clamp(23.4px, 1.65cqi, 39px);
  height: clamp(23.4px, 1.65cqi, 39px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: rgba(255,255,255,0.52);
  background: transparent;
}
.mh-menu bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
}
.media-hub-card .mh-menu.is-active {
  color: rgba(255,255,255,0.82);
  background: rgba(255,255,255,0.072);
}
.mh-menu:active {
  background: rgba(255,255,255,0.08);
}
.mh-overflow-panel {
  position: absolute;
  z-index: 5;
  top: clamp(32.76px, 2.31cqi, 54.6px);
  right: clamp(7.8px, 0.55cqi, 13px);
  width: min(clamp(218.4px, 15.38cqi, 364px), calc(100% - clamp(15.6px, 1.1cqi, 26px)));
  padding: clamp(5.46px, 0.38cqi, 9.1px);
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: linear-gradient(180deg, rgba(34,31,30,0.72), rgba(12,13,16,0.66));
  border: 1px solid rgba(255,255,255,0.115);
  box-shadow: 0 18px 36px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
  -webkit-backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
}
.mh-overflow-item {
  min-height: clamp(40.56px, 2.86cqi, 67.6px);
  display: grid;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr) clamp(26.52px, 1.87cqi, 44.2px) clamp(26.52px, 1.87cqi, 44.2px);
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: clamp(3.12px, 0.22cqi, 5.2px) clamp(3.9px, 0.27cqi, 6.5px);
}
.mh-overflow-icon {
  width: clamp(23.4px, 1.65cqi, 39px);
  height: clamp(23.4px, 1.65cqi, 39px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.86);
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.075);
}
.mh-overflow-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
}
.mh-overflow-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mh-overflow-copy strong {
  font-size: clamp(9.75px, 0.69cqi, 16.25px);
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.92);
}
.mh-overflow-copy small {
  min-width: 0;
  font-size: clamp(8.19px, 0.58cqi, 13.65px);
  line-height: 1.1;
  font-weight: 650;
  color: rgba(255,255,255,0.54);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-overflow-action {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(24.96px, 1.76cqi, 41.6px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: rgba(255,255,255,0.72);
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.075);
}
.mh-overflow-action bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
}
.mh-overflow-action.is-active {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
  border-color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.24);
  background: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.075);
}
.mh-overflow-action:disabled {
  opacity: 0.42;
  cursor: default;
}
.mh-sources {
  position: relative;
  z-index: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
}
.mh-source {
  position: relative;
  flex: 0 0 42px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: var(--bruno-liquid-band-background, rgba(255,255,255,0.010));
  border: var(--bruno-liquid-band-border, 1px solid rgba(255,255,255,0.035));
  box-shadow: var(--bruno-liquid-band-shadow, none);
  transition: flex-basis 260ms cubic-bezier(0.2, 0.8, 0.2, 1), flex-grow 260ms cubic-bezier(0.2, 0.8, 0.2, 1), background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
  will-change: flex-basis, flex-grow, background, border-color;
}
.mh-source.is-open {
  flex: 1 1 0;
  background: var(--bruno-liquid-band-open-background, linear-gradient(180deg, rgba(255,255,255,0.044), rgba(255,255,255,0.012) 54%, rgba(255,255,255,0.018)), rgba(9,11,15,0.052) );
  border-color: var(--bruno-liquid-band-open-border-color, rgba(255,255,255,0.092));
  box-shadow: var(--bruno-liquid-band-open-shadow, inset 0 1px 0 rgba(255,255,255,0.066), 0 6px 16px rgba(0,0,0,0.105));
}
.mh-source.is-switching {
  animation: mh-source-open 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.mh-source-head {
  --mh-indent: 26px;
  flex: 0 0 42px;
  height: clamp(32.76px, 2.31cqi, 54.6px);
  display: grid;
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, auto) minmax(0, 1fr) clamp(12.48px, 0.88cqi, 20.8px);
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px) 0 clamp(10.92px, 0.77cqi, 18.2px);
  background: transparent;
  text-align: left;
  transition: flex-basis 220ms ease, height 220ms ease;
}
.mh-source.is-open .mh-source-head {
  flex: 0 0 48px;
  height: clamp(37.44px, 2.64cqi, 62.4px);
  align-items: center;
}
.mh-src-icon {
  width: clamp(15.6px, 1.1cqi, 26px);
  height: clamp(15.6px, 1.1cqi, 26px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
  color: rgba(255,255,255,0.6);
  background: transparent;
  border: 0;
}
.mh-icon-spotify {
  color: rgba(255,255,255,0.66);
}
.mh-source.is-active .mh-src-icon, .mh-source.is-active .mh-icon-spotify {
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-src-name {
  min-width: 0;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 800;
  line-height: 1;
  color: rgba(255,255,255,0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-source.is-open .mh-src-name {
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
}
.mh-src-summary {
  min-width: 0;
  justify-self: end;
  max-width: 100%;
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 650;
  color: rgba(255,255,255,0.50);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-source.is-open .mh-src-summary {
  display: none;
}
.mh-src-chevron {
  --mdc-icon-size: 18px;
  color: rgba(255,255,255,0.4);
}
.mh-source.is-open .mh-src-chevron {
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-source-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(clamp(131.04px, 9.23cqi, 218.4px), 40%, clamp(202.8px, 14.29cqi, 338px));
  gap: clamp(10.92px, 0.77cqi, 18.2px);
  padding: 2px clamp(12.48px, 0.88cqi, 20.8px) clamp(10.92px, 0.77cqi, 18.2px);
}
.mh-source.is-switching .mh-source-body {
  opacity: 0;
  transform: translateY(5px);
  animation: mh-source-body-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) 55ms both;
}
.mh-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.mh-source.is-switching .mh-left {
  animation: mh-source-content-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) 75ms both;
}
.mh-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: clamp(20.28px, 1.43cqi, 33.8px);
}
.mh-info small {
  display: block;
  font-size: clamp(10.53px, 0.74cqi, 17.55px);
  font-weight: 750;
  line-height: 1.15;
  color: rgba(255,255,255,0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-info em {
  display: block;
  font-style: normal;
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-progress-wrap {
  width: min(100%, 94%);
  margin-top: clamp(3.9px, 0.27cqi, 6.5px);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
}
.mh-progress-time {
  font-size: clamp(7.41px, 0.52cqi, 12.35px);
  line-height: 1;
  font-weight: 700;
  color: rgba(255,255,255,0.48);
  font-variant-numeric: tabular-nums;
}
.mh-progress {
  height: clamp(3.12px, 0.22cqi, 5.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.14);
  overflow: hidden;
}
.mh-progress span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(var(--bruno-liquid-warm-accent, 242,194,102)), rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.88));
}
.mh-controls {
  min-width: 0;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
}
.mh-vol {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  min-height: clamp(24.96px, 1.76cqi, 41.6px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  color: var(--text-soft);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-control-shadow, none);
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
}
.mh-vol bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-status, 15px);
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol-label {
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 700;
  white-space: nowrap;
  color: rgba(255,255,255,0.7);
}
.mh-vol input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: clamp(3.12px, 0.22cqi, 5.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  accent-color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: clamp(10.92px, 0.77cqi, 18.2px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 50%;
  background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
  box-shadow: 0 0 8px rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.5);
  cursor: pointer;
}
.mh-vol input[type="range"]::-moz-range-thumb {
  width: clamp(10.92px, 0.77cqi, 18.2px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border: 0;
  border-radius: 50%;
  background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol.is-disabled {
  opacity: 0.4;
}
.mh-btn-row {
  display: grid;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.mh-btn-row-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.mh-btn-row-4 {
  grid-template-columns: repeat(3, minmax(0, 1fr)) clamp(32.76px, 2.31cqi, 54.6px);
}
.mh-btn {
  min-height: clamp(31.2px, 2.2cqi, 52px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  color: rgba(255,255,255,0.88);
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 700;
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-control-shadow, none);
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  white-space: nowrap;
  overflow: hidden;
}
.mh-btn.is-icon {
  padding: 0;
  gap: 0;
}
.mh-btn bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-control, 23px);
  flex: 0 0 auto;
  color: rgba(255,255,255,0.9);
}
.mh-btn:hover {
  background: rgba(255,255,255,0.052);
}
.mh-btn span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-btn:active {
  transform: translateY(1px);
}
.mh-btn:disabled {
  opacity: 0.42;
  cursor: default;
}
.mh-controls > .mh-btn.is-main {
  align-self: flex-start;
  width: 50%;
  min-width: clamp(109.2px, 7.69cqi, 182px);
  min-height: clamp(31.2px, 2.2cqi, 52px);
}
.mh-btn.is-main {
  color: rgba(255,255,255,0.94);
  background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
}
.mh-btn.is-main bruno-icon {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.82);
}
.mh-btn.is-plus {
  padding: 0;
  color: rgba(255,255,255,0.72);
}
.mh-art {
  position: relative;
  min-width: 0;
  align-self: stretch;
  height: 100%;
  overflow: hidden;
  background: transparent;
  border: 0;
}
.mh-source.is-switching .mh-art {
  animation: mh-source-art-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) 85ms both;
}
.mh-art img {
  position: absolute;
  inset: clamp(4.68px, 0.33cqi, 7.8px) 0;
  width: 100%;
  height: calc(100% - clamp(9.36px, 0.66cqi, 15.6px));
  object-fit: contain;
}
.mh-art bruno-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  --mdc-icon-size: 56px;
  color: rgba(255,255,255,0.22);
}
.mh-art.is-standby img {
  filter: none;
}
.mh-art.is-cover img {
  object-fit: cover;
}
.mh-art-square.is-cover img {
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: auto;
  height: calc(100% - clamp(7.8px, 0.55cqi, 13px));
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: none;
}
.mh-art-wide.is-cover img {
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 11px;
  box-shadow: none;
}
@keyframes mh-source-open {
from {
  flex-grow: 0;
  flex-basis: clamp(32.76px, 2.31cqi, 54.6px);
  border-color: var(--bruno-liquid-band-border-color, rgba(255,255,255,0.040));
  box-shadow: var(--bruno-liquid-band-shadow, none);
}
to {
  flex-grow: 1;
  flex-basis: 0;
  border-color: var(--bruno-liquid-band-open-border-color, rgba(255,255,255,0.092));
  box-shadow: var(--bruno-liquid-band-open-shadow, inset 0 1px 0 rgba(255,255,255,0.066), 0 6px 16px rgba(0,0,0,0.105));
}
}
@keyframes mh-source-body-in {
from {
  opacity: 0;
  transform: translateY(5px);
}
to {
  opacity: 1;
  transform: translateY(0);
}
}
@keyframes mh-source-content-in {
from {
  opacity: 0;
  transform: translateY(4px);
}
to {
  opacity: 1;
  transform: translateY(0);
}
}
@keyframes mh-source-art-in {
from {
  opacity: 0;
  transform: translateY(4px) scale(0.985);
}
to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
}
@media (prefers-reduced-motion: reduce) {
.mh-source, .mh-source-head, .mh-source-body, .mh-left, .mh-art, .mh-btn {
  transition: none !important;
  animation: none !important;
}
.mh-source-body {
  opacity: 1;
  transform: none;
}
}
.ac-card {
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ac-head {
  margin-bottom: 0;
}
.power-button {
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  color: rgba(255,255,255,0.74);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.13));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.09));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.power-button.is-active {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,165,250,0.34), transparent 72%), rgba(38,92,138,0.38) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,165,250,0.32));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
}
.power-button bruno-icon {
  --mdc-icon-size: 18px;
}
.ac-body {
  height: 100%;
  min-height: 0;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto auto auto auto;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  align-content: space-between;
}
.temperature-slider {
  min-width: 0;
  width: 100%;
  display: block;
  align-items: center;
  padding: 0;
  background: transparent;
  border: 0;
  margin-bottom: 3px;
}
.climate-stepper {
  display: grid;
  grid-template-columns: clamp(32.76px, 2.31cqi, 54.6px) minmax(0, 1fr) clamp(32.76px, 2.31cqi, 54.6px);
  align-items: center;
  overflow: hidden;
  margin-bottom: clamp(3.12px, 0.22cqi, 5.2px);
}
.ac-visual {
  position: relative;
  min-height: clamp(234px, 16.48cqi, 390px);
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  justify-items: center;
  gap: clamp(12.48px, 0.88cqi, 20.8px);
  padding: 0 0 2px;
}
.ac-image-shell {
  position: relative;
  width: 100%;
  height: clamp(90.48px, 6.37cqi, 150.8px);
  margin: -2px 0 0;
  display: grid;
  place-items: start center;
  overflow: visible;
}
.ac-unit-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center top;
  filter: drop-shadow(0 18px 26px rgba(0,0,0,0.38));
  opacity: 1;
  transform: translateY(0);
  transition: opacity 260ms ease, transform 320ms ease, filter 260ms ease;
}
.ac-unit-image-on {
  opacity: 0;
  transform: translateY(2px);
  filter: drop-shadow(0 18px 26px rgba(0,0,0,0.38)) drop-shadow(0 0 18px rgba(110,200,255,0.12));
}
.ac-image-shell.is-on .ac-unit-image-off {
  opacity: 0;
  transform: translateY(-1px);
}
.ac-image-shell.is-on .ac-unit-image-on {
  opacity: 1;
  transform: translateY(0);
}
.ac-image-fallback {
  display: none;
  --mdc-icon-size: 84px;
  place-self: center;
  color: rgba(226,232,240,0.46);
  filter: drop-shadow(0 14px 22px rgba(0,0,0,0.32));
}
.ac-image-shell.is-fallback .ac-unit-image {
  display: none;
}
.ac-image-shell.is-fallback .ac-image-fallback {
  display: block;
}
.icg-root {
  width: 100%;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
}
.icg-shell {
  width: min(100%, clamp(639.6px, 45.05cqi, 1066px));
  aspect-ratio: 16 / 10;
  position: relative;
  background: transparent;
}
.icg-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  display: block;
  background: transparent;
}
.icg-track-shadow {
  fill: none;
  stroke: rgba(0, 0, 0, 0.34);
  stroke-width: 16;
  stroke-linecap: round;
}
.icg-track-muted {
  fill: none;
  stroke: rgba(112, 136, 164, 0.38);
  stroke-width: 8;
  stroke-linecap: round;
}
.icg-active-glow {
  fill: none;
  stroke: url(#icgActiveBlue);
  stroke-width: 18;
  stroke-linecap: round;
  opacity: 0.74;
  filter: url(#icgBlueGlow);
}
.icg-active-arc {
  fill: none;
  stroke: url(#icgActiveBlue);
  stroke-width: 8;
  stroke-linecap: round;
}
.icg-tick {
  stroke-linecap: round;
}
.icg-tick.minor {
  stroke: rgba(145, 176, 214, 0.34);
  stroke-width: 1.2;
}
.icg-tick.medium {
  stroke: rgba(190, 214, 240, 0.50);
  stroke-width: 1.6;
}
.icg-tick.major {
  stroke: rgba(238, 247, 255, 0.88);
  stroke-width: 2.5;
}
.icg-inner-tick {
  stroke: rgba(40, 145, 255, 0.24);
  stroke-width: 1;
  stroke-linecap: round;
}
.icg-label {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(14.04px, 0.99cqi, 23.4px);
  font-weight: 500;
  letter-spacing: 1.4px;
  fill: rgba(224, 235, 248, 0.74);
}
.icg-label.edge {
  font-size: clamp(17.16px, 1.21cqi, 28.6px);
  fill: rgba(230, 240, 252, 0.82);
}
.icg-label.top {
  font-size: clamp(14.82px, 1.04cqi, 24.7px);
  fill: rgba(235, 245, 255, 0.90);
}
.icg-marker-glow {
  fill: rgba(40, 175, 255, 0.28);
  filter: url(#icgBlueGlow);
}
.icg-marker-ring {
  fill: rgba(5, 10, 18, 0.94);
  stroke: rgba(92, 210, 255, 0.98);
  stroke-width: 4;
  filter: url(#icgBlueGlow);
}
.icg-marker-highlight {
  fill: rgba(255, 255, 255, 0.62);
  opacity: 0.62;
}
.icg-center-mode {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 500;
  letter-spacing: 9px;
  fill: rgba(38, 190, 255, 0.96);
  text-transform: uppercase;
}
.icg-center-temp {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(74.88px, 5.27cqi, 124.8px);
  font-weight: 300;
  letter-spacing: -8px;
  fill: rgba(246, 250, 255, 0.98);
  filter: url(#icgTextGlow);
}
.icg-center-sub {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 500;
  letter-spacing: 9px;
  fill: rgba(190, 204, 220, 0.72);
  text-transform: uppercase;
}
.icg-center-line {
  stroke: rgba(36, 195, 255, 0.95);
  stroke-width: 2;
  stroke-linecap: round;
  filter: url(#icgBlueGlow);
}
.icg-ambient {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 500;
  letter-spacing: 1.8px;
  fill: rgba(176, 196, 220, 0.60);
}
.climate-mode-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.fan-mode-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
}
.fan-mode {
  color: rgba(255,255,255,0.74);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
  aspect-ratio: 1;
  min-height: 0;
  height: auto;
  padding: 0 clamp(3.12px, 0.22cqi, 5.2px);
}
@media (min-width: 761px) {
.lights-card {
  position: absolute;
  left: 0;
  right: 0;
  bottom: var(--lights-dock-bottom, calc(var(--ac-h, 320px) + 7px));
  z-index: 6;
  max-height: calc(100% - var(--lights-dock-bottom, calc(var(--ac-h, 320px) + 7px)));
}
.right-column > .ac-card {
  grid-row: 2;
}
}
.lights-dock-actions {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.lights-card.is-open .lights-dock-chevron {
  transform: rotate(180deg);
}
.lights-card.is-open .lights-body {
  grid-template-rows: 1fr;
}
.lights-body-clip {
  min-height: 0;
  overflow: hidden;
}
.lights-scroll::-webkit-scrollbar {
  width: 0;
}
.light-section + .light-section {
  margin-top: clamp(9.36px, 0.66cqi, 15.6px);
  padding-top: clamp(9.36px, 0.66cqi, 15.6px);
  border-top: 1px solid rgba(255,255,255,0.10);
}
.section-head .zone-id {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.section-head .zone-id strong {
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 700;
  line-height: 1.1;
}
.section-head .zone-id small {
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 600;
  color: rgba(255,255,255,0.46);
}
.section-head .zone-off {
  padding: 0 2px;
  border: 0;
  background: none;
  font: inherit;
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 700;
  color: rgba(255,196,90,0.92);
  cursor: pointer;
}
.lights-substatus {
  padding: 0 2px clamp(6.24px, 0.44cqi, 10.4px);
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 600;
  color: rgba(255,255,255,0.46);
}
.light-cell.is-wide {
  grid-column: 1 / -1;
}
.light-cell.is-on .lc-icon {
  --light-color: #f0c040;
  color: var(--light-color);
  filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
}
.light-cell.is-on .lc-switch {
  background: rgba(255,196,90,0.55);
  border-color: rgba(255,196,90,0.65);
}
@media (prefers-reduced-motion: reduce) {
.lights-body, .lights-dock-chevron, .lc-switch, .lc-knob {
  transition: none;
}
}
.lights-dock-id {
  display: flex;
  align-items: center;
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
}
.lights-dock-chevron {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  width: clamp(17.16px, 1.21cqi, 28.6px);
  height: clamp(17.16px, 1.21cqi, 28.6px);
  color: rgba(255,255,255,0.55);
}
.lights-dock-chevron bruno-icon {
  --mdc-icon-size: 20px;
}
.lights-dock {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px);
  min-height: clamp(40.56px, 2.86cqi, 67.6px);
}
.lights-scroll {
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
}
.section-head {
  display: grid;
  align-items: center;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(6.24px, 0.44cqi, 10.4px);
}
.lights-card.is-open .lights-dock {
  border-bottom: 1px solid rgba(255,255,255,0.10);
}
.light-cell {
  display: grid;
  align-items: center;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr) auto;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  min-height: clamp(46.8px, 3.3cqi, 78px);
  border: 1px solid var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
  border-radius: 0;
}
.lc-icon {
  display: grid;
  place-items: center start;
  --light-color: #9da0a2;
  color: var(--light-color);
  width: clamp(15.6px, 1.1cqi, 26px);
}
.lc-name {
  min-width: 0;
  font-weight: 600;
  color: rgba(255,255,255,0.90);
  text-overflow: ellipsis;
  font-size: clamp(10.53px, 0.74cqi, 17.55px);
  line-height: 1.15;
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.lc-switch {
  box-sizing: border-box;
  padding: 0 2px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.13);
  display: grid;
  align-items: center;
  transition: background 180ms ease, border-color 180ms ease;
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(14.82px, 1.04cqi, 24.7px);
}
.lc-knob {
  border-radius: 50%;
  background: rgba(255,255,255,0.92);
  transform: translateX(0);
  transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  width: clamp(10.92px, 0.77cqi, 18.2px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
}
.light-cell.is-on .lc-knob {
  transform: translateX(12px);
}
.lights-card {
  grid-template-rows: auto minmax(0, 1fr);
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}
.lights-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: 0fr;
  gap: 0;
  transition: grid-template-rows 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  justify-items: stretch;
}
.lights-body-clip, .lights-scroll, .light-section, .light-grid {
  width: 100%;
  box-sizing: border-box;
}
.light-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: calc(100% - clamp(15.6px, 1.1cqi, 26px));
  margin-inline: 10px;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
}
.light-cell.has-rule-top {
  border-top: 1px solid rgba(255,255,255,0.075);
  border-top-color: var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
}
.light-cell.has-rule-left {
  border-left: 1px solid rgba(255,255,255,0.075);
  border-left-color: var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
}
@media (max-width: 1180px) {
:host {
  height: auto;
  min-height: 100vh;
  overflow: visible;
}
.room-subview {
  height: auto;
  min-height: 100vh;
  overflow: auto;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
  grid-template-areas: "left" "right";
  padding: clamp(7.8px, 0.55cqi, 13px);
}
.room-sidebar {
  display: none;
}
.subview-topbar, .subview-footer {
  display: none;
}
.left-column {
  height: auto;
  grid-template-rows: minmax(clamp(265.2px, 18.68cqi, 442px), 42vh) minmax(clamp(210.6px, 14.84cqi, 351px), 34vh);
}
.right-column {
  height: auto;
  grid-template-rows: auto auto;
}
.right-control-grid {
  grid-template-columns: minmax(0, 1fr) minmax(clamp(218.4px, 15.38cqi, 364px), 0.72fr);
  grid-template-rows: minmax(clamp(184.08px, 12.97cqi, 306.8px), auto) minmax(clamp(234px, 16.48cqi, 390px), auto);
  grid-template-areas: "lights ac" "media ac";
}
.lights-body {
  grid-template-columns: minmax(0, 1fr);
}
.lights-zone-rail {
  display: none;
}
.status-rail {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  min-height: clamp(53.04px, 3.74cqi, 88.4px);
}
}
@media (max-width: 760px) {
.room-subview {
  grid-template-rows: auto;
  grid-template-columns: 1fr;
  grid-template-areas: "left" "right";
  padding: clamp(6.24px, 0.44cqi, 10.4px);
}
.left-column {
  grid-template-rows: minmax(clamp(335.4px, 23.63cqi, 559px), auto) minmax(clamp(304.2px, 21.43cqi, 507px), auto);
}
.right-control-grid {
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto;
  grid-template-areas: "lights" "media" "ac";
}
.status-rail {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: auto;
}
.status-item {
  min-height: clamp(45.24px, 3.19cqi, 75.4px);
}
.media-tabs {
  max-width: 100%;
  width: 100%;
  justify-content: space-between;
}
.media-hub-head {
  display: grid;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.media-hub-body {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(clamp(137.28px, 9.67cqi, 228.8px), auto) auto;
  grid-template-areas: "visual" "content";
}
.media-hub-content {
  grid-template-rows: auto auto auto;
}
.camera-list {
  grid-template-columns: 1fr;
}
.lights-title-row, .module-head {
  flex-wrap: wrap;
}
.head-actions {
  width: 100%;
}
.head-actions .chip-button {
  flex: 1 1 0;
}
.curtain-control-row {
  align-items: stretch;
  grid-template-columns: 1fr;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.curtain-status {
  justify-self: start;
}
.curtain-main-actions {
  justify-content: stretch;
}
.curtain-action-button {
  flex: 1 1 0;
  min-width: 0;
}
.ac-visual {
  min-height: clamp(185.64px, 13.08cqi, 309.4px);
}
}
@media (max-width: 800px) {
:host {
  height: auto;
  min-height: 0;
  overflow: visible;
}
}
$ {
  globalThis.BrunoSurfaceMaterial?.subviewStyles?.() || '';
}
`, $a = w`
:host([data-appliances]) .appliances-card {
  grid-area: appliances;
  min-width: 0;
  min-height: 0;
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  display: grid;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
  overflow: hidden;
}
:host([data-appliances]) .appliances-head {
  min-height: clamp(29.64px, 2.09cqi, 49.4px);
  margin-bottom: 0;
}
:host([data-appliances]) .appliances-grid {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-appliances]) .appliance-tile {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.085);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.055);
  overflow: hidden;
}
:host([data-appliances]) .appliance-tile.is-on {
  border-color: rgba(255,196,90,0.30);
  background: linear-gradient(180deg, rgba(255,196,90,0.10), rgba(255,255,255,0.040));
}
:host([data-appliances]) .appliance-tile.is-muted {
  color: rgba(255,255,255,0.74);
}
:host([data-appliances]) .appliance-more {
  position: absolute;
  top: clamp(5.46px, 0.38cqi, 9.1px);
  right: clamp(5.46px, 0.38cqi, 9.1px);
  z-index: 3;
}
:host([data-appliances]) .appliance-more:disabled {
  opacity: 0.28;
  cursor: default;
}
:host([data-appliances]) .appliance-visual {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px) 2px;
}
:host([data-appliances]) .appliance-visual img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 14px 22px rgba(0,0,0,0.42));
}
:host([data-appliances]) .appliance-visual bruno-icon {
  --mdc-icon-size: 44px;
  color: rgba(255,255,255,0.24);
}
:host([data-appliances]) .appliance-visual img + bruno-icon {
  display: none;
}
:host([data-appliances]) .appliance-visual.is-image-missing img {
  display: none;
}
:host([data-appliances]) .appliance-visual.is-image-missing bruno-icon {
  display: block;
}
:host([data-appliances]) .appliance-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
:host([data-appliances]) .appliance-copy strong {
  min-width: 0;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.94);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-appliances]) .appliance-copy small {
  min-width: 0;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1.05;
  font-weight: 700;
  color: rgba(255,255,255,0.52);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-appliances]) .appliance-tile.is-on .appliance-copy small {
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
`, Ma = w`
@media (max-width: 800px) {
:host([data-tvhub]) .content-left, :host([data-tvhub]) .right-column, :host([data-tvhub]) .cams-media-row {
  display: contents;
}
:host([data-tvhub]) .subview-topband {
  order: 0;
  width: 100%;
  height: auto;
  min-height: 0;
  display: block;
}
:host([data-tvhub]) .topband-badges {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: visible;
}
:host([data-tvhub]) .topband-badges .tb-badge[data-phone-hide], :host([data-tvhub]) .topband-clock {
  display: none;
}
:host([data-tvhub]) .tb-badge {
  min-width: 0;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr);
  column-gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
}
:host([data-tvhub]) .tb-badge-icon {
  width: clamp(15.6px, 1.1cqi, 26px);
  height: clamp(15.6px, 1.1cqi, 26px);
}
:host([data-tvhub]) .tb-badge-sub {
  max-width: 100%;
}
:host([data-tvhub]) .hero-panel {
  order: 10;
  height: auto;
  min-height: 0;
}
:host([data-tvhub]) .hero-panel.is-unconfigured {
  display: none;
}
:host([data-tvhub]) .hero-atmosphere, :host([data-tvhub]) .hero-atmosphere .hero-content {
  height: auto;
  min-height: 0;
}
:host([data-tvhub]) .curtain-control-row {
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-tvhub]) .curtain-status {
  justify-self: start;
}
:host([data-tvhub]) .curtain-main-actions {
  width: 100%;
  justify-content: stretch;
}
:host([data-tvhub]) .curtain-action-button {
  flex: 1 1 0;
  min-width: 0;
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .lights-card {
  order: 20;
  height: auto;
  min-height: 0;
  overflow: visible;
}
:host([data-tvhub]) .lights-card .module-head {
  min-height: 0;
  flex-wrap: wrap;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-tvhub]) .head-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
:host([data-tvhub]) .head-actions .chip-button, :host([data-tvhub]) .zone-header {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .lights-zones, :host([data-tvhub]) .zone-lights, :host([data-tvhub]) .office-light-list {
  flex: 0 0 auto;
  max-height: none !important;
  overflow-y: visible !important;
  overscroll-behavior: auto;
}
:host([data-tvhub]) .ac-card.ac-card-lean {
  order: 30;
  height: auto;
  min-height: clamp(280.8px, 19.78cqi, 468px);
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(clamp(171.6px, 12.09cqi, 286px), auto) auto;
  overflow: visible;
}
:host([data-tvhub]) .ac-lean-foot {
  align-items: stretch;
}
:host([data-tvhub]) .ac-action {
  min-height: clamp(40.56px, 2.86cqi, 67.6px);
}
:host([data-tvhub]) .media-hub-card.mh-accordion {
  order: 40;
  height: auto;
  min-height: clamp(257.4px, 18.13cqi, 429px);
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(clamp(216.84px, 15.27cqi, 361.4px), 1fr);
}
:host([data-tvhub]) .media-hub-card.is-unconfigured {
  display: none;
}
:host([data-tvhub]) .mh-source {
  flex-basis: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .mh-source-head {
  flex-basis: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .mh-source-body {
  grid-template-columns: minmax(0, 1fr) clamp(clamp(81.12px, 5.71cqi, 135.2px), 30vw, clamp(115.44px, 8.13cqi, 192.4px));
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding-inline: 12px;
}
:host([data-tvhub]) .mh-info {
  padding-left: 0;
}
:host([data-tvhub]) .mh-controls > .mh-btn.is-main {
  width: 100%;
  min-width: 0;
}
:host([data-tvhub]) .mh-menu, :host([data-tvhub]) .mh-btn {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .mh-menu {
  width: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .cameras-card.cameras-card-controls {
  order: 50;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) clamp(clamp(171.6px, 12.09cqi, 286px), 58vw, clamp(280.8px, 19.78cqi, 468px));
}
:host([data-tvhub]) .camera-pip-stage, :host([data-tvhub]) .camera-feed {
  min-height: 0;
  height: 100%;
}
:host([data-tvhub]) .camera-control {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .subview-footer {
  display: none;
}
}
`, Ea = w`
@media (max-width: 800px) {
:host([data-ps5]) .camera-pip-feed {
  right: clamp(12.48px, 0.88cqi, 20.8px);
  bottom: clamp(12.48px, 0.88cqi, 20.8px);
  width: clamp(clamp(68.64px, 4.84cqi, 114.4px), 25%, clamp(87.36px, 6.15cqi, 145.6px));
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 11px;
}
:host([data-ps5]) .camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: clamp(54.6px, 3.85cqi, 91px);
}
}
`;
w`

`;
const Oa = w`
:host([data-room='sala']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-sala-marquee 10s linear infinite;
}
@keyframes bruno-sala-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='sala']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='sala']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='sala']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='sala']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
}
:host([data-room='sala']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='sala']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='sala']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='sala']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='sala']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='sala']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, Ta = w`
:host([data-room='office']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-sala-marquee 10s linear infinite;
}
@keyframes bruno-sala-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='office']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='office']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='office']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='office']) .zone-lights {
  display: flex;
  flex-direction: column;
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
}
:host([data-room='office']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='office']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='office']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='office']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
:host([data-room='office']) .mh-btn-row-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
:host([data-room='office']) .office-light-list {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  min-height: 0;
  padding: 0 2px 0 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='office']) .office-light-list::-webkit-scrollbar {
  width: 0;
}
:host([data-room='office']) .office-pc-actions .mh-btn {
  min-width: 0;
}
@media (max-width: 800px) {
:host([data-room='office']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, Ra = w`
:host([data-room='cozinha']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-sala-marquee 10s linear infinite;
}
@keyframes bruno-sala-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='cozinha']) .room-subview .content-left {
  grid-template-rows: minmax(0, 1fr);
}
:host([data-room='cozinha']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(7px - var(--room-gap, 10px));
}
:host([data-room='cozinha']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='cozinha']) .zone-lights {
  display: flex;
  flex-direction: column;
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
}
:host([data-room='cozinha']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='cozinha']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='cozinha']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='cozinha']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
:host([data-room='cozinha']) .mh-btn-row-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
:host([data-room='cozinha']) .office-light-list {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  min-height: 0;
  padding: 0 2px 0 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='cozinha']) .office-light-list::-webkit-scrollbar {
  width: 0;
}
:host([data-room='cozinha']) .office-pc-actions .mh-btn {
  min-width: 0;
}
:host([data-room='cozinha']) .room-subview {
  width: 100%;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 0.81fr) minmax(0, 0.81fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: 48px minmax(0, 1fr) var(--ac-h, 320px);
  grid-template-areas: "topband topband topband" "hero hero right" "cams appliances appliances";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
  overflow: hidden;
}
:host([data-room='cozinha']) .room-subview .subview-topband {
  grid-area: topband;
}
:host([data-room='cozinha']) .room-subview .hero-panel {
  grid-area: hero;
  min-width: 0;
  min-height: 0;
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .right-column {
  grid-area: right;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: max-content;
  align-content: start;
}
:host([data-room='cozinha']) .room-subview .lights-card {
  width: 100%;
  min-width: 0;
  min-height: 0;
}
:host([data-room='cozinha']) .room-subview .cameras-card {
  grid-area: cams;
  min-width: 0;
  min-height: 0;
}
:host([data-room='cozinha']) .room-subview .appliances-card {
  grid-area: appliances;
  min-width: 0;
  min-height: 0;
}
:host([data-room='cozinha']) .room-subview .subview-footer {
  grid-area: bottomband;
}
:host([data-room='cozinha']) .room-subview .hero-atmosphere, :host([data-room='cozinha']) .room-subview .hero-atmosphere .hero-content {
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .hero-atmosphere .hero-content {
  display: block;
  padding: 0;
}
:host([data-room='cozinha']) .room-subview .curtain-dock {
  display: none !important;
}
:host([data-room='cozinha']) .room-subview .appliance-tile {
  display: block;
}
:host([data-room='cozinha']) .room-subview .appliance-main {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
:host([data-room='cozinha']) .room-subview .appliance-main:disabled {
  cursor: default;
}
:host([data-room='cozinha']) .room-subview .appliance-main:focus-visible {
  outline: 1px solid rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.58);
  outline-offset: -4px;
  border-radius: calc(var(--room-radius-small) - 3px);
}
:host([data-room='cozinha']) .room-subview .appliance-tile.is-airfryer .appliance-visual img {
  transform: scale(0.92);
}
@media (max-width: 800px) {
:host([data-room='cozinha']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
:host([data-room='cozinha']) .room-subview .right-column {
  display: contents;
}
:host([data-room='cozinha']) .room-subview .subview-topband {
  order: 0;
  width: 100%;
  height: auto;
  min-height: 0;
  display: block;
}
:host([data-room='cozinha']) .room-subview .topband-badges {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: visible;
}
:host([data-room='cozinha']) .room-subview .topband-badges .tb-badge[data-phone-hide], :host([data-room='cozinha']) .room-subview .topband-clock {
  display: none;
}
:host([data-room='cozinha']) .room-subview .tb-badge {
  min-width: 0;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr);
  column-gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
}
:host([data-room='cozinha']) .room-subview .tb-badge-icon {
  width: clamp(15.6px, 1.1cqi, 26px);
  height: clamp(15.6px, 1.1cqi, 26px);
}
:host([data-room='cozinha']) .room-subview .tb-badge-sub {
  max-width: 100%;
}
:host([data-room='cozinha']) .room-subview .hero-panel.is-unconfigured {
  display: none;
}
:host([data-room='cozinha']) .room-subview .lights-card {
  order: 20;
  width: 100%;
  height: auto;
  min-height: 0;
  overflow: visible;
}
:host([data-room='cozinha']) .room-subview .lights-card .module-head {
  min-height: 0;
  flex-wrap: wrap;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-room='cozinha']) .room-subview .head-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
:host([data-room='cozinha']) .room-subview .head-actions .chip-button, :host([data-room='cozinha']) .room-subview .zone-header {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .lights-zones, :host([data-room='cozinha']) .room-subview .zone-lights, :host([data-room='cozinha']) .room-subview .office-light-list {
  flex: 0 0 auto;
  max-height: none !important;
  overflow-y: visible !important;
  overscroll-behavior: auto;
}
:host([data-room='cozinha']) .room-subview .appliances-card {
  order: 30;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: auto auto;
  overflow: hidden;
}
:host([data-room='cozinha']) .room-subview .appliances-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(clamp(120.12px, 8.46cqi, 200.2px), auto);
  align-items: stretch;
}
:host([data-room='cozinha']) .room-subview .appliance-tile:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}
:host([data-room='cozinha']) .room-subview .appliance-main {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .mh-menu {
  width: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .cameras-card.cameras-card-controls {
  order: 40;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) clamp(clamp(171.6px, 12.09cqi, 286px), 58vw, clamp(280.8px, 19.78cqi, 468px));
}
:host([data-room='cozinha']) .room-subview .camera-pip-stage, :host([data-room='cozinha']) .room-subview .camera-feed {
  min-height: 0;
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .camera-pip-feed {
  right: clamp(12.48px, 0.88cqi, 20.8px);
  bottom: clamp(12.48px, 0.88cqi, 20.8px);
  width: clamp(clamp(68.64px, 4.84cqi, 114.4px), 25%, clamp(87.36px, 6.15cqi, 145.6px));
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 11px;
}
:host([data-room='cozinha']) .room-subview .camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: clamp(54.6px, 3.85cqi, 91px);
}
:host([data-room='cozinha']) .room-subview .camera-control {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .subview-footer {
  display: none;
}
}
`, Ia = w`
:host([data-room='casal']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-qcasal-marquee 10s linear infinite;
}
@keyframes bruno-qcasal-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='casal']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='casal']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='casal']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 2px 0 0;
}
:host([data-room='casal']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='casal']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='casal']) .light-row {
  display: grid;
  grid-template-columns: clamp(24.96px, 1.76cqi, 41.6px) clamp(87.36px, 6.15cqi, 145.6px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
  padding: clamp(3.9px, 0.27cqi, 6.5px) clamp(6.24px, 0.44cqi, 10.4px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='casal']) .light-row-icon {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(24.96px, 1.76cqi, 41.6px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='casal']) .light-row-name {
  min-width: 0;
  font-size: clamp(9.75px, 0.69cqi, 16.25px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='casal']) .light-bar {
  height: clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='casal']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, Na = w`
:host([data-room='marina']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-qmarina-marquee 10s linear infinite;
}
@keyframes bruno-qmarina-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='marina']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='marina']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='marina']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='marina']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='marina']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='marina']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='marina']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='marina']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='marina']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='marina']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, Da = w`
:host([data-room='miguel']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-qmiguel-marquee 10s linear infinite;
}
@keyframes bruno-qmiguel-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='miguel']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='miguel']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='miguel']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 2px 0 0;
}
:host([data-room='miguel']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='miguel']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='miguel']) .light-row {
  display: grid;
  grid-template-columns: clamp(24.96px, 1.76cqi, 41.6px) clamp(87.36px, 6.15cqi, 145.6px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
  padding: clamp(3.9px, 0.27cqi, 6.5px) clamp(6.24px, 0.44cqi, 10.4px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='miguel']) .light-row-icon {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(24.96px, 1.76cqi, 41.6px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='miguel']) .light-row-name {
  min-width: 0;
  font-size: clamp(9.75px, 0.69cqi, 16.25px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='miguel']) .light-bar {
  height: clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='miguel']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, Fa = {
  sala: Oa,
  office: Ta,
  cozinha: Ra,
  casal: Ia,
  marina: Na,
  miguel: Da
}, Va = w`
  @media (max-width: 800px) {
    /* ══ 1. A MOLDURA ═══════════════════════════════════════════════════════ */

    :host([data-room]) {
      height: auto;
      /* A folha é ancorada na base da subview; sem esta linha a subview teria
         a altura do conteúdo (671px) e a folha subiria no lugar errado. */
      min-height: 100%;
      overflow: visible;
      /* ANTERIOR (rollback): o WebView podia escolher a subview como âncora ao
         montar uma folha fixed e deslocar Office/Quartos alguns pixels. */
      overflow-anchor: none;
    }

    :host([data-room]) .room-subview {
      overflow-anchor: none;
      /* Reserva acima da folha: o que fica entre o topo e o fim da câmera.
         Medido a 428px; a folha nunca ultrapassa este limite, então a câmera
         é preservada por construção e não por sorte de aritmética. */
      /* ── A CÂMERA É O ELEMENTO DOMINANTE (itens 3 e 23) ───────────────────
         ANTERIOR (rollback rev. faixa-de-tiles): --fone-reserva: 372px e palco
         em 58vw (248px a 428 de largura). Medido a 428x926: a composicao
         terminava em y=654 e sobravam 214px mortos acima do dock — um quarto da
         tela vazio. Na Cozinha, que nao tem cortina, sobravam 403px.

         Essa tentativa foi substituida depois do aceite no aparelho: o palco
         volta a 16:9 e a area restante e espaco negativo intencional. A camera
         permanece a ancora visual sem virar um bloco quase quadrado.

         O teto da folha nao segue mais o palco: com palco variavel isso o
         tornaria variavel tambem. Ele passa a garantir uma FAIXA DE CAMERA
         sempre visivel — que e exatamente o que o item 3 pede ("a parte
         superior da camera devera continuar visivel") e o item 9 reforca
         ("a camera deve continuar reconhecivel"). 98px e o topo do palco
         (10 do slot + 44 da barra + 10 de respiro + 34 do cabecalho). */
      --fone-camera-cab: clamp(34.32px, 2.42cqi, 57.2px);
      --fone-camera-min: 200px;
      /* O teto quase nunca morde: o palco cresce apenas ate ocupar a sobra, e
         em cinco comodos a faixa ja consome tudo. Ele existe para a Cozinha,
         que nao tem cortina — com 62dvh sobravam 77px mortos ali. Em 72dvh a
         Cozinha fecha tambem, e o teto so voltaria a valer numa tela muito
         alta, onde uma camera sem limite ficaria desproporcional. */
      /* ANTERIOR (rollback pos-device): a camera crescia ate 72dvh e a folha
         reservava 298px. No aparelho isso transformou o palco 16:9 em um bloco
         quase quadrado. A camera volta a ter proporcao propria; esta reserva
         serve apenas para manter uma faixa reconhecivel dela quando a folha
         precisa subir. */
      --fone-camera-max: none;
      --fone-camera-visivel: clamp(160px, 26dvh, 220px);
      --fone-reserva: calc(78px + var(--fone-camera-visivel));
      --fone-gap: 10px;
      --fone-hit-min: 44px;
      --fone-raio: var(--bruno-liquid-card-radius, 20px);
      /* A folha do telefone usa os tokens visuais exatos do VisionOS inclusive
         quando o tema Josh esta ativo. O escopo termina neste media query; os
         materiais globais e o tablet continuam intocados. */
      --fone-folha-vision-background:
        radial-gradient(360px 240px at 18% -10%, rgba(255, 255, 255, 0.105), transparent 64%),
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.060),
          rgba(255, 255, 255, 0.018) 48%,
          rgba(0, 0, 0, 0.035)
        ),
        rgba(0, 0, 0, 0.300);
      --fone-folha-vision-filter: blur(20px) saturate(1.18) brightness(1.03);
      /* ANTERIOR (rollback rev. faixa-de-tiles): --fone-fechar-h: 54px;
         Era a altura da barra "Concluir". A barra saiu (item 12 do roteiro:
         fechar deixou de ser etapa de formulario) e o valor passou a ser so o
         respiro inferior da folha. */
      --fone-fechar-h: 18px;

      /* ── A FAIXA DE CONTROLES (rev. faixa-de-tiles) ────────────────────────
         Cortina, Iluminacao, Hub e A/C deixam de ser quatro cards e passam a
         ser um PLANO CONTINUO, na mesma linguagem da faixa de tiles da Home.
         Cortina e launchers usam o mesmo gradiente HORIZONTAL: as vinhetas
         laterais se repetem sem criar emenda vertical entre os dois elementos
         irmaos. Os filetes leem os tokens da faixa da Home. */
      --fone-faixa-scrim:
        radial-gradient(105% 120px at 7% 50%, rgba(132, 88, 52, 0.09), transparent 62%),
        radial-gradient(105% 120px at 93% 50%, rgba(65, 104, 132, 0.075), transparent 62%),
        linear-gradient(
          90deg,
          rgba(8, 11, 17, 0) 0%,
          rgba(8, 11, 17, 0.15) 7%,
          rgba(8, 11, 17, 0.24) 18%,
          rgba(8, 11, 17, 0.24) 82%,
          rgba(8, 11, 17, 0.15) 93%,
          rgba(8, 11, 17, 0) 100%
        );
      --fone-faixa-filete: rgba(255, 255, 255, 0.085);
      --fone-faixa-divisor: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.055) 9%,
        rgba(255, 255, 255, 0.105) 50%,
        rgba(255, 255, 255, 0.055) 91%,
        rgba(255, 255, 255, 0) 100%
      );
      --fone-faixa-borda: var(
        --bruno-strip-frame-top-line,
        linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.16) 20%,
          rgba(255, 255, 255, 0.34) 50%,
          rgba(255, 255, 255, 0.16) 80%,
          rgba(255, 255, 255, 0) 100%
        )
      );
      /* Blur no elemento inteiro sempre revela uma caixa retangular. O fade
         lateral vem apenas da pintura, que chega a alpha zero sem apagar o
         conteudo ou reduzir a area de toque. */
      --fone-faixa-blur: none;

      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      height: auto;
      /* ANTERIOR (rollback rev. faixa-de-tiles): min-height: 100%;
         A porcentagem NAO resolvia. A cadeia e host (height:auto) -> main, e
         min-height percentual so resolve contra pai de altura DEFINIDA — entao
         computava como "auto" e o main ficava do tamanho do conteudo. Enquanto
         tudo tinha tamanho fixo isso nao aparecia; ao pedir que a camera
         crescesse para ocupar a sobra, nao havia sobra nenhuma para distribuir
         e ela caiu no piso (medido: 234px, o minimo).
         O valor abaixo e explicito: a altura da tela menos o dock (a shell
         publica --bruno-dock-h, que ela MEDE) menos o padding do slot (10 em
         cima, 6 embaixo). */
      min-height: calc(100dvh - var(--bruno-dock-h, 74px) - 16px);
      /* ANTERIOR (rollback rev. faixa-de-tiles): gap: var(--fone-gap);
         O gap uniforme separava TODOS os modulos, inclusive os que agora
         precisam encostar para formar um plano so. O respiro passa a ser
         declarado por modulo, em margin — ver a secao 2. */
      gap: 0;
      padding: 0;
      background: transparent;
      overflow: visible;
    }

    /* A FAIXA DO TEMA NÃO EXISTE NO TELEFONE.
       O material do Josh desenha a faixa inferior como "main::before" e a
       posiciona pelo GRID (grid-row: 2 / -1), atrás da linha de tiles. Aqui o
       main é FLEX — grid-row não significa nada e o pseudo-elemento vira o
       PRIMEIRO item do flex, com os 320px de --ac-h. Foi exatamente isso que
       empurrou a barra de status de 10px para 340px no aparelho.
       O "::after" acompanha por precaução: a composição do telefone não tem
       faixa nenhuma para desenhar. */
    :host([data-room]) .room-subview::before,
    :host([data-room]) .room-subview::after {
      content: none;
      display: none;
    }

    /* Os containers do tablet somem do FLUXO, não da tela: "contents" faz os
       filhos virarem itens diretos do flex, que é onde "order" atua. Era esta
       declaração que faltava para ".right-column" no bloco "[data-tvhub]", e
       por isso as luzes e o A/C subiam para o topo na Sala. */
    :host([data-room]) .room-subview .content-left,
    :host([data-room]) .room-subview .cams-media-row,
    :host([data-room]) .room-subview .right-column,
    :host([data-room]) .room-subview .hero-panel,
    :host([data-room]) .room-subview .hero-stage,
    :host([data-room]) .room-subview .hero-content {
      display: contents;
    }

    /* A foto do cômodo não existe no telefone: quem manda é a câmera ao vivo.
       "contents" acima já apaga a foto (o elemento deixa de gerar caixa, e com
       ela o background) e preserva a cortina, que morava dentro. */
    :host([data-room]) .room-subview .hero-panel.is-unconfigured,
    :host([data-room]) .room-subview .subview-footer,
    :host([data-room]) .room-subview .subview-topbar,
    :host([data-room]) .room-subview .room-sidebar,
    :host([data-room]) .room-subview .lights-zone-rail {
      display: none;
    }

    /* ══ 2. ORDEM ═══════════════════════════════════════════════════════════ */

    :host([data-room]) .room-subview .subview-topband { order: 0; }
    :host([data-room]) .room-subview .curtain-dock    { order: 20; }
    :host([data-room]) .room-subview .resumo-telefone { order: 30; }

    /* O respiro que o gap dava, agora declarado onde ele deve existir: DEPOIS
       da barra de status e DEPOIS da camera. Entre a cortina e as linhas nao
       ha respiro nenhum — e ali que a faixa continua se forma. */
    :host([data-room]) .room-subview .subview-topband { margin-bottom: var(--fone-gap); }
    :host([data-room]) .room-subview .cameras-card,
    :host([data-room]) .room-subview .cameras-card.cameras-card-controls {
      margin-bottom: var(--fone-gap);
    }

    /* A câmera precisa da classe composta: a sobreposição da Cozinha escreve
       ".cameras-card.cameras-card-controls" com order 40, e (0,5,0) venceria os
       (0,4,0) daqui — foi o que colocou o resumo antes da câmera na primeira
       medição. Com a mesma composta, empata em especificidade e vence por
       posição, como todo o resto deste arquivo. */
    :host([data-room]) .room-subview .cameras-card,
    :host([data-room]) .room-subview .cameras-card.cameras-card-controls {
      order: 10;
    }

    /* ══ 3. BARRA DE STATUS ═════════════════════════════════════════════════ */
    /* Rolagem horizontal real, no mesmo padrão do bruno-top-badges-card da
       Home. As badges que o bloco antigo escondia (Presença, Roteador, Zigbee)
       voltam: agora são alcançáveis arrastando. */

    :host([data-room]) .room-subview .subview-topband {
      width: 100%;
      /* PLANO B (2026-08-15): a faixa continua reservando os mesmos 36,32px
         no fluxo. Somente o plano visual interno cresce para os 48px da Home;
         portanto câmera, tiles, folhas e rail não perdem um único pixel. */
      position: relative;
      height: 36.32px;
      min-height: 36.32px;
      display: block;
      overflow: visible;
    }
    :host([data-room]) .room-subview .topband-badges {
      position: absolute;
      top: -5.84px;
      left: 0;
      width: 100%;
      height: 48px;
      max-width: 100%;
      display: flex;
      align-items: center;
      /* ANTERIOR (rollback rev. faixa-de-tiles): gap: 6px;
         Com gap, o filete divisor de cada badge (border-left, herdado do
         tablet) descolava do conteudo e a barra lia como uma fileira de
         cartoezinhos. Em zero, as badges encostam e os filetes viram o
         divisor vertical de um plano continuo — que e o que o item 2 do
         roteiro pede e o que a barra do tablet ja faz. */
      gap: 0;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
      touch-action: pan-x;
      padding: 0 1px 2px;
    }
    :host([data-room]) .room-subview .topband-badges::-webkit-scrollbar {
      display: none;
    }
    :host([data-room]) .room-subview .tb-badge,
    :host([data-room]) .room-subview .tb-badge[data-phone-hide] {
      /* NOVO (2026-08-13) — quatro tiles completos por pagina, como na Home.
         ANTERIOR (rollback): flex: 0 0 auto; e padding horizontal de 9.36px.
         A largura por conteudo exibia parte do quinto status. Cada tile passa
         a ocupar exatamente um quarto da faixa; os demais seguem acessiveis
         pelo mesmo scroll horizontal. Restrito ao breakpoint phone. */
      flex: 0 0 25%;
      width: 25%;
      max-width: 25%;
      box-sizing: border-box;
      min-width: 0;
      height: 46px;
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr);
      column-gap: 9px;
      padding: 0 clamp(7px, 2.5vw, 12px);
      touch-action: pan-x;
    }
    :host([data-room]) .room-subview .tb-badge-icon {
      width: 22px;
      height: 22px;
    }
    :host([data-room]) .room-subview .tb-badge-icon bruno-icon { --mdc-icon-size: 18px; }
    :host([data-room]) .room-subview .tb-badge-title { font-size: 10px; }
    :host([data-room]) .room-subview .tb-badge-sub { font-size: 11px; }
    :host([data-room]) .room-subview .tb-badge-sub { max-width: 100%; }
    /* A palavra "Temperatura" terminava a apenas 1,47px do filete no viewport
       de referencia (428px). O terceiro tile continua com exatamente 25% da
       faixa; apenas redistribui 5,7px internos para preservar o respiro sem
       alterar tipografia, altura ou os demais status. */
    :host([data-room]) .room-subview .tb-badge:nth-child(3) {
      column-gap: 6px;
      padding-inline: 8px;
    }
    :host([data-room]) .room-subview .topband-clock { display: none; }

    /* ══ 4. CÂMERA ══════════════════════════════════════════════════════════ */
    /* Mesmos valores do bloco [data-tvhub], que já estavam calibrados — muda
       só a ordem e o fato de valerem nos SEIS cômodos. */

    /* ANTERIOR (rollback rev. faixa-de-tiles): o palco era
         clamp(clamp(171.6px, 12.09cqi, 286px), 58vw, clamp(280.8px, 19.78cqi, 468px))
       — 248px a 428 de largura, sem flex. A camera ocupava 30% da tela.

       "flex: 1 0 auto" e deliberado: cresce para tomar a sobra, mas NAO encolhe.
       Com shrink ligado, um comodo de faixa alta espremeria justamente o
       elemento que o item 3 manda preservar; sem shrink, quem cede e a rolagem
       do proprio conteudo, que ja existe. */
    :host([data-room]) .room-subview .cameras-card,
    :host([data-room]) .room-subview .cameras-card.cameras-card-controls {
      --fone-camera-card-gap: clamp(10px, 2.8cqi, 14px);
      --fone-camera-pip-inset: clamp(8px, 2.4cqi, 12px);
      width: 100%;
      height: auto;
      min-height: 0;
      /* ANTERIOR (rollback pos-device): flex: 1 0 auto distribuia toda a
         sobra vertical para a camera e a deixava quase quadrada. */
      flex: 0 0 auto;
      max-height: none;
      grid-template-rows: auto auto;
      /* ANTERIOR (rollback pos-device): z-index 8 so era aplicado com a folha
         aberta. A troca de camada alterava a composicao aparente do topo da
         camera no WebView. A camada agora e estavel nos dois estados. */
      position: relative;
      z-index: 8;
      isolation: isolate;
    }
    /* No tablet o material Josh usa a cartela compartilhada de main::before.
       Esse plano e deliberadamente desligado no telefone; portanto a camera
       recupera a propria cartela SOMENTE aqui. A especificidade e os
       !important vencem a folha de material injetada depois deste CSS. */
    :host([data-bruno-subview-surface-theme='josh'][data-room])
      .room-subview .glass-card.cameras-card.cameras-card-controls {
      background: var(--bruno-josh-subview-surface-background,
        var(--bruno-liquid-surface-off-background, rgba(22, 18, 16, 0.42))) !important;
      backdrop-filter: var(--bruno-josh-subview-surface-filter,
        blur(20px) saturate(1.08)) !important;
      -webkit-backdrop-filter: var(--bruno-josh-subview-surface-filter,
        blur(20px) saturate(1.08)) !important;
      border: var(--bruno-josh-subview-surface-border,
        var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13))) !important;
      border-radius: var(--bruno-liquid-card-radius, 20px) !important;
      box-shadow: var(--bruno-josh-subview-surface-shadow,
        var(--bruno-liquid-surface-off-shadow, 0 14px 32px rgba(0,0,0,0.24))) !important;
      overflow: hidden;
    }
    :host([data-room]) .room-subview .cameras-head {
      position: relative;
      z-index: 2;
      /* O material Josh e injetado depois e fixa o cabecalho em 34px. Estes
         importantes sao locais ao breakpoint e preservam a zona segura entre
         a borda superior do card e icone/titulo quando a folha esta aberta. */
      height: auto !important;
      min-height: 44px !important;
      padding: 8px 12px 6px !important;
      box-sizing: border-box;
    }
    /* Sala era a unica subview que herdava do bloco legado data-tvhub uma area
       de 34,32px para o menu da camera. Office e Quartos ficavam em 23,39px;
       ao abrir o Hub, a regra generica de .mh-menu os inflava para 34,32px e o
       cabecalho saltava de 44px para 48,31px. Todas as subviews passam a usar a
       geometria estavel da Sala nos dois estados. */
    :host([data-room]) .room-subview .camera-settings-button {
      flex: 0 0 auto;
      width: clamp(34.32px, 2.42cqi, 57.2px);
      height: clamp(34.32px, 2.42cqi, 57.2px);
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }
    /* O ":not(.camera-pip-feed)" é obrigatório: o PIP da Varanda carrega
       "camera-feed camera-pip-feed". Sem a exclusão, o "height: 100%" daqui
       (0,4,0) vencia o tamanho do PIP (0,1,0) e ele virava uma tira estreita
       da altura inteira do palco — foi o "PIP com muita altura" do aparelho. */
    :host([data-room]) .room-subview .camera-pip-stage {
      min-height: 0;
      height: auto;
      /* O feed conserva 16:9; o palco acrescenta o respiro inferior. Assim o
      frame cresce alguns pixels sem reduzir a imagem. */
      aspect-ratio: auto;
      padding: 0 var(--fone-camera-card-gap) var(--fone-camera-card-gap);
    }
    :host([data-room]) .room-subview .camera-feed:not(.camera-pip-feed) {
      min-height: 0;
      height: auto;
      aspect-ratio: 16 / 9;
    }
    /* Miniatura com proporção de câmera, ancorada no canto. */
    :host([data-room]) .room-subview .camera-pip-feed {
      width: min(34%, 124px);
      height: auto;
      /* ANTERIOR (rollback pos-device): 4 / 3. No aparelho a miniatura ficou
         visualmente quadrada; 3 / 2 reduz apenas a altura, sem perder largura. */
      aspect-ratio: 3 / 2;
      right: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
      bottom: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
    }
    /* Sala e Cozinha sao as composicoes com PIP. Esta regra vence as
       sobreposicoes legadas sem tocar no breakpoint de tablet. */
    :host([data-room='sala']) .room-subview .camera-pip-feed,
    :host([data-room='cozinha']) .room-subview .camera-pip-feed {
      right: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
      bottom: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
    }
    :host([data-room]) .room-subview .camera-control {
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }
    :host([data-room]) .room-subview .camera-list { grid-template-columns: 1fr; }

    /* ══ 5. CORTINA ═════════════════════════════════════════════════════════ */
    /* Era um overlay sobre a foto — ".curtain-overlay" zera fundo e borda com
       !important, então recuperá-los aqui também exige !important. É o único
       lugar deste arquivo que precisa disso, e o motivo está registrado.

       rev. faixa-de-tiles: a cortina deixou de ser CARD e virou o primeiro
       trecho da faixa continua. Ela mantem todos os controles diretos (titulo,
       estado, percentual, Abrir/Parar/Fechar, slider e marcacoes) — o que saiu
       foi a moldura externa: raio, borda e sombra.

       ANTERIOR (rollback rev. faixa-de-tiles) — a versao em card:
         border-radius: var(--fone-raio) !important;
         background: var(--bruno-liquid-surface-off-background,
                          rgba(255,255,255,0.062)) !important;
         border: var(--bruno-liquid-surface-off-border,
                     1px solid rgba(255,255,255,0.105)) !important;
         box-shadow: var(--bruno-liquid-surface-off-shadow, none) !important;
         backdrop-filter: var(--bruno-liquid-surface-off-filter, none) !important;
         .curtain-control-row -> grid-template-columns: minmax(0, 1fr)
                                 (identidade, estado e botoes em tres linhas)
         .curtain-status       -> justify-self: start                            */

    :host([data-room]) .room-subview .curtain-dock {
      grid-row: auto;
      grid-column: auto;
      align-self: stretch;
      width: 100% !important;
      max-width: 100% !important;
      display: grid;
      grid-template-columns: 1fr;
      gap: clamp(9px, 0.63cqi, 15px);
      padding: 14px clamp(10.92px, 0.77cqi, 18.2px) 16px !important;
      /* O plano: sem raio, sem borda, sem sombra. So o scrim e o filete que
         abre a faixa. */
      border-radius: 0 !important;
      background: var(--fone-faixa-scrim) !important;
      border: 0 !important;
      box-shadow: none !important;
      backdrop-filter: var(--fone-faixa-blur) !important;
      -webkit-backdrop-filter: var(--fone-faixa-blur) !important;
      position: relative;
    }
    /* Filete SUPERIOR da faixa. Pseudo-elemento, e nao border-top, porque o
       token do tema e um gradiente horizontal (some nas pontas) e border nao
       aceita gradiente. */
    :host([data-room]) .room-subview .curtain-dock::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: var(--fone-faixa-borda);
      pointer-events: none;
    }

    /* Linha 1: titulo a esquerda, estado a direita. Linha 2: os tres botoes,
       ocupando a largura toda. O slider fica fora desta grade, na linha 3 do
       proprio dock. E o desenho do item 5 do roteiro. */
    :host([data-room]) .room-subview .curtain-control-row {
      align-items: center;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px clamp(7.8px, 0.55cqi, 13px);
    }
    :host([data-room]) .room-subview .curtain-status {
      justify-self: end;
      grid-column: 2;
      grid-row: 1;
    }
    :host([data-room]) .room-subview .curtain-main-actions {
      grid-column: 1 / -1;
      width: 100%;
      justify-content: stretch;
    }
    :host([data-room]) .room-subview .curtain-action-button {
      flex: 1 1 0;
      min-width: 0;
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }
    /* Iconografia fina: o anel do icone da cortina era mais uma moldura dentro
       da faixa. Vira glifo. */
    :host([data-room]) .room-subview .curtain-icon-shell {
      width: 22px;
      height: 22px;
      background: none;
      border: 0;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      color: rgba(255, 255, 255, 0.62);
    }

    /* ══ 6. LINHAS-RESUMO ═══════════════════════════════════════════════════ */

    /* ANTERIOR (rollback rev. faixa-de-tiles) — cada linha era um CARD:
         .resumo-telefone -> gap: var(--fone-gap)
         .resumo-linha    -> border-radius: var(--fone-raio);
                             background: --bruno-liquid-surface-off-background;
                             border: --bruno-liquid-surface-off-border;
                             box-shadow / backdrop-filter do mesmo pacote.
       Agora sao trechos do mesmo plano da cortina: fundo unico, sem raio, sem
       borda; o que separa um modulo do outro e um filete horizontal. */
    :host([data-room]) .room-subview .resumo-telefone {
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 100%;
      position: relative;
      background: var(--fone-faixa-scrim);
      backdrop-filter: var(--fone-faixa-blur);
      -webkit-backdrop-filter: var(--fone-faixa-blur);
    }
    /* Filete INFERIOR: fecha a faixa. Mesmo motivo do ::before da cortina. */
    :host([data-room]) .room-subview .resumo-telefone::after {
      content: '';
      position: absolute;
      inset: auto 0 0 0;
      height: 1px;
      background: var(--fone-faixa-borda);
      pointer-events: none;
    }
    :host([data-room]) .room-subview .resumo-linha {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr) auto;
      align-items: center;
      gap: clamp(9.36px, 0.66cqi, 15.6px);
      width: 100%;
      min-height: 58px;
      padding: 0 clamp(10.92px, 0.77cqi, 18.2px);
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      color: var(--text-main, rgba(248, 251, 255, 0.94));
      font: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 150ms ease;
      position: relative;
    }
    /* Divisor atmosferico: desaparece nas extremidades em vez de recortar a
       faixa com uma linha rigida. A primeira linha separa a cortina dos
       launchers; as demais mantem o mesmo ritmo vertical. */
    :host([data-room]) .room-subview .resumo-linha::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: var(--fone-faixa-divisor);
      pointer-events: none;
    }
    /* Feedback de toque curto (item 7 do roteiro: 120-180ms), com o acento do
       proprio modulo — a cor vem do --tone que o tom do icone ja carrega. */
    :host([data-room]) .room-subview .resumo-linha:active {
      background: rgba(255, 255, 255, 0.06);
      transition-duration: 120ms;
    }
    :host([data-room]) .room-subview .resumo-linha:focus-visible {
      outline: 2px solid rgba(120, 178, 245, 0.85);
      outline-offset: -2px;
    }
    /* Iconografia fina: sem anel, so o glifo — igual a cortina. */
    :host([data-room]) .room-subview .resumo-linha .micro-icon {
      width: 24px;
      height: 24px;
      background: none;
      border: 0;
      box-shadow: none;
    }
    :host([data-room]) .room-subview .resumo-linha .micro-icon bruno-icon {
      --mdc-icon-size: 21px;
    }
    :host([data-room]) .room-subview .resumo-texto {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    :host([data-room]) .room-subview .resumo-titulo {
      font-size: 14.8px;
      font-weight: 700;
      line-height: 1.12;
    }
    :host([data-room]) .room-subview .resumo-estado {
      font-size: 12px;
      font-weight: 500;
      line-height: 1.15;
      color: var(--text-soft, rgba(255, 255, 255, 0.52));
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* ANTERIOR (rollback rev. faixa-de-tiles): o chevron era "mdi:chevron-up"
       girado 180deg (apontando para baixo) e desgirava quando ativo. Virou o
       chevron DISCRETO apontando para a direita do item 6 do roteiro — ele
       indica "abre um segundo nivel", nao "expande aqui". */
    :host([data-room]) .room-subview .resumo-chevron {
      width: 20px;
      height: 20px;
      display: grid;
      place-items: center;
      color: rgba(255, 255, 255, 0.34);
      transform: none;
      transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), color 180ms ease;
    }
    :host([data-room]) .room-subview .resumo-chevron bruno-icon {
      --mdc-icon-size: 19px;
    }
    :host([data-room]) .room-subview .resumo-linha.is-active .resumo-chevron {
      transform: rotate(90deg);
      color: rgba(255, 255, 255, 0.62);
    }

    /* ══ 7. A FOLHA ═════════════════════════════════════════════════════════ */
    /* Fora do telefone estes quatro módulos ficam no fluxo, como sempre. Aqui
       eles só existem quando a linha correspondente é tocada. */

    :host([data-room]) .room-subview .glass-card.lights-card,
    :host([data-room]) .room-subview .glass-card.ac-card,
    :host([data-room]) .room-subview .glass-card.media-hub-card,
    :host([data-room]) .room-subview .glass-card.appliances-card {
      display: none;
    }

    /* Cada módulo volta com o display que ELE usa — "flex" para todos quebraria
       o grid interno do A/C e do hub. */
    :host([data-folha='luzes']) .room-subview .glass-card.lights-card { display: flex; }
    :host([data-folha='ac']) .room-subview .glass-card.ac-card { display: grid; }
    :host([data-folha='midia']) .room-subview .glass-card.media-hub-card { display: grid; }
    :host([data-folha='eletro']) .room-subview .glass-card.appliances-card { display: block; }

    /* O ".glass-card" no seletor NÃO é decorativo: é especificidade.
       O material do Josh declara
         :host([data-bruno-subview-surface-theme="josh"]) .glass-card.ac-card
       com position: relative — (0,4,0), o mesmo peso que este bloco tinha, e
       injetado DEPOIS em adoptedStyleSheets. Empate resolvido por posição: o
       material vencia e só a folha de luzes (que não está naquela lista)
       chegava a ser fixed. Medido: A/C, mídia e eletrodomésticos ficavam
       relative e apareciam no meio do fluxo. Com a classe composta são
       (0,5,0). */
    :host([data-folha]) .room-subview .glass-card.lights-card,
    :host([data-folha]) .room-subview .glass-card.ac-card,
    :host([data-folha]) .room-subview .glass-card.media-hub-card,
    :host([data-folha]) .room-subview .glass-card.appliances-card {
      position: fixed;
      left: 0;
      right: 0;
      /* A folha PARA em cima do dock, não por baixo dele.
         No telefone a shell dá z-index 2 ao rail-slot e 1 ao content-slot. A
         folha vive dentro do content-slot, então nenhum z-index daqui a coloca
         sobre o dock — a pilha é decidida um nível acima. Tentar cobrir o dock
         dá o que apareceu no aparelho: as últimas linhas da folha escondidas
         atrás dele. Parando acima, o dock continua aceso e utilizável.
         A altura vem da shell ("--bruno-dock-h"), que é quem a conhece. */
      /* ANTERIOR (rollback antes da rail persistente): a folha subia da borda
         inferior e cobria o dock. A shell elevava o slot de conteudo para isso.
         A decisao atual prioriza rail sempre visivel e controles sem sobreposicao. */
      /* ANTERIOR (rollback rail persistente): bottom: 0. A folha cobria a rail e
         os ultimos controles ficavam na mesma regiao de toque. A rail agora
         permanece visivel, e a folha termina imediatamente acima dela. */
      /* REV. mobile final: a folha pinta ate a borda inferior e passa por tras
         da rail. O padding inferior reserva a area de toque do dock, mantendo
         os controles acima dele sem criar uma segunda superficie. */
      bottom: 0;
      z-index: 9;
      width: auto;
      height: max-content;
      margin: 0;
      /* ANTERIOR (rollback rev. faixa-de-tiles):
           min-height: min(52dvh, 420px);
           border-radius: 26px 26px 0 0;
           padding-top: 22px;
           box-shadow: 0 -28px 56px -18px rgba(0,0,0,0.85);
         O piso equalizava ARTIFICIALMENTE a altura das tres folhas — o item 10
         do roteiro proibe isso: a altura tem de sair do conteudo. O raio de
         26px e a sombra de 56px eram o que fazia a folha ler como card grande
         flutuando por cima, e nao como extensao inferior da subview (item 8).
         Sem o piso, o teto passa a ser o unico limite. */
      min-height: 0;
      max-height: calc(100vh - var(--fone-folha-top, var(--fone-reserva)));
      max-height: calc(100dvh - var(--fone-folha-top, var(--fone-reserva)));
      overflow-y: auto;
      overscroll-behavior: contain;
      border-radius: 18px 18px 0 0;
      padding: 18px clamp(10.92px, 0.77cqi, 18.2px)
        calc(10px + var(--bruno-dock-h, 74px));
      /* ANTERIOR (rollback pos-device): o padding inferior somava novamente
         env(safe-area-inset-bottom). A altura medida do dock ja inclui essa
         area no iPhone, portanto a soma duplicada criava o vazio que nao
         aparecia no navegador de PC. */
      background: var(--fone-folha-vision-background) !important;
      backdrop-filter: var(--fone-folha-vision-filter) !important;
      -webkit-backdrop-filter: var(--fone-folha-vision-filter) !important;
      /* Sombra so o suficiente para descolar da faixa; sem borda e sem glow. */
      box-shadow: 0 -14px 30px -20px rgba(0, 0, 0, 0.7);
      border: 0;
      /* A transicao da abertura. "translateY" e barato e nao remede layout.
         O fill-mode e "backwards", NAO "both": com "both" o valor final da
         animacao (translateY(0)) continua aplicado depois que ela termina e
         VENCE o transform inline — e o arrasto para fechar escreve exatamente
         em transform inline. Com "backwards" a animacao solta a propriedade ao
         terminar e o arrasto funciona. */
      align-content: start;
      animation: fone-folha-sobe 280ms cubic-bezier(0.18, 0.86, 0.24, 1) backwards;
      touch-action: pan-y;
    }

    @keyframes fone-folha-sobe {
      from { transform: translateY(100%); opacity: 0.82; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    /* ANTERIOR (rollback refinamento mobile): zerar o estado escondia a folha
       sem transicao. O host agora conserva data-folha por 280ms e acrescenta
       data-folha-saindo, exclusivamente abaixo do breakpoint de telefone. */
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.lights-card,
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.ac-card,
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.media-hub-card,
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.appliances-card {
      animation: fone-folha-desce 280ms cubic-bezier(0.42, 0, 0.78, 0.18) forwards;
      pointer-events: none;
    }

    @keyframes fone-folha-desce {
      from { transform: translateY(0); opacity: 1; }
      to   { transform: translateY(100%); opacity: 0.82; }
    }

    /* A alça: dica visual de que a folha se fecha arrastando ou tocando fora. */
    :host([data-folha]) .room-subview .glass-card.lights-card::after,
    :host([data-folha]) .room-subview .glass-card.ac-card::after,
    :host([data-folha]) .room-subview .glass-card.media-hub-card::after,
    :host([data-folha]) .room-subview .glass-card.appliances-card::after {
      content: '';
      position: absolute;
      inset: 7px auto auto 50%;
      transform: translateX(-50%);
      /* Menor e mais discreta que a anterior (42x4 / 0.28): o item 11 pede que
         a alca nao chame atencao. */
      width: 34px;
      height: 3px;
      padding: 0;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.20);
      z-index: 2;
      pointer-events: none;
    }

    /* Dentro da folha o corpo das luzes rola sozinho, sem teto herdado. */
    :host([data-folha='luzes']) .room-subview .lights-zones,
    :host([data-folha='luzes']) .room-subview .zone-lights,
    :host([data-folha='luzes']) .room-subview .office-light-list {
      flex: 0 0 auto;
      max-height: none !important;
      overflow-y: visible !important;
      overscroll-behavior: auto;
    }
    :host([data-folha='luzes']) .room-subview .lights-body { grid-template-rows: 1fr; }

    /* ── 7a. CABEÇALHO DAS FOLHAS (item 11) ───────────────────────────────────
       Compacto e numa linha so: icone + titulo a esquerda, acoes globais a
       direita. O respiro de cima ja e do padding da folha (16px), que abriga a
       alca — o cabecalho nao precisa de altura propria para decoracao.

       ANTERIOR (rollback rev. faixa-de-tiles): as regras deste trecho miravam
       ".lights-card .module-head", ".head-actions" e ".zone-header". NENHUMA
       dessas classes existe no markup atual (o dock usa ".lights-dock",
       ".lights-dock-actions" e ".section-head"), entao as regras eram letra
       morta e o cabecalho da folha de luzes seguia com a geometria do tablet.
       Os nomes abaixo saem do markup renderizado. */
    :host([data-folha]) .room-subview .lights-dock,
    :host([data-folha]) .room-subview .mh-head,
    :host([data-folha]) .room-subview .ac-lean-head {
      min-height: 0;
      height: auto;
      padding: 0 2px 12px;
      gap: 10px;
    }
    /* Filete abaixo do cabecalho — mesmo divisor da faixa, para o segundo nivel
       falar a mesma lingua do primeiro. */
    :host([data-folha]) .room-subview .lights-card.is-open .lights-dock,
    :host([data-folha]) .room-subview .mh-head,
    :host([data-folha]) .room-subview .ac-lean-head {
      border-bottom: 1px solid var(--fone-faixa-filete);
    }
    /* Dentro da folha o titulo NAO alterna nada: a folha ja esta aberta. O
       chevron do dock de luzes so confundiria. */
    :host([data-folha='luzes']) .room-subview .lights-dock-chevron { display: none; }
    :host([data-folha]) .room-subview .lights-dock .micro-icon,
    :host([data-folha]) .room-subview .mh-head .micro-icon,
    :host([data-folha]) .room-subview .ac-lean-head .micro-icon {
      width: 24px;
      height: 24px;
      background: none;
      border: 0;
      box-shadow: none;
    }
    /* O titulo empurra: com o X entrando como TERCEIRO filho, o
       "justify-content: space-between" herdado do tablet jogaria o botao do
       meio para o centro. Com o titulo crescendo, os dois botoes ficam colados
       na direita, separados pelo gap do cabecalho. */
    :host([data-folha]) .room-subview .mh-head > .mh-head-title,
    :host([data-folha]) .room-subview .ac-lean-head > .ac-head-title,
    :host([data-folha]) .room-subview .appliances-head > .mh-head-title {
      flex: 1 1 auto;
      min-width: 0;
    }
    :host([data-folha]) .room-subview .lights-dock-actions {
      flex: 0 0 auto;
      gap: 6px;
    }
    :host([data-folha]) .room-subview .lights-dock-actions .chip-button {
      min-height: 32px;
      min-width: 0;
    }

    /* ── 7b. FOLHA DE ILUMINAÇÃO (item 13) ────────────────────────────────── */
    /* Quem rola e a GRADE, nao a folha: o cabecalho fica parado, que e o que o
       item 10 pede quando o conteudo passa do limite.

       ANTERIOR (rollback rev. faixa-de-tiles) — eu havia escrito aqui
         max-height: none; overflow: visible;
       para "soltar" a lista. Isso quebrou a rolagem: ".lights-body-clip"
       recorta o excedente, entao o conteudo nao aumentava o scrollHeight da
       folha e as ultimas luzes sumiam sem que nada rolasse. Medido no banco:
       a 7a celula da Sala terminava 12,5px abaixo da base da folha, com
       scrollHeight == clientHeight. A base ja fazia certo (max-height: 100% +
       overflow-y: auto) — o override era o defeito. */
    :host([data-folha='luzes']) .room-subview .lights-scroll {
      padding: 12px 0 0;
    }
    :host([data-folha='luzes']) .room-subview .light-grid {
      width: 100%;
      margin-inline: 0;
      gap: 0;
    }
    /* Cada luz deixa de ser um cartao com contorno completo: fica so o filete
       que separa as celulas, como no plano da faixa. */
    :host([data-folha='luzes']) .room-subview .light-cell {
      border: 0;
      border-radius: 0;
      background: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-shadow: none;
      min-height: 56px;
      border-top: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='luzes']) .room-subview .light-cell.has-rule-left {
      border-left: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='luzes']) .room-subview .section-head {
      padding: 12px 2px 6px;
    }
    :host([data-folha='luzes']) .room-subview .section-head .zone-off {
      min-height: 30px;
    }

    /* ── 7c. FOLHA DO AR-CONDICIONADO (item 15) ───────────────────────────── */
    /* O anel continua sendo o elemento dominante; Modo/Ventilacao/Swing mantem
       area tatil propria, sem um card externo envolvendo o conjunto. */
    :host([data-folha='ac']) .room-subview .ac-card.ac-card-lean {
      grid-template-rows: auto minmax(clamp(171.6px, 12.09cqi, 286px), auto) auto;
    }
    :host([data-folha='ac']) .room-subview .ac-lean-mid { padding: 10px 0 12px; }
    :host([data-folha='ac']) .room-subview .ac-lean-foot {
      align-items: stretch;
      padding: 0;
      gap: 8px;
    }
    :host([data-folha='ac']) .room-subview .ac-action {
      min-height: clamp(40.56px, 2.86cqi, 67.6px);
    }

    /* ── 7d. FOLHA DO HUB DE MÍDIA (item 14) ──────────────────────────────── */
    /* O conteudo integra a superficie da folha em vez de parecer um card dentro
       dela: as fontes viram trechos separados por filete, sem moldura propria. */
    :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
      grid-template-rows: auto minmax(0, 1fr);
    }
    :host([data-folha='midia']) .room-subview .mh-sources { gap: 0; }
    :host([data-folha='midia']) .room-subview .mh-source-head {
      border-radius: 0;
      background: none;
      border: 0;
      border-top: 1px solid var(--fone-faixa-filete);
      min-height: 54px;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body {
      grid-template-columns: minmax(0, 1fr)
        clamp(clamp(81.12px, 5.71cqi, 135.2px), 30vw, clamp(115.44px, 8.13cqi, 192.4px));
      gap: clamp(6.24px, 0.44cqi, 10.4px);
      padding-inline: 2px;
      border-top: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='midia']) .room-subview .mh-info { padding-left: 0; }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      width: 100%;
      min-width: 0;
    }
    /* ANTERIOR (rollback):
       :host([data-folha='midia']) .room-subview .mh-menu,
       O seletor amplo tambem alcancava .camera-settings-button, porque o botao
       de tres pontos da camera compartilha a classe utilitaria .mh-menu. */
    :host([data-folha='midia']) .room-subview .media-hub-card .mh-menu,
    :host([data-folha='midia']) .room-subview .mh-btn {
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }

    /* ── 7e. FOLHA DE ELETRODOMÉSTICOS (Cozinha) ──────────────────────────── */
    :host([data-folha='eletro']) .room-subview .appliances-grid {
      padding-top: 12px;
    }

    /* -- 7f. CORRECAO POS-DISPOSITIVO: INTERIOR ORIGINAL -------------------
       ANTERIOR (rollback faixa-de-tiles): o primeiro desenho da folha zerava
       raio, fundo, borda e espacos das celulas internas para prolongar a faixa
       fechada para dentro do segundo nivel. O aparelho confirmou que isso
       redesenhava componentes ja consolidados no tablet. As regras abaixo
       restauram a mesma hierarquia interna; somente a caixa externa continua
       sendo adaptada para folha no telefone. */

    :host([data-folha='luzes']) .room-subview .lights-dock {
      min-height: clamp(40.56px, 2.86cqi, 67.6px);
      height: auto;
      padding: 0 clamp(7.8px, 0.55cqi, 13px);
      gap: clamp(9.36px, 0.66cqi, 15.6px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    }
    :host([data-folha='midia']) .room-subview .mh-head,
    :host([data-folha='ac']) .room-subview .ac-lean-head {
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
      height: clamp(34.32px, 2.42cqi, 57.2px);
      padding: 0 clamp(7.8px, 0.55cqi, 13px) 0 clamp(10.92px, 0.77cqi, 18.2px);
      gap: clamp(9.36px, 0.66cqi, 15.6px);
      border-bottom: 0;
    }
    :host([data-folha='luzes']) .room-subview .lights-dock-chevron {
      display: grid;
      transform: none;
    }

    :host([data-folha]) .room-subview .lights-dock .micro-icon,
    :host([data-folha]) .room-subview .mh-head .micro-icon,
    :host([data-folha]) .room-subview .ac-lean-head .micro-icon {
      width: clamp(21.84px, 1.54cqi, 36.4px);
      height: clamp(21.84px, 1.54cqi, 36.4px);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.09);
      border: 1px solid rgba(255, 255, 255, 0.13);
      box-shadow: none;
    }
    :host([data-folha]) .room-subview .micro-icon.tone-amber {
      color: rgb(255, 183, 77);
      background: rgba(255, 183, 77, 0.10);
      border-color: rgba(255, 183, 77, 0.22);
    }
    :host([data-folha]) .room-subview .micro-icon.tone-cyan {
      color: rgb(111, 224, 241);
      background: rgba(111, 224, 241, 0.10);
      border-color: rgba(111, 224, 241, 0.20);
    }

    :host([data-folha='luzes']) .room-subview .glass-card.lights-card {
      padding-left: clamp(20px, 5.6vw, 24px);
      padding-right: clamp(20px, 5.6vw, 24px);
    }
    :host([data-folha='luzes']) .room-subview .lights-dock {
      padding-inline: 0;
    }
    :host([data-folha='luzes']) .room-subview .lights-dock-actions {
      gap: clamp(7px, 2vw, 10px);
      /* Afasta as pills apenas do filete inferior; a altura da folha não muda. */
      transform: translateY(-3px);
    }
    :host([data-folha='luzes']) .room-subview .lights-dock-actions .chip-button {
      min-height: 36px;
    }
    :host([data-folha='luzes']) .room-subview .lights-scroll {
      padding: 12px 0 0;
    }
    :host([data-folha='luzes']) .room-subview .light-grid {
      width: 100%;
      margin-inline: 0;
      gap: clamp(8px, 2vw, 9px);
    }
    :host([data-folha='luzes']) .room-subview .light-cell {
      height: var(--fone-luz-cell-h, clamp(58px, 6.45dvh, 60px));
      min-height: var(--fone-luz-cell-h, clamp(58px, 6.45dvh, 60px));
      padding-inline: clamp(10px, 2.8vw, 12px);
      border: 1px solid rgba(255, 255, 255, 0.105);
      border-color: rgba(255, 255, 255, 0.105);
      border-radius: var(--bruno-subview-cartela-inner-radius, var(--bruno-liquid-control-radius-compact, 12px));
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.060), rgba(255, 255, 255, 0.022));
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
    }
    :host([data-folha='luzes']) .room-subview .light-cell.has-rule-left,
    :host([data-folha='luzes']) .room-subview .light-cell.has-rule-top {
      border-color: rgba(255, 255, 255, 0.105);
    }
    :host([data-folha='luzes']) .room-subview .section-head {
      padding: 0 0 10px;
    }
    :host([data-folha='luzes']) .room-subview .section-head .zone-off {
      min-height: 32px;
    }
    :host([data-folha='luzes']) .room-subview .light-section + .light-section {
      margin-top: 14px;
      padding-top: 14px;
      border-top-color: rgba(255, 255, 255, 0.085);
    }
    :host([data-folha='luzes']) .room-subview .lc-switch {
      width: 34px;
      height: 20px;
      padding-inline: 2px;
    }
    :host([data-folha='luzes']) .room-subview .lc-knob {
      width: 14px;
      height: 14px;
    }
    :host([data-folha='luzes']) .room-subview .light-cell.is-on .lc-knob {
      transform: translateX(14px);
    }

    /* O acordeao conserva uma fonte aberta e outra recolhida, como no tablet.
       No telefone, TV/PC e Spotify compartilham a mesma altura de corpo para a
       folha nao saltar durante a alternancia; o conteudo continua responsivo. */
    :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
      grid-template-rows: auto auto;
      align-content: start;
      --fone-midia-arte: clamp(100px, 29cqi, 110px);
      /* NOVO (2026-08-13) — altura derivada dos elementos, nao de dvh.
         92px = paddings 8 + gap de camadas 4 + transportes/volume 80.
         ANTERIOR (rollback): clamp(226px, 27dvh, 232px). */
      --fone-midia-corpo-altura: calc(var(--fone-midia-arte) + 92px);
      --fone-midia-gap: clamp(10px, 2.8cqi, 12px);
      --fone-midia-padding-x: clamp(12px, 3.4cqi, 16px);
      /* O material da folha continua por tras da rail, mas a reserva extra
         acima do filete cai de 10 para 4px. A altura medida do dock permanece
         intacta. Restrito a folha de midia no telefone. */
      padding-bottom: calc(4px + var(--bruno-dock-h, 74px));
    }
    :host([data-folha='midia']) .room-subview .mh-sources {
      gap: 0;
      /* ANTERIOR (rollback): padding inferior de 10px, que se somava ao
         padding da folha e afastava o ultimo controle do filete da rail. */
      padding: 0 clamp(10px, 2.8vw, 13px);
    }
    :host([data-folha='midia']) .room-subview .mh-source {
      flex: 0 0 44px;
      overflow: visible;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }
    :host([data-folha='midia']) .room-subview .mh-source.is-open {
      flex: 0 0 auto;
      position: relative;
    }
    :host([data-folha='midia']) .room-subview .mh-source + .mh-source.is-open::before {
      content: '';
      position: absolute;
      z-index: 2;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--fone-faixa-filete);
      pointer-events: none;
    }
    :host([data-folha='midia']) .room-subview .mh-source-head {
      min-height: 44px;
      height: 44px;
      align-items: center;
      padding-block: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
    }
    :host([data-folha='midia']) .room-subview .mh-source + .mh-source .mh-source-head {
      border-top: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='midia']) .room-subview .mh-source.is-open .mh-source-head {
      /* NOVO (2026-08-13) — o titulo da fonte aberta pertence ao Now Playing.
         ANTERIOR (rollback): ocupava uma linha propria de 40px antes do corpo.
         Sobreposto apenas a coluna textual, alinha Spotify, TV ou PC ao topo
         da arte e reduz a folha sem comprimir nenhuma area tatil. */
      position: absolute;
      z-index: 3;
      top: 8px;
      left: var(--fone-midia-padding-x);
      right: calc(var(--fone-midia-padding-x) + var(--fone-midia-arte) + var(--fone-midia-gap));
      width: auto;
      height: 30px;
      min-height: 30px;
      padding: 0;
      border-top: 0;
      grid-template-columns: 18px minmax(0, auto);
      justify-content: start;
      gap: 6px;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body {
      /* Now Playing compacto: metadata e arte dividem a primeira camada;
         transportes e volume ocupam a largura toda abaixo dela. */
      height: var(--fone-midia-corpo-altura);
      min-height: var(--fone-midia-corpo-altura);
      box-sizing: border-box;
      position: relative;
      isolation: isolate;
      overflow: hidden;
      grid-template-columns: minmax(0, 1fr) var(--fone-midia-arte);
      grid-template-rows: minmax(var(--fone-midia-arte), 1fr) auto;
      grid-template-areas:
        'info art'
        'controls controls';
      align-items: start;
      align-content: start;
      gap: 4px var(--fone-midia-gap);
      padding: 4px var(--fone-midia-padding-x);
      border-top: 0;
      background: transparent;
      box-shadow: none;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body.has-atmosphere::after {
      /* ANTERIOR (rollback): um gradiente escuro cobria todo o retangulo do
         corpo e o destacava da folha. A atmosfera agora vem somente da arte
         desfocada abaixo, com mascara que desaparece nas quatro extremidades. */
      display: none;
    }
    :host([data-folha='midia']) .room-subview .mh-now-atmosphere {
      /* O elemento ampliado era maior que o corpo; o fade ficava fora do
         recorte e o WebView mostrava exatamente a borda retangular do
         overflow. No telefone o corpo passa a revelar somente o material
         VisionOS da propria folha. A capa nitida continua na coluna de arte.
         ANTERIOR (rollback): imagem 160%, opacity .12, blur 30px e mascara. */
      display: none;
    }
    :host([data-folha='midia']) .room-subview .mh-left {
      display: contents;
    }
    :host([data-folha='midia']) .room-subview .mh-info {
      grid-area: info;
      position: relative;
      z-index: 1;
      padding-left: 0;
      padding-top: 36px;
    }
    :host([data-folha='midia']) .room-subview .mh-progress-wrap {
      width: 100%;
    }
    :host([data-folha='midia']) .room-subview .mh-controls {
      grid-area: controls;
      position: relative;
      z-index: 1;
      width: 100%;
      margin-top: 0;
      gap: 2px;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      width: 100%;
      min-width: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-art {
      grid-area: art;
      position: relative;
      z-index: 1;
      width: 100%;
      height: auto;
      aspect-ratio: 1 / 1;
      align-self: start;
      border-radius: 12px;
    }
    :host([data-folha='midia']) .room-subview .mh-art-wide {
      aspect-ratio: 16 / 9;
      align-self: center;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-art-wide {
      aspect-ratio: 1 / 1;
    }
    :host([data-folha='midia']) .room-subview .mh-art img,
    :host([data-folha='midia']) .room-subview .mh-art-square.is-cover img,
    :host([data-folha='midia']) .room-subview .mh-art-wide.is-cover img {
      inset: 0;
      top: auto;
      left: auto;
      transform: none;
      width: 100%;
      height: 100%;
      aspect-ratio: auto;
      object-fit: contain;
      border-radius: inherit;
    }
    :host([data-folha='midia']) .room-subview .mh-art.is-cover img {
      object-fit: cover;
    }
    :host([data-folha='midia']) .room-subview .mh-art.is-paused img {
      filter: blur(2.8px) brightness(0.78) saturate(0.9);
      transform: scale(1.035);
    }
    /* Standby usa contain sem escala: o PNG inteiro permanece dentro da caixa
       de 100 a 110 px e nunca volta a ser recortado pelo overflow da arte. */
    :host([data-folha='midia']) .room-subview .mh-art.is-standby img {
      object-fit: contain;
      transform: none;
    }
    /* ANTERIOR (rollback): TV e PC usavam a mesma caixa nominal do Echo, mas
       seus PNGs têm mais transparência interna e pareciam menores. Compensação
       exclusivamente óptica e exclusiva do telefone. */
    :host([data-folha='midia']) .room-subview .mh-source-body-tv .mh-art.is-standby img,
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-art.is-standby img {
      transform: scale(1.1);
      transform-origin: center;
    }
    :host([data-folha='midia']) .room-subview .mh-vol {
      order: 2;
      min-height: 34px;
      padding-inline: 2px;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row {
      order: 1;
      gap: 0;
      min-height: 44px;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row-4,
    :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn {
      min-height: 44px;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn:nth-child(2) bruno-icon {
      --mdc-icon-size: 28px;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      order: 1;
      min-height: 46px;
    }
    /* PC desligado usava a grade de tres colunas dos transportes, deixando o
       CTA estreito. TV, PC e Spotify passam a compartilhar a mesma linguagem
       de acao principal em largura total. */
    :host([data-folha='midia']) .room-subview .mh-source-body-pc.is-source-idle .mh-btn-row-3 {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body-pc.is-source-idle .mh-btn-row-3 .mh-btn.is-main {
      width: 100%;
      min-width: 0;
      min-height: 46px;
      padding-inline: 12px;
      border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
      border-radius: var(--bruno-liquid-control-radius-compact, 9px);
      background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
      box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
    }

    /* REV. 2026-08-14 — composicao final do Hub no telefone.
       O corpo anterior somava padding da lista e padding proprio: o icone da
       fonte comecava 13,7px depois do icone do cabecalho, e a arte terminava
       na mesma distancia antes do menu. A lista passa a ocupar o eixo inteiro
       da folha e cada secao usa os mesmos 12px do cabecalho nas duas bordas.

       A estrutura anterior tambem empilhava transportes e volume em toda a
       largura. Ela permanece acima como rollback; as regras abaixo apenas
       recompõem o mesmo DOM em tres zonas no breakpoint de telefone:
       informacao, controles na coluna textual e volume na base. */
    :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
      --fone-midia-eixo-x: 12px;
      --fone-midia-corpo-altura: calc(var(--fone-midia-arte) + 62px);
      --fone-midia-gap: clamp(8px, 2.4cqi, 10px);
      /* Sala herdava este piso do antigo bloco data-tvhub; Office e Quartos
         não. A composição mobile passa a ter a mesma altura estrutural nos
         seis cômodos antes de a ancoragem corrigir qualquer reflow do WebView. */
      height: auto;
      min-height: clamp(257.4px, 18.13cqi, 429px);
      grid-template-rows: auto auto;
    }
    :host([data-folha='midia']) .room-subview .mh-sources {
      padding-inline: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-source,
    :host([data-folha='midia']) .room-subview .mh-source.is-open,
    :host([data-folha='midia']) .room-subview .mh-source-body {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: 0;
      border-radius: 0;
      box-shadow: none !important;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body {
      isolation: auto;
      overflow: visible;
      grid-template-columns: minmax(0, 1fr) var(--fone-midia-arte);
      grid-template-rows: minmax(0, 1fr) 44px 34px;
      grid-template-areas:
        'info art'
        'buttons art'
        'volume volume';
      gap: 4px var(--fone-midia-gap);
      padding: 4px var(--fone-midia-eixo-x);
    }
    :host([data-folha='midia']) .room-subview .mh-source-body::before,
    :host([data-folha='midia']) .room-subview .mh-source-body::after {
      content: none !important;
      display: none !important;
    }
    :host([data-folha='midia']) .room-subview .mh-source-head {
      padding-inline: var(--fone-midia-eixo-x);
    }
    :host([data-folha='midia']) .room-subview .mh-source.is-open .mh-source-head {
      top: 8px;
      left: var(--fone-midia-eixo-x);
      right: calc(var(--fone-midia-eixo-x) + var(--fone-midia-arte) + var(--fone-midia-gap));
      padding: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-info {
      grid-area: info;
      align-self: start;
      padding-top: 34px;
    }
    :host([data-folha='midia']) .room-subview .mh-progress-wrap {
      width: 100%;
    }
    :host([data-folha='midia']) .room-subview .mh-controls {
      display: contents;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row {
      grid-area: buttons;
      align-self: center;
      width: 100%;
      min-width: 0;
      min-height: 44px;
    }
    :host([data-folha='midia']) .room-subview .mh-vol {
      grid-area: volume;
      align-self: end;
      width: 100%;
      min-width: 0;
      min-height: 34px;
      padding-inline: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-art {
      grid-area: art;
      align-self: center;
      justify-self: end;
    }

    /* Sem volume, TV/PC/Spotify conservam a mesma altura externa. A arte usa
       toda a altura disponivel e o CTA ocupa a metade inferior da coluna de
       texto, em vez de deixar uma faixa vazia na base. */
    :host([data-folha='midia']) .room-subview .mh-source-body.is-source-idle .mh-art,
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-art {
      grid-column: 2;
      grid-row: 1 / 4;
      align-self: center;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main,
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-btn-row {
      grid-column: 1;
      grid-row: 2 / 4;
      align-self: center;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      width: 100%;
      min-width: 0;
      min-height: 46px;
    }

    /* Os quatro transportes mantem caixas tateis invisiveis de pelo menos
       44px. So Play/Pause e Mais desenham circulos: o primeiro e o foco optico;
       o segundo recebe um acento menor. */
    :host([data-folha='midia']) .room-subview .mh-btn-row-4 {
      grid-template-columns: repeat(4, minmax(44px, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
      grid-template-columns: repeat(5, minmax(44px, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn {
      position: relative;
      isolation: isolate;
      min-width: 44px;
      min-height: 44px;
      overflow: visible;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn::before {
      content: '';
      position: absolute;
      z-index: -1;
      left: 50%;
      top: 50%;
      width: 0;
      height: 0;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      pointer-events: none;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Tocar']::before,
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Pausar']::before {
      width: 42px;
      height: 42px;
      background: rgba(255, 255, 255, 0.085);
      border: 1px solid rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.34);
      box-shadow: 0 5px 14px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.10);
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn.is-plus::before {
      width: 30px;
      height: 30px;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid rgba(255,255,255,0.13);
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn bruno-icon {
      position: relative;
      z-index: 1;
      --mdc-icon-size: 23px;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Tocar'] bruno-icon,
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Pausar'] bruno-icon {
      --mdc-icon-size: 25px;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn.is-plus bruno-icon {
      --mdc-icon-size: 18px;
    }

    @container subview (max-width: 350px) {
      :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
        --fone-midia-arte: 96px;
        --fone-midia-gap: 8px;
      }
      :host([data-folha='midia']) .room-subview .mh-source-body {
        grid-template-columns: minmax(0, 1fr) var(--fone-midia-arte);
        gap: 8px var(--fone-midia-gap);
      }
      :host([data-folha='midia']) .room-subview .mh-vol-label {
        display: none;
      }
      /* Em 320px a coluna textual nao comporta fisicamente as cinco acoes do
         PC com alvos Apple de 44px. Mantemos os cinco alvos integrais e
         limitamos a faixa a sua propria coluna; somente esse conjunto pode ser
         percorrido horizontalmente, sem invadir a arte nem aumentar a folha. */
      :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
        grid-template-columns: repeat(5, 44px);
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior-inline: contain;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      :host([data-folha='midia']) .room-subview .mh-btn-row-5::-webkit-scrollbar {
        display: none;
      }
    }

    :host([data-folha='ac']) .room-subview .ac-card.ac-card-lean {
      grid-template-rows: auto auto auto;
      align-content: start;
    }
    :host([data-folha='ac']) .room-subview .ac-lean-mid {
      min-height: clamp(178px, 48vw, 210px);
      padding: 0 clamp(4.68px, 0.33cqi, 7.8px) 2px;
    }
    :host([data-folha='ac']) .room-subview .ac-lean-foot {
      padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
      gap: clamp(6.24px, 0.44cqi, 10.4px);
    }

    /* ANTERIOR (rollback pos-device): Josh usava um gradiente quase opaco e
       blur(28px) brightness(.78). No telefone ele agora recebe exatamente o
       mesmo material VisionOS da regra-base da folha. */
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.lights-card,
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.ac-card,
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.media-hub-card,
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.appliances-card {
      background: var(--fone-folha-vision-background) !important;
      backdrop-filter: var(--fone-folha-vision-filter) !important;
      -webkit-backdrop-filter: var(--fone-folha-vision-filter) !important;
    }

    /* ══ 8. ESCURECIMENTO ═══════════════════════════════════════════════════ */
    /* A câmera fica ACIMA dele: acesa, transmitindo e clicável com a folha
       aberta. Todo o resto escurece, e tocar no escuro fecha. */

    /* ── FECHAR (item 12) ──────────────────────────────────────────────────
       A barra "Concluir" SAIU. Ela transformava o fechamento em etapa de
       formulario, ocupava 54px na base e competia com o dock logo abaixo.
       Agora o fechamento e o de uma folha nativa: arrastar para baixo (ver
       "_arrastarFolha" no componente), tocar fora, ou o botao discreto no
       cabecalho.

       ANTERIOR (rollback rev. faixa-de-tiles) — a barra:
         :host([data-folha]) .folha-fechar {
           display: flex; position: fixed; left: 0; right: 0; bottom: 0;
           z-index: 10;
           height: calc(var(--fone-fechar-h) + env(safe-area-inset-bottom,0px));
           border-top: 1px solid rgba(255,255,255,0.09);
           background: var(--bruno-liquid-surface-off-background,
                            rgba(20,24,33,0.92));
           backdrop-filter: blur(18px) saturate(1.12);
           font-size: 15px; font-weight: 640;
         }
       ANTERIOR: o elemento continuava no DOM, apenas escondido. Agora ele saiu
       tambem da marcacao; para voltar, restaurar o bloco acima, o button no
       componente e devolver --fone-fechar-h a 54px. */
    :host([data-room]) .room-subview .folha-fechar { display: none; }
    :host([data-folha]) .room-subview .folha-fechar { display: none; }

    /* O chevron fica imediatamente depois do titulo e recolhe a folha. Ele nao
       tem disco, moldura ou fundo: e o mesmo vocabulario do chevron da faixa. */
    :host([data-room]) .room-subview .folha-recolher { display: none; }
    :host([data-folha]) .room-subview .folha-recolher {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
      padding: 0;
      margin: 0 0 0 -4px;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: rgba(255, 255, 255, 0.58);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    :host([data-folha]) .room-subview .folha-recolher bruno-icon {
      --mdc-icon-size: 20px;
    }
    :host([data-folha]) .room-subview .folha-recolher:focus-visible {
      outline: 2px solid rgba(120, 178, 245, 0.85);
      outline-offset: 2px;
    }

    /* ANTERIOR (rollback pos-device): o X era um glifo MDI e depois um caractere
       em circulo. O markup fica preservado, mas sem ocupar layout; o chevron ao
       lado do titulo assumiu o fechamento. */
    :host([data-room]) .room-subview .folha-x { display: none; }
    :host([data-folha]) .room-subview .folha-x {
      display: none;
      place-items: center;
      width: 34px;
      height: 34px;
      flex: 0 0 auto;
      padding: 0;
      margin: 0;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      color: rgba(255, 255, 255, 0.96);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    :host([data-folha]) .room-subview .folha-x bruno-icon {
      --mdc-icon-size: 18px;
    }
    :host([data-folha]) .room-subview .folha-x-glyph {
      display: block;
      font-size: 26px;
      font-weight: 420;
      line-height: 1;
      transform: translateY(-1px);
    }
    :host([data-folha]) .room-subview .folha-x:focus-visible {
      outline: 2px solid rgba(120, 178, 245, 0.85);
      outline-offset: 2px;
    }

    /* ── O OVERLAY (item 9) ────────────────────────────────────────────────
       ANTERIOR (rollback rev. faixa-de-tiles): rgba(4, 7, 12, 0.62).
       0.62 apagava o comodo — e a razao de ser deste cenario e VER o ambiente
       enquanto se comanda. Em 0.34 a subview apenas REBAIXA: a faixa e a barra
       de status continuam reconheciveis atras da folha. Sem blur, de proposito
       (o item 9 proibe blur excessivo, e qualquer blur aqui criaria um backdrop
       root que quebraria o microblur da faixa — mesma armadilha da REV.17). */
    :host([data-room]) .room-subview .folha-scrim { display: none; }
    :host([data-folha]) .room-subview .folha-scrim {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 7;
      background: rgba(4, 7, 12, 0.34);
      animation: fone-scrim-entra 180ms ease both;
    }
    :host([data-folha][data-folha-saindo]) .room-subview .folha-scrim {
      animation: fone-scrim-sai 180ms ease forwards;
      pointer-events: none;
    }
    /* A camera fica ACIMA do escurecimento: acesa, transmitindo e clicavel. */
    :host([data-folha]) .room-subview .cameras-card { z-index: 8; }

    @keyframes fone-scrim-entra {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fone-scrim-sai {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  }

  /* Fora do telefone nada disto existe: as linhas e o escurecimento estão no
     DOM mas não aparecem, e nenhum caminho de interação as alcança. */
  @media (min-width: 801px) {
    .resumo-telefone,
    .folha-scrim,
    /* O X de fechar mora no cabecalho dos modulos, que sao os MESMOS do
       tablet. Sem esta linha ele apareceria la — a regra que o esconde vive
       dentro do bloco de telefone e nao alcança larguras maiores. */
    .folha-x,
    .folha-recolher,
    .folha-fechar {
      display: none !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .folha-scrim,
    .resumo-chevron,
    .glass-card.lights-card,
    .glass-card.ac-card,
    .glass-card.media-hub-card,
    .glass-card.appliances-card {
      animation: none !important;
      transition: none !important;
    }
  }
`, h = "bruno-room-subview";
function La(u) {
  return u === !0 ? !0 : typeof u == "number" ? u > 0 : ["true", "on", "yes", "1"].includes(String(u ?? "").toLowerCase());
}
const Pa = ["playing", "paused", "on", "idle"], ja = ["streaming", "recording", "idle", "on"], Ba = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], Ua = ["cooling", "heating", "drying", "fan", "preheating"], Ha = ["off", "idle"], Ga = [
  { visual: 0, position: 0 },
  { visual: 25, position: 33 },
  { visual: 50, position: 47 },
  { visual: 75, position: 70 },
  { visual: 100, position: 100 }
], Y = 3e4, X = 1200, Ya = 350, L = 2, Xa = 700;
function Qa(u) {
  if (!u) return "∅";
  const a = u.attributes;
  return JSON.stringify([
    u.state,
    u.last_changed,
    a.media_title,
    a.media_artist,
    a.media_album_name,
    a.entity_picture,
    a.media_image_url,
    a.media_duration,
    a.media_position,
    a.media_position_updated_at,
    a.volume_level,
    a.source,
    a.source_name,
    a.device_name,
    a.active_device_name,
    a.spotify_device_name
  ]);
}
const Za = 4e3, Wa = 3e4, Ja = 700, Ka = "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1", ao = "/local/images/echo_pop.png?v=20260702-all-images-1", oo = "/local/images/office_pc.png?v=20260702-all-images-1", Q = "bruno-ui:tv-hub-history:v1";
function M(u, a = 0) {
  const o = Number(u);
  return Number.isFinite(o) ? o.toFixed(a).replace(/\.0+$/, "") : "--";
}
function Z(u) {
  const a = Math.max(0, Math.floor(Number(u) || 0)), o = Math.floor(a / 3600), e = Math.floor(a % 3600 / 60), i = a % 60;
  return o > 0 ? `${o}:${String(e).padStart(2, "0")}:${String(i).padStart(2, "0")}` : `${e}:${String(i).padStart(2, "0")}`;
}
function P(u) {
  const a = String(u ?? "").replace(/_/g, " ").trim();
  return a ? a.charAt(0).toUpperCase() + a.slice(1) : "—";
}
class eo extends ra {
  constructor() {
    super(...arguments), this._lightsOpen = !1, this._folha = null, this._folhaSaindo = !1, this._tokenAncoraFolha = 0, this._fonteMidia = "", this._fonteMidiaManual = !1, this._midiaAtivasAntes = [], this._tvUltimoVolume = null, this._tvUltimoPoster = "", this._tvUltimaFonte = "HDMI 1", this._tvUltimoTitulo = "", this._tvHistoricoCarregado = !1, this._menuMidiaAberto = !1, this._spotifyFerramentas = !1, this._painelClima = "", this._controlesCameraAbertos = !1, this._cameraAtiva = "", this._urlsCarregadas = {}, this._ultimaImagem = {}, this._motorCameras = new na({
      // O primeiro quadro é do elemento de imagem, que nasce com `src` e baixa
      // sozinho. O motor entra só na primeira atualização — sem isto eram DUAS
      // requisições lentas por câmera na montagem, competindo entre si.
      atrasoInicial: sa.principal,
      agenda: {
        agendar: (a, o) => A(h, a, o),
        cancelar: (a) => v(h, a),
        agora: () => performance.now()
      },
      aoCarregar: (a) => this._quadroPronto(a.entityId, a.url),
      aoMedir: (a, o, e, i) => {
        const t = a.split(".")[1] ?? a;
        O(`câmera ${t}`, o, e === "ok"), i && O(`câmera ${t} · 1º quadro`, o, !0);
      }
    }), this._liveEntity = "", this._livePronto = "", this._liveIniciadoEm = 0, this._estadoAoVivo = "ocioso", this._tokenDefinicaoPlayer = 0, this._quadroVerdeRegistrado = "", this._fallbackAoVivo = "", this._ouvindoFechamentoDialogo = !1, this._observador = new H(), this._motivo = "", this._ultimoMinuto = "", this._ouvindoVisibilidade = !1, this._aoMudarVisibilidade = () => {
      if (this.isConnected) {
        if (document.visibilityState === "hidden") {
          this._pararTimerCameras(), this._tokenDefinicaoPlayer++, this._estadoAoVivo = "ocioso", this._fallbackAoVivo = "", this._pararAoVivo();
          return;
        }
        this._atualizarCameras(), this._iniciarTimerCameras(), this._estadoAoVivo = "ocioso", this._fallbackAoVivo = "", this._sincronizarCameras();
      }
    }, this._modoPlayer = "nenhum", this._aoCarregarAoVivo = () => {
      const a = this._liveEl, o = this._liveEntity;
      if (!a || !o || !this.isConnected) return;
      const e = a.shadowRoot?.querySelector("video");
      if (!e || e.readyState < 2 || this._livePronto === o) return;
      if (la(e)) {
        this._quadroVerdeRegistrado !== o && (this._quadroVerdeRegistrado = o, R(
          o,
          "quadro verde rejeitado",
          performance.now() - this._liveIniciadoEm,
          !1
        )), v(h, this._timerQuadroVerde), this._timerQuadroVerde = A(h, () => {
          this._timerQuadroVerde = void 0, this._aoCarregarAoVivo();
        }, 700);
        return;
      }
      this._livePronto = o, this._estadoAoVivo = "ao-vivo", v(h, this._timerQuadroVerde), this._timerQuadroVerde = void 0, a.classList.add("is-ready"), v(h, this._timerAoVivo), this._timerAoVivo = void 0;
      const i = o.split(".")[1] ?? o;
      O(
        `marco: ${i} · player ${this._modoPlayer} · primeiro quadro`,
        performance.now() - this._liveIniciadoEm,
        !0
      ), this._sincronizarCameras();
    }, this._aoInformarStreams = (a) => {
      a.detail?.hasVideo === !1 && this._falharAoVivo("sem video");
    }, this._aoFecharDialogo = (a) => {
      a.detail?.dialog === "ha-more-info-dialog" && this._estadoAoVivo === "entregue-more-info" && (this._estadoAoVivo = "retomando", R(this._cameraAtiva, "more-info fechado; retomando"), v(h, this._timerRetomadaAoVivo), this._timerRetomadaAoVivo = A(h, () => {
        this._timerRetomadaAoVivo = void 0, !(!this.isConnected || this._estadoAoVivo !== "retomando") && (this._estadoAoVivo = "ocioso", this._fallbackAoVivo = "", this._sincronizarCameras());
      }, Ja));
    }, this._montadoEm = 0, this._quadrosNaTela = /* @__PURE__ */ new Set(), this._socorros = /* @__PURE__ */ new Set(), this._materialInjetado = !1, this._luzesAssentadas = !1, this._aoMudarModoTelefone = (a) => {
      a.matches || this._limparFolhaImediatamente();
    }, this._arrastoY = null, this._arrastoAlvo = null, this._iniciarArrasto = (a) => {
      if (!this._folha || a.button !== 0) return;
      const o = this._folhaEl();
      !o || !a.composedPath().includes(o) || o.scrollTop > 0 || (this._arrastoY = a.clientY, this._arrastoAlvo = o, globalThis.addEventListener("pointermove", this._moverArrasto, { passive: !0 }), globalThis.addEventListener("pointerup", this._soltarArrasto), globalThis.addEventListener("pointercancel", this._cancelarArrasto));
    }, this._moverArrasto = (a) => {
      if (this._arrastoY == null || !this._arrastoAlvo) return;
      const o = a.clientY - this._arrastoY;
      if (o <= 0) {
        this._arrastoAlvo.style.transform = "";
        return;
      }
      this._arrastoAlvo.style.transform = `translateY(${(o * 0.72).toFixed(1)}px)`;
    }, this._soltarArrasto = (a) => {
      const o = this._arrastoY, e = this._arrastoAlvo;
      this._encerrarArrasto(), !(o == null || !e) && a.clientY - o > 90 && this._fecharFolha();
    }, this._cancelarArrasto = () => {
      this._encerrarArrasto();
    }, this._appsTvAbertos = !1;
  }
  static {
    this.properties = {};
  }
  setConfig(a) {
    if (!a?.room) throw new Error("bruno-room-subview: informe `room`");
    const o = ca.find((n) => n.id === a.room);
    if (!o) throw new Error(`bruno-room-subview: cômodo desconhecido "${a.room}"`);
    this._config = a, this._room = o, this._sub = _a[a.room], this._config, this._hass;
    const e = [
      ...G(o),
      ...G(this._sub)
    ], i = this._sub?.entities ?? {}, t = ["spotify", "tv", "speaker"].flatMap((n) => {
      const p = i[n];
      return Array.isArray(p) ? p : typeof p == "string" ? [p] : [];
    }).filter((n) => !!n), r = Object.fromEntries(t.map((n) => [n, Qa]));
    this._observador = new H(e, { projecoes: r }), this._aplicarAtributos();
  }
  /**
   * ANTERIOR (rollback 6.1) — sem guarda nenhuma:
   *
   *   set hass(hass: Hass) {
   *     this._hass = hass;
   *     this.requestUpdate();
   *   }
   *
   * O Home Assistant troca o objeto `hass` a cada mudança de estado de qualquer
   * entidade da casa. Este componente é o mais pesado do dashboard (média de
   * 3 ms por render na baseline do tablet, pior caso 34,9 ms) e repintava a cada
   * uma delas — inclusive quando o que mudou foi o aspirador em outro cômodo.
   */
  set hass(a) {
    this._hass = a;
    const o = this._observador.mudancas(a);
    o.length !== 0 && (this._motivo = da(o), this.requestUpdate());
  }
  getCardSize() {
    return 12;
  }
  /**
   * Mede o custo de cada atualização (Fase 6.0.1).
   *
   * No `update()`, e não no `render()`: é aqui que o Lit constrói E aplica o
   * DOM. Medir só o `render()` mediria a montagem do template, que é a parte
   * barata — e o número enganaria.
   */
  update(a) {
    const o = this._motivo;
    this._motivo = "", pa(h, () => super.update(a), o || this._motivoPadrao());
  }
  _motivoPadrao() {
    return this.hasUpdated ? "interação" : "montagem";
  }
  /**
   * Depois de cada render, o motor recebe a lista de câmeras da tela.
   *
   * Aqui, e não no render: o motor só deve descobrir a promoção do PIP quando os
   * elementos correspondentes já existem — é neles que o quadro pronto entra.
   */
  updated(a) {
    super.updated(a), this._hass && (this._sincronizarCameras(), this._sincronizarLimiteFolhaTelefone(), this._sincronizarAlturaLuzesTelefone());
  }
  connectedCallback() {
    super.connectedCallback(), ma(h), this._estadoAoVivo = "ocioso", this._fallbackAoVivo = "", this._montadoEm = performance.now(), this._quadrosNaTela.clear(), this._socorros.clear(), this._aplicarAtributos();
    const a = globalThis;
    a.BrunoLiquidGlass?.apply?.(), a.BrunoSurfaceMaterial?.connect?.(this), this._injetarMaterial(), this._iniciarVigiaTelefone(), this._iniciarTimerCameras(), this._armarVigiaDeCameras(), this._iniciarTimerRelogio(), !this._ouvindoVisibilidade && typeof document < "u" && (I(h, document, "visibilitychange", this._aoMudarVisibilidade), this._ouvindoVisibilidade = !0), !this._ouvindoFechamentoDialogo && typeof window < "u" && (I(h, window, "dialog-closed", this._aoFecharDialogo), this._ouvindoFechamentoDialogo = !0);
  }
  /**
   * O relógio da barra superior.
   *
   * Nada no hass muda de minuto em minuto, então sem uma batida externa a hora
   * congela no momento em que a subview abriu. A comparação com o último minuto
   * continua: batida não é render, só vira render quando o minuto realmente
   * vira.
   *
   * ANTERIOR (rollback 6.1) — intervalo próprio de 15s por instância:
   *
   *   private _iniciarTimerRelogio(): void {
   *     if (this._timerRelogio) return;
   *     this._timerRelogio = intervalo(SONDA, () => { ... }, 15000);
   *   }
   *
   * Cada módulo que mostrasse hora criaria o seu, todos desalinhados entre si e
   * nenhum parando com a tela apagada. O relógio central é um só, e some quando
   * o último assinante sai.
   */
  _iniciarTimerRelogio() {
    this._cancelarRelogio || (this._cancelarRelogio = Aa(() => {
      const a = this._hora();
      a !== this._ultimoMinuto && (this._ultimoMinuto = a, this._motivo = "relógio", this.requestUpdate());
    }));
  }
  _pararTimerRelogio() {
    this._cancelarRelogio?.(), this._cancelarRelogio = void 0;
  }
  disconnectedCallback() {
    super.disconnectedCallback(), ha(h), globalThis.BrunoSurfaceMaterial?.disconnect?.(this), this._limparFolhaImediatamente(), this._pararVigiaTelefone(), this._encerrarArrasto(), this._pararTimerMovimentoCortina(), this._pararTimerCameras(), this._tokenDefinicaoPlayer++, this._estadoAoVivo = "ocioso", this._pararAoVivo(), v(h, this._timerRetomadaAoVivo), this._timerRetomadaAoVivo = void 0, this._timerLuzes && (v(h, this._timerLuzes), this._timerLuzes = void 0), this._pararTimerRelogio(), this._ouvindoVisibilidade && (N(h, document, "visibilitychange", this._aoMudarVisibilidade), this._ouvindoVisibilidade = !1), this._ouvindoFechamentoDialogo && (N(h, window, "dialog-closed", this._aoFecharDialogo), this._ouvindoFechamentoDialogo = !1);
  }
  /**
   * ANTERIOR (rollback 6.2B) — o ciclo de intervalo fixo que o motor substituiu:
   *
   *   private _iniciarTimerCameras(): void {
   *     if (this._timerCameras) return;
   *     this._timerCameras = intervalo(SONDA, () => this._atualizarCameras(), 6500);
   *   }
   *
   *   private _atualizarCameras(): void {
   *     for (const img of raiz.querySelectorAll("img[data-camera-src-base]")) {
   *       const carregador = new Image();
   *       carregador.onload = () => { ...troca o src... };
   *       carregador.onerror = () => requisicaoManual(SONDA, ..., false);
   *       carregador.src = proxima;
   *     }
   *   }
   *
   * Ele pedia um quadro de cada câmera a cada 6.500 ms **sem olhar se o anterior
   * tinha terminado**, sem prazo e sem cancelamento. Com a carga medida em
   * 6.200 ms de média, cada câmera ficava com uma requisição em voo quase o tempo
   * todo — e um pedido travado ficava pendurado para sempre enquanto outro
   * nascia por cima. A política nova está em `services/camera/snapshot-engine.ts`,
   * com o raciocínio completo no cabeçalho de lá.
   */
  _iniciarTimerCameras() {
    typeof document < "u" && document.visibilityState === "hidden" || this._motorCameras.iniciar();
  }
  _pararTimerCameras() {
    this._motorCameras.parar();
  }
  _atualizarCameras() {
    this._motorCameras.atualizarAgora();
  }
  /**
   * Declara ao motor quais câmeras estão na tela e com que prioridade.
   *
   * Chamado a cada render: promover o PIP a palco muda só a cadência, sem
   * reiniciar o ciclo nem perder a métrica do primeiro quadro.
   */
  _sincronizarCameras() {
    const a = this._camerasConfiguradas().map((t) => this._cameraViva(t));
    if (!a.length) {
      this._motorCameras.definirAlvos([]), this._pararAoVivo();
      return;
    }
    const o = a.find((t) => t.entity === this._cameraAtiva) ?? a[0], e = a.find((t) => t.online), i = o?.online || !e ? o : e;
    this._motorCameras.definirAlvos(
      a.filter((t) => !(this._liveEl?.isConnected && this._livePronto === t.entity)).map((t) => ({
        entityId: t.entity,
        base: t.base,
        prioridade: t.entity === i?.entity ? "principal" : "secundaria"
      }))
    ), this._cuidarDoAoVivo(i?.entity);
  }
  /**
   * Aponta o player WebRTC nativo do HA para a câmera do palco.
   *
   * A foto continua por baixo até o evento real de primeiro quadro. Se a
   * negociação não fechar, o player é removido e a foto permanece ativa.
   */
  _cuidarDoAoVivo(a) {
    const o = a && V(a) ? a : "";
    if (!o) {
      this._estadoAoVivo = "ocioso", this._pararAoVivo();
      return;
    }
    if (this._estadoAoVivo === "fallback" && this._fallbackAoVivo !== o && (this._estadoAoVivo = "ocioso", this._fallbackAoVivo = ""), this._estadoAoVivo === "entregue-more-info" || this._estadoAoVivo === "retomando" || this._estadoAoVivo === "fallback" || this._estadoAoVivo === "carregando-player") {
      this._pararAoVivo();
      return;
    }
    const e = this.shadowRoot?.querySelector(
      `.camera-live-slot[data-camera-live="${o}"]`
    );
    if (!e) return;
    if (!this._liveEl || this._liveEntity !== o) {
      this._pararAoVivo();
      const t = this._criarPlayer();
      if (!t) {
        this._estadoAoVivo = "carregando-player";
        const r = ++this._tokenDefinicaoPlayer;
        ua(o, this._hass).then((n) => {
          !this.isConnected || r !== this._tokenDefinicaoPlayer || (this._estadoAoVivo = n ? "ocioso" : "fallback", this._fallbackAoVivo = n ? "" : o, this._sincronizarCameras());
        });
        return;
      }
      this._estadoAoVivo = "negociando", this._liveEl = t, this._liveEntity = o, I(h, t, "load", this._aoCarregarAoVivo), I(h, t, "streams", this._aoInformarStreams), e.appendChild(t), this._iniciarPlayerAposContexto(t, o);
      return;
    }
    const i = this._liveEl;
    i.parentElement !== e && e.appendChild(i), i.entityid !== o && (i.entityid = o);
  }
  /**
   * Cria o player ao vivo, preferindo WebRTC DIRETO.
   *
   * ── POR QUE NAO USAR MAIS `hui-image cameraView="live"` ──────────────────
   *
   * Aquele caminho monta um `ha-camera-stream`, que é um SELETOR: ele começa
   * exibindo HLS e só migra para WebRTC depois que a negociação fecha e o vídeo
   * fica válido. Medido em 2026-08-09 pelos dois relógios na mesma tela —
   * more-info 10:46:45, tile 10:46:33 — ele **ficou no HLS**, com os ~12 s de
   * buffer de segmentos.
   *
   * E a métrica `stream 264px` que eu havia usado como prova de sucesso só
   * confirmava a PRESENÇA do `ha-camera-stream`, nunca o protocolo. Diagnóstico
   * do Codex, e ele está certo.
   *
   * `ha-web-rtc-player` é o player final, sem o seletor na frente: negocia
   * WebRTC e ponto. Sem fase HLS, sem tentativa paralela dos dois — que era
   * também o que competia com o more-info.
   *
   * ── O FALLBACK ANTERIOR, E POR QUE SAIU ─────────────────────────────────
   *
   * O fallback para `hui-image` reabria HLS e devolvia os 12 s de atraso. Se o
   * player direto não estiver registrado, o fallback correto é a foto já
   * renderizada, sem iniciar outro protocolo.
   */
  _criarPlayer() {
    const a = ga();
    if (a) {
      a.classList.add("camera-live-el"), a.setAttribute("muted", ""), a.setAttribute("playsinline", ""), a.setAttribute("autoplay", "");
      try {
        a.fitMode = "cover";
      } catch {
      }
      return this._modoPlayer = "webrtc", a;
    }
    this._modoPlayer = "nenhum";
  }
  /**
   * Espera o player oficial consumir os contextos Lit antes de lhe dar a
   * entidade. O componente do HA so reinicia WebRTC quando `entityid` muda; se
   * essa mudanca acontece antes de apiContext/connectionContext, ele retorna e
   * fica inerte ate ser removido.
   */
  _iniciarPlayerAposContexto(a, o) {
    Promise.resolve(a.updateComplete).then(() => {
      this._liveEl !== a || this._liveEntity !== o || !a.isConnected || (this._liveIniciadoEm = performance.now(), a.entityid = o, R(o, "entityid atribuido"), this._armarPrazoAoVivo(a, o));
    }).catch(() => {
      this._liveEl === a && this._liveEntity === o && this._falharAoVivo("contexto");
    });
  }
  _armarPrazoAoVivo(a, o) {
    v(h, this._timerAoVivo), this._timerAoVivo = A(h, () => {
      this._timerAoVivo = void 0, !(this._liveEl !== a || this._liveEntity !== o || this._livePronto === o) && this._falharAoVivo("prazo");
    }, Wa);
  }
  _falharAoVivo(a) {
    const o = this._liveEntity;
    if (!o) return;
    const e = o.split(".")[1] ?? o;
    O(
      `marco: ${e} · player ${this._modoPlayer} · ${a}`,
      performance.now() - this._liveIniciadoEm,
      !1
    ), this._estadoAoVivo = "fallback", this._fallbackAoVivo = o, this._pararAoVivo(), this._sincronizarCameras();
  }
  _pararAoVivo() {
    v(h, this._timerAoVivo), this._timerAoVivo = void 0, v(h, this._timerQuadroVerde), this._timerQuadroVerde = void 0;
    const a = this._liveEl;
    a && (N(h, a, "load", this._aoCarregarAoVivo), N(h, a, "streams", this._aoInformarStreams), a.remove()), this._liveEl = void 0, this._liveEntity = "", this._livePronto = "", this._quadroVerdeRegistrado = "", this._modoPlayer = "nenhum";
  }
  /**
   * A métrica que o usuário de fato sente: **quanto tempo desde abrir o cômodo
   * até a imagem aparecer**.
   *
   * Não é a duração da requisição. Quem busca o primeiro quadro é o próprio
   * elemento de imagem, e o relógio que importa começa quando a subview monta —
   * é isso que ele chama de "demora para renderizar". Só o primeiro por
   * montagem: os seguintes são atualização, não espera.
   */
  _marcarQuadroNaTela(a) {
    if (this._quadrosNaTela.has(a)) return;
    this._quadrosNaTela.add(a);
    const o = a.split(".")[1] ?? a;
    O(`câmera ${o} · até aparecer`, performance.now() - this._montadoEm, !0);
  }
  /**
   * O elemento não conseguiu baixar o primeiro quadro sozinho.
   *
   * Sem isto a tela ficaria vazia até o motor entrar, uma cadência inteira
   * depois. Uma vez por câmera por montagem: se a segunda também falhar, quem
   * cuida é o ciclo normal, com o recuo dele.
   */
  _socorrerCamera(a) {
    this._socorros.has(a) || (this._socorros.add(a), this._motorCameras.buscarAgora(a));
  }
  /**
   * Vigia do primeiro quadro.
   *
   * O `@error` do elemento cobre a falha declarada. Não cobre o caso do
   * Q. Miguel, medido em 2026-08-07: o pedido do elemento **trava** — não
   * carrega e não dá erro — e a tela fica vazia até o motor entrar, uma cadência
   * inteira depois.
   *
   * O prazo é 4 s porque seis das oito câmeras mostram o primeiro quadro em
   * menos de 5 s: para elas o vigia não custa nada, porque a imagem já chegou.
   * Só as travadas pagam uma requisição a mais, e para elas vale.
   */
  _armarVigiaDeCameras() {
    for (const a of this._camerasConfiguradas())
      A(h, () => {
        !this.isConnected || this._quadrosNaTela.has(a.entity) || this._socorrerCamera(a.entity);
      }, Za);
  }
  /** Põe na tela o quadro que o motor acabou de baixar. */
  _quadroPronto(a, o) {
    this._urlsCarregadas[a] = o;
    const e = this.shadowRoot?.querySelector(
      `img[data-camera-entity="${a}"]`
    );
    e && (e.src = o, e.classList.add("is-loaded"), e.closest(".camera-main")?.classList.add("has-loaded-image"));
  }
  /**
   * Injeta a folha de material do tema no shadow root.
   *
   * `subviewStyles()` devolve o CSS da pele das tiles (câmeras, hub, A/C,
   * cartela de iluminação). As subviews atuais o interpolam dentro do próprio
   * `<style>`; aqui ele entra como folha adotada, depois das folhas estáticas,
   * para manter a mesma ordem de cascata.
   *
   * O módulo pode ainda não ter carregado quando o componente conecta — daí a
   * segunda tentativa no próximo quadro.
   */
  _injetarMaterial(a = 0) {
    const o = this.shadowRoot;
    if (!o || this._materialInjetado || !this.isConnected) return;
    const i = globalThis.BrunoSurfaceMaterial?.subviewStyles?.();
    if (!i) {
      a < 20 && A(h, () => this._injetarMaterial(a + 1), 60);
      return;
    }
    try {
      const t = new CSSStyleSheet();
      t.replaceSync(i), o.adoptedStyleSheets = [...o.adoptedStyleSheets, t], this._materialInjetado = !0;
    } catch {
      const t = document.createElement("style");
      t.textContent = i, o.appendChild(t), this._materialInjetado = !0;
    }
  }
  /**
   * Os atributos do host são o interruptor de cada bloco de CSS.
   *
   * Ficam no HOST, não numa classe interna, porque o CSS gerado usa
   * `:host([data-…])` — é o que permite base e blocos conviverem na mesma folha
   * sem o grid da Cozinha valer para todos.
   */
  _aplicarAtributos() {
    const a = this._room;
    if (!a) return;
    this.setAttribute("data-room", a.id);
    const o = this._sub?.entities, e = (i, t) => {
      t ? this.setAttribute(i, "") : this.removeAttribute(i);
    };
    e("data-appliances", !!(o?.appliances ?? o?.dishwasher)), e("data-tvhub", !!o?.tv), this._folha ? this.setAttribute("data-folha", this._folha) : this.removeAttribute("data-folha"), this._folhaSaindo ? this.setAttribute("data-folha-saindo", "") : this.removeAttribute("data-folha-saindo"), e("data-ps5", !!o?.ps5);
  }
  /** O Office troca o hub de midia pela Estacao de Trabalho, com o PC. */
  get _temPc() {
    const a = this._sub?.entities;
    return !!(a?.pcSession ?? a?.pcActive ?? a?.pcPower);
  }
  /** O cômodo tem eletrodomésticos? Só a Cozinha, e ela usa um grid próprio. */
  get _temEletrodomesticos() {
    const a = this._sub?.entities;
    return !!(a?.appliances ?? a?.dishwasher);
  }
  static {
    this.styles = [
      /*
       * BASE DA FASE 6.2 — escala fluida + container query.
       *
       * Hoje o CSS gerado tem 1.257 valores em px fixos, calibrados num único
       * tablet. A saída não é somar breakpoints (eles se multiplicam por
       * aparelho): é medir relativo ao CONTAINER, com piso e teto.
       *
       * Estas duas linhas NÃO mudam nada por si: enquanto as regras continuarem
       * em px, o layout é idêntico. Elas apenas tornam `cqi` disponível, que é o
       * pré-requisito de cada módulo extraído daqui em diante — sem
       * `container-type`, `cqi` não resolve e todo valor fluido vira zero.
       *
       * Verificado: geometria dos módulos idêntica antes e depois, em 1920x1200 e
       * 1280x720. Ver docs/24-performance-baseline.md.
       */
      ba,
      w`
      :host {
        container-type: inline-size;
        container-name: subview;
      }
    `,
      Sa,
      Ma,
      $a,
      Ea,
      ...Object.values(Fa),
      w`
      /*
       * Vídeo ao vivo (Fase 6.2B parte 2).
       *
       * Mesma caixa da imagem, uma camada ACIMA dela, e com o mesmo tratamento
       * de cor — a troca entre instantâneo e vídeo não pode aparecer como um
       * salto de brilho. Nasce invisível: só aparece quando o stream toca de
       * fato. Enquanto isso o instantâneo está embaixo, e é o que se vê.
       */
      .camera-live-slot {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
      }
      .camera-live-slot:empty {
        display: none;
      }
      /*
       * O player nativo cobre a caixa inteira e recebe o mesmo tratamento de cor
       * do instantâneo — a troca entre os dois não pode aparecer como salto de
       * brilho. O instantâneo continua embaixo, como rede de segurança.
       */
      /*
       * As regras abaixo são cópia literal das que a subview de câmeras usa e
       * que estão provadas nesta instalação. O "!important" não é exagero: o
       * "hui-image" dimensiona a si próprio por proporção, e sem forçar ele não
       * preenche o palco.
       */
      .camera-live-slot > *,
      .camera-live-slot hui-image,
      .camera-live-el {
        display: block;
        width: 100% !important;
        height: 100% !important;
      }
      .camera-live-slot video,
      .camera-live-slot img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      .camera-live-el {
        filter: brightness(0.86) saturate(0.94);
        opacity: 0;
        transition: opacity 160ms ease;
      }
      .camera-live-el.is-ready {
        opacity: 1;
      }

      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }

      /* Na subview atual o elemento interno do anel e uma DIV, e o anel mede 203,27px. Com um
         SVG no lugar dela media 203,00 exatos, e esse quarto de pixel movia o
         anel 1px para baixo no arredondamento — 424 contra os 423 da
         referencia. Com height 100% o anel mede 203,00 e o real 203,27: fica 1px acima no
         arredondamento. Um quarto de pixel num elemento interno, invisivel, e
         perseguir isso custaria mais do que vale — os seis modulos da linha de
         base batem exatos. */
      .icg-root {
        width: 100%;
        height: 100%;
        display: flex;
      }
      .icg-root > svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      /* Ajuste PEDIDO, não paridade: na origem o valor final é 20px de ícone e
         4px de gap — os 28px/11px que aparecem antes no arquivo são de uma
         definição sobrescrita depois. O usuário pediu um pouco maior e mais
         respiro, então a mudança fica aqui, no componente, e o CSS gerado segue
         cópia fiel do original. */
      /* ÍCONE DA CÉLULA DE LUZ — a causa raiz, depois de três tentativas minhas
         que não surtiram efeito nenhum.

         O elemento bruno-icon se dimensiona assim, no próprio shadow root:

             width:  var(--mdc-icon-size, 1em);
             height: var(--mdc-icon-size, 1em);

         Nada na cadeia da célula define --mdc-icon-size. O glifo caía no
         fallback 1em, isto é, o tamanho da FONTE herdada — cerca de 13px — e
         ficava minúsculo dentro de uma caixa muito maior.

         TENTATIVAS QUE FALHARAM, e por quê (mantidas aqui para não repetir):

           1. aumentar só .lc-icon         -> mexe na CAIXA, não no glifo;
           2. aumentar .tpl-light-icon     -> idem, é só o invólucro;
           3. regra .tpl-light-icon svg    -> NÃO CASA NADA. O <svg> vive dentro
                                              do shadow root do bruno-icon, e um
                                              seletor descendente comum não
                                              atravessa shadow root.

         O que funciona é a propriedade customizada: ela ATRAVESSA o shadow root
         por herança — é exatamente o mecanismo para o qual o bruno-icon foi
         escrito. Por isso o tamanho vai em --mdc-icon-size, e não em width.

         Medição: contar SVG por seletor descendente devolve zero mesmo com o
         ícone desenhado, pela mesma razão. Para medir, alcançar o shadow root
         do bruno-icon. */
      .lc-icon {
        width: 32px;
        height: 32px;
      }
      .lc-icon .tpl-light-icon {
        width: 32px;
        height: 32px;
      }
      .lc-icon bruno-icon {
        --mdc-icon-size: 30px;
        width: 30px;
        height: 30px;
      }
      .light-cell {
        grid-template-columns: 32px minmax(0, 1fr) auto;
        gap: 10px;
      }
      .light-grid {
        gap: 8px;
      }

      /* Mesma linguagem do card dinâmico da Home: a arte permanece como
         contexto no pause, mas perde nitidez para sinalizar que não está
         reproduzindo. A caixa e a geometria do Hub não mudam. */
      .mh-art.is-paused img {
        filter: blur(2.8px) brightness(0.78) saturate(0.9);
      }
      /* A arte tablet e centralizada por translate(-50%, -50%). Escalar sem
         preservar esse translate deslocaria a capa ao pausar. */
      .mh-art.is-paused.is-cover img {
        transform: translate(-50%, -50%) scale(1.035);
      }

      /* UNIFORMIDADE GLOBAL DOS STATUS (2026-08-15).
         A Home usa faixa de 48px, tile de 46px, ícone de 22/18px e textos
         10/11px. As subviews herdavam uma transcrição fluida menor. No tablet
         a linha do grid também passa a reservar 48px; no telefone o Plano B
         visual, definido no último stylesheet, preserva a geometria do fluxo. */
      @media (min-width: 801px) {
        :host([data-room='sala']) .room-subview,
        :host([data-room='office']) .room-subview,
        :host([data-room='casal']) .room-subview,
        :host([data-room='marina']) .room-subview,
        :host([data-room='miguel']) .room-subview {
          grid-template-rows: 48px minmax(0, 1fr);
        }
        .subview-topband {
          height: 48px;
          min-height: 48px;
          gap: 8px;
        }
        .topband-badges {
          height: 48px;
        }
        .tb-badge {
          height: 46px;
          grid-template-columns: 22px auto;
          column-gap: 9px;
          padding: 0 16px;
        }
        .tb-badge-icon {
          width: 22px;
          height: 22px;
        }
        .tb-badge-icon bruno-icon {
          --mdc-icon-size: 18px;
        }
        .tb-badge-title {
          font-size: 10px;
        }
        .tb-badge-sub {
          font-size: 11px;
        }
      }

      /* O dock nasce estável — sem barra de rolagem piscando nem célula que
         encolhe e alarga.

         O corpo abre animando a linha do grid de 0fr para 1fr. Enquanto ela
         cresce, o teto de altura do contêiner de rolagem vale quase zero, o
         conteúdo transborda e o navegador mostra a barra — que rouba largura,
         encolhe as duas colunas e, ao terminar a animação, devolve tudo. Duas
         medidas, ambas necessárias:

           1. reservar a calha da barra, para que a largura útil não dependa de
              ela estar presente ou não;
           2. rolagem só DEPOIS de assentar — durante a abertura o transbordo é
              apenas recortado. */
      .lights-scroll {
        scrollbar-gutter: stable;
      }
      .lights-card:not(.is-settled) .lights-scroll {
        overflow-y: hidden;
      }
    `,
      // ÚLTIMO de propósito: o layout de telefone sombreia os oito blocos
      // `@media (max-width: 800px)` que vieram dos arquivos originais. Ver o
      // cabeçalho de subview-phone.styles.ts.
      Va
    ];
  }
  /**
   * Barra superior — seis badges e o relógio.
   *
   * Transcrito de `_renderTopBand`. A ordem importa: a Presença é a PRIMEIRA
   * desde 2026-07-29, quando o rodapé saiu e ela subiu para cá. As três marcadas
   * com `data-phone-hide` somem no telefone — a regra era posicional
   * (`nth-child(n+4)`) e virou explícita justamente porque a Presença mudou as
   * posições.
   *
   * O azul da Presença é o mesmo dot dos cards de cômodo (96,165,250) e lê a
   * mesma fonte — `motion_recent` —, para painel e subview nunca discordarem.
   */
  _renderTopBand() {
    const a = this._room?.entities, o = this._hass, e = (n) => n && o ? o.states[n] : void 0, i = this._contarLuzes(), t = e(a?.motionRecent)?.state === "on", r = [
      {
        icon: "mdi:motion-sensor",
        titulo: "Presença",
        sub: this._linhaPresenca(),
        tone: "96,165,250",
        ativo: t,
        ocultarNoTelefone: !0
      },
      {
        icon: "mdi:lightbulb",
        titulo: "Luzes",
        sub: this._linhaLuzes(),
        tone: "247,198,0",
        ativo: i > 0,
        ocultarNoTelefone: !1
      },
      {
        icon: "mdi:thermometer",
        titulo: "Temperatura",
        sub: this._valorSensor(this._idDe("temperature") ?? a?.temperature, "°", 1),
        tone: "247,170,90",
        ativo: !1,
        ocultarNoTelefone: !1
      },
      {
        icon: "mdi:water-percent",
        titulo: "Umidade",
        sub: this._valorSensor(this._idDe("humidity") ?? a?.humidity, "%", 0),
        tone: "127,200,233",
        ativo: !1,
        ocultarNoTelefone: !1
      },
      {
        icon: "mdi:router-wireless",
        titulo: "Roteador",
        sub: this._linhaRede(this._idDe("router")),
        tone: "154,160,166",
        ativo: !1,
        ocultarNoTelefone: !0
      },
      {
        icon: "mdi:zigbee",
        titulo: "Hub Zigbee",
        sub: this._linhaRede(this._idDe("zigbeeHub")),
        tone: "154,160,166",
        ativo: !1,
        ocultarNoTelefone: !0
      }
    ];
    return l`
      <header class="subview-topband">
        <div class="topband-badges">
          ${r.map(
      (n) => l`
              <div
                class="tb-badge ${n.ativo ? "is-active" : ""}"
                data-phone-hide=${n.ocultarNoTelefone ? "" : b}
                style="--tone: ${n.tone};"
              >
                <span class="tb-badge-icon"><bruno-icon icon=${n.icon}></bruno-icon></span>
                <span class="tb-badge-text">
                  <span class="tb-badge-title">${n.titulo}</span>
                  <span class="tb-badge-sub">${n.sub}</span>
                </span>
              </div>
            `
    )}
        </div>
        <div class="topband-clock" aria-label="Data e hora">
          <span data-clock>${this._hora()}</span>
          <small>${this._data()}</small>
        </div>
      </header>
    `;
  }
  _contarLuzes() {
    const a = this._hass, o = this._room?.entities;
    return !a || !o?.lights ? 0 : o.lights.filter((e) => a.states[e]?.state === "on").length;
  }
  /**
   * Legenda da badge de luzes — acesas POR ZONA.
   *
   * As subviews atuais escrevem "Sala 3 · Varanda 4" nos quatro cômodos com duas
   * zonas, e "Office 2" / "Cozinha 1" nos dois de zona única. Em todos os seis o
   * texto é a chave da zona com inicial maiúscula, então a linha sai da própria
   * lista de luzes em vez de uma tabela paralela. Eu vinha escrevendo
   * "2 acesas", que perdia a divisão por zona.
   */
  _linhaLuzes() {
    const a = this._luzesDaConfiguracao();
    if (!a.length) return `${this._contarLuzes()} acesas`;
    const o = /* @__PURE__ */ new Map();
    for (const e of a) {
      const i = e.zone || "sala", t = this._hass?.states[e.entity]?.state === "on" ? 1 : 0;
      o.set(i, (o.get(i) ?? 0) + t);
    }
    return [...o.entries()].map(([e, i]) => `${e.charAt(0).toUpperCase()}${e.slice(1)} ${i}`).join(" · ");
  }
  _linhaPresenca() {
    const a = this._hass, o = this._room?.entities;
    if (!a || !o?.semanticState) return "Sensor indisponível";
    const i = a.states[o.semanticState]?.attributes.display;
    return i ? String(i) : a.states[o.motionRecent ?? ""]?.state === "on" ? "Presença" : "Sem presença";
  }
  /**
   * Leitura de um sensor da barra superior.
   *
   * Casas decimais e o traço de indisponível vêm dos originais: temperatura com
   * uma casa, umidade inteira, e `--` quando não há leitura. O grau é o SINAL DE
   * GRAU (U+00B0), não o ordinal masculino — este último desenha um traço sob o
   * círculo e destoa do resto do painel.
   */
  _valorSensor(a, o, e = 0) {
    const i = a && this._hass ? this._hass.states[a] : void 0, t = String(i?.state ?? "").toLowerCase();
    return !i || ["unknown", "unavailable", "none", ""].includes(t) ? "--" : `${M(i.state, e)}${o}`;
  }
  /** Roteador e hub Zigbee: "Online" quando conectado, senão o próprio estado. */
  _linhaRede(a) {
    if (!a) return "Online";
    const o = String(this._hass?.states[a]?.state ?? "Online");
    return ["on", "home", "connected", "online"].includes(o.toLowerCase()) ? "Online" : o;
  }
  _hora() {
    return (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  /**
   * Data da barra superior.
   *
   * As tabelas são fixas de propósito: `toLocaleDateString` em pt-BR devolve
   * "segunda-feira, 5 de ago." — o " de " e o ponto final deixavam a linha 30px
   * mais larga que a das subviews atuais e empurravam o relógio para a esquerda.
   */
  _data() {
    const a = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"], o = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"], e = /* @__PURE__ */ new Date();
    return `${a[e.getDay()]}, ${e.getDate()} ${o[e.getMonth()]}`;
  }
  /**
   * Abre e fecha o dock de iluminação.
   *
   * A transição do corpo é de 200 ms; a folga de 40 ms cobre o quadro em que o
   * navegador ainda está compondo. Só depois disso o corpo passa a rolar.
   */
  _alternarDock() {
    this._lightsOpen = !this._lightsOpen, this._luzesAssentadas = !1, v(h, this._timerLuzes), this._timerLuzes = A(h, () => {
      this._luzesAssentadas = this._lightsOpen, this._timerLuzes = void 0, this.requestUpdate();
    }, 240), this.requestUpdate();
  }
  /**
   * No tablet o titulo conserva o comportamento historico de expandir/recolher
   * o dock. Na folha do telefone ele passa a ser o controle de retorno pedido
   * no ajuste pos-dispositivo: o chevron ao lado do titulo fecha a folha.
   */
  _acionarCabecalhoLuzes() {
    if (this._estaNoTelefone() && this._folha === "luzes") {
      this._fecharFolha();
      return;
    }
    this._alternarDock();
  }
  /**
   * Troca a fonte do acordeao sem depender de uma atualizacao do HA.
   *
   * Esses campos nao usam decorador reativo. Informar ao Lit o valor anterior
   * garante a reconciliacao imediata no WebView; um `requestUpdate()` generico
   * podia ser absorvido durante outro update e manter TV/PC visualmente presos
   * mesmo depois de um toque explicito no Spotify.
   */
  _selecionarFonteMidia(a) {
    const o = this._fonteMidia;
    this._fonteMidia = a, this._fonteMidiaManual = this._estaNoTelefone(), this._menuMidiaAberto = !1, this.requestUpdate("_fonteMidia", o);
  }
  _iniciarVigiaTelefone() {
    typeof globalThis.matchMedia == "function" && (this._pararVigiaTelefone(), this._mediaTelefone = globalThis.matchMedia("(max-width: 800px)"), this._mediaTelefone.addEventListener("change", this._aoMudarModoTelefone), this._mediaTelefone.matches || this._limparFolhaImediatamente());
  }
  _pararVigiaTelefone() {
    this._mediaTelefone?.removeEventListener("change", this._aoMudarModoTelefone), this._mediaTelefone = void 0;
  }
  _estaNoTelefone() {
    return this._mediaTelefone ? this._mediaTelefone.matches : typeof globalThis.matchMedia != "function" ? !0 : globalThis.matchMedia("(max-width: 800px)").matches;
  }
  /** Captura a câmera ANTES de qualquer mutação que monte ou desmonte a folha. */
  _capturarBaseFolha() {
    if (!this._estaNoTelefone()) return;
    let a = this.parentNode, o;
    for (; a; ) {
      if (a instanceof HTMLElement) {
        const t = globalThis.getComputedStyle?.(a);
        if (t && /(auto|scroll)/.test(t.overflowY)) {
          o = a;
          break;
        }
      }
      if (a.parentNode) {
        a = a.parentNode;
        continue;
      }
      const i = a.getRootNode();
      a = i instanceof ShadowRoot && i.host !== a ? i.host : null;
    }
    if (!o) return;
    const e = this.renderRoot.querySelector(".cameras-card") ?? this;
    return {
      rolavel: o,
      topoCamera: e.getBoundingClientRect().top,
      rolagem: o.scrollTop,
      token: ++this._tokenAncoraFolha
    };
  }
  /**
   * Mantém câmera e faixa de tiles no mesmo pixel ao montar/desmontar uma folha.
   *
   * ANTERIOR (rollback 2026-08-15): a medição acontecia depois de alterar
   * data-folha. Nesse instante o WebView já podia ter aplicado o primeiro
   * reflow; portanto topoAntes e topoDepois descreviam a mesma geometria e a
   * correção chegava tarde. A captura agora precede a mutação e a restauração
   * espera duas composições, cobrindo Lit + scroll anchoring do Safari.
   */
  _restaurarBaseFolha(a) {
    a && this.updateComplete.then(() => {
      globalThis.requestAnimationFrame(() => {
        globalThis.requestAnimationFrame(() => {
          if (a.token !== this._tokenAncoraFolha || !a.rolavel.isConnected) return;
          const e = (this.renderRoot.querySelector(".cameras-card") ?? this).getBoundingClientRect().top - a.topoCamera;
          a.rolavel.scrollTop = Math.max(0, a.rolagem + e);
        });
      });
    });
  }
  /**
   * Ancora a altura máxima da folha no topo REAL da Cortina.
   *
   * O cálculo anterior usava apenas dvh e uma reserva estimada. Safe-area,
   * escala do WebView e altura efetiva da câmera podem divergir no iPhone. A
   * medição ocorre somente no telefone e publica um token CSS; não redesenha o
   * tablet nem muda a geometria da câmera.
   */
  _sincronizarLimiteFolhaTelefone() {
    if (!this._estaNoTelefone()) {
      this.style.removeProperty("--fone-folha-top");
      return;
    }
    const a = this.renderRoot.querySelector(".curtain-dock"), o = this.renderRoot.querySelector(".cameras-card"), e = a?.getBoundingClientRect().top ?? (o?.getBoundingClientRect().bottom ?? 0) + 8;
    if (!Number.isFinite(e) || e <= 0) return;
    const i = `${Math.round(e)}px`;
    this.style.getPropertyValue("--fone-folha-top") !== i && this.style.setProperty("--fone-folha-top", i);
  }
  /**
   * Faz as quatro linhas visuais de Sala e Q. Miguel caberem exatamente na
   * área útil da folha, sem depender da altura nominal do aparelho.
   *
   * O WebView do iPhone perde pixels para barras e safe-area. Por isso um
   * valor que cabia no banco 428 x 926 ainda rolava no aparelho. Aqui se mede
   * o espaço não ocupado por cabeçalhos, separadores e gaps e se divide apenas
   * o restante pelas linhas reais de cada grid. O resultado fica limitado à
   * faixa ergonômica de 56 a 60 px; telas menores continuam com scroll como
   * proteção, em vez de comprimir o alvo indefinidamente.
   */
  _sincronizarAlturaLuzesTelefone() {
    const a = "--fone-luz-cell-h";
    if (!this._estaNoTelefone() || this._folha !== "luzes") {
      this.style.removeProperty(a);
      return;
    }
    const o = this.renderRoot.querySelector(".lights-scroll"), e = [...this.renderRoot.querySelectorAll(".light-grid")];
    if (!o || !e.length || o.clientHeight <= 0) return;
    let i = 0, t = 0, r = 0;
    for (const m of e) {
      const d = m.querySelectorAll(".light-cell").length, g = Math.ceil(d / 2);
      if (!g) continue;
      const x = Number.parseFloat(getComputedStyle(m).rowGap) || 0;
      i += g, t += m.getBoundingClientRect().height, r += Math.max(0, g - 1) * x;
    }
    if (!i) return;
    const n = Math.max(0, o.scrollHeight - t), p = (o.clientHeight - n - r - 2) / i, s = Math.floor(Math.max(56, Math.min(60, p)) * 10) / 10;
    if (!Number.isFinite(s)) return;
    const c = `${s}px`;
    this.style.getPropertyValue(a) !== c && this.style.setProperty(a, c);
  }
  // ── Cenário B: linhas-resumo e folha (SÓ no telefone) ─────────────────────
  //
  // O DOM é o mesmo nos dois modos. O que muda é o CSS: acima de 800px as
  // linhas e o escurecimento ficam `display: none` e os módulos completos
  // seguem no fluxo, exatamente como hoje. Abaixo de 800px é o inverso.
  //
  // Isso evita o contrato de modo em JS: nada aqui pergunta "é telefone?".
  // O único estado é qual folha está aberta, e no tablet ele nunca sai de null
  // porque as linhas que o mudam não são clicáveis lá.
  /** Abre a folha do módulo, ou fecha se já for a que está aberta. */
  _abrirFolha(a) {
    if (!this._estaNoTelefone()) return;
    if (this._folha === a && !this._folhaSaindo) {
      this._fecharFolha();
      return;
    }
    const o = this._capturarBaseFolha();
    v(h, this._timerFecharFolha), this._timerFecharFolha = void 0, this._folhaSaindo = !1, this._folha = a, this._folha === "luzes" && (this._lightsOpen = !0, this._luzesAssentadas = !0), this._aplicarAtributos(), this._avisarFolha(), this.requestUpdate(), this._restaurarBaseFolha(o);
  }
  _fecharFolha() {
    if (!this._folha || this._folhaSaindo) return;
    const a = this._capturarBaseFolha();
    if (this._encerrarArrasto(), this._folhaSaindo = !0, this._aplicarAtributos(), this.requestUpdate(), this._restaurarBaseFolha(a), typeof globalThis.matchMedia == "function" && globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this._limparFolhaImediatamente();
      return;
    }
    this._timerFecharFolha = A(h, () => {
      this._timerFecharFolha = void 0, this._limparFolhaImediatamente();
    }, 280);
  }
  _limparFolhaImediatamente(a = !0) {
    const o = this._capturarBaseFolha(), e = !!this._folha;
    v(h, this._timerFecharFolha), this._timerFecharFolha = void 0, this._folhaSaindo = !1, this._folha = null, this._encerrarArrasto(), this._aplicarAtributos(), e && a && this._avisarFolha(), this.requestUpdate(), this._restaurarBaseFolha(o);
  }
  /**
   * O botão discreto de fechar, no cabeçalho de cada folha.
   *
   * Ele vive dentro dos módulos, que são os MESMOS do tablet — no tablet o CSS
   * o esconde (ver o bloco `min-width: 801px` em `subview-phone.styles.ts`).
   * É o terceiro caminho de fechamento do item 12 do roteiro; os outros dois
   * (arrastar para baixo e tocar fora) não têm marcação visível.
   */
  _botaoFecharFolha() {
    return l`
      <button
        type="button"
        class="folha-x"
        aria-label="Fechar"
        @click=${() => this._fecharFolha()}
      >
        <!-- ANTERIOR (rollback pos-device): bruno-icon mdi:close. No WebView
             real o glifo nao foi resolvido e restou apenas um circulo vazio. -->
        <span class="folha-x-glyph" aria-hidden="true">&times;</span>
      </button>
    `;
  }
  /**
   * Chevron discreto ao lado do titulo das folhas de telefone.
   *
   * O X anterior continua montado e escondido pelo CSS como caminho de rollback.
   * Acima de 800px este botao tambem fica oculto, preservando o cabecalho tablet.
   */
  _botaoRecolherFolha() {
    return l`
      <button
        type="button"
        class="folha-recolher"
        aria-label="Recolher painel"
        @click=${() => this._fecharFolha()}
      >
        <bruno-icon icon="mdi:chevron-down"></bruno-icon>
      </button>
    `;
  }
  /** O elemento que ESTÁ servindo de folha agora, ou null. */
  _folhaEl() {
    const a = {
      luzes: ".glass-card.lights-card",
      ac: ".glass-card.ac-card",
      midia: ".glass-card.media-hub-card",
      eletro: ".glass-card.appliances-card"
    }, o = this._folha;
    return o ? this.renderRoot.querySelector(a[o]) : null;
  }
  _encerrarArrasto() {
    this._arrastoAlvo && (this._arrastoAlvo.style.transform = ""), this._arrastoY = null, this._arrastoAlvo = null, globalThis.removeEventListener("pointermove", this._moverArrasto), globalThis.removeEventListener("pointerup", this._soltarArrasto), globalThis.removeEventListener("pointercancel", this._cancelarArrasto);
  }
  /**
   * Avisa a shell que há folha aberta.
   *
   * No telefone a shell dá `z-index: 2` ao dock e `1` ao conteúdo. Uma bottom
   * sheet que sobe da borda inferior precisa cobrir o dock — e nenhum z-index
   * daqui de dentro alcança isso, porque a pilha é decidida um nível acima.
   * Então a shell ergue o slot de conteúdo enquanto a folha existe, e o baixa
   * quando ela fecha. É o mínimo de contrato para a folha ser folha.
   */
  _avisarFolha() {
    this.dispatchEvent(
      new CustomEvent("bruno-folha", {
        detail: { aberta: !!this._folha },
        bubbles: !0,
        composed: !0
      })
    );
  }
  /**
   * As linhas-resumo do telefone.
   *
   * A lista sai do que o cômodo TEM: a Cozinha não tem A/C nem hub de mídia e
   * tem eletrodomésticos; o Office troca o hub pela Estação de Trabalho, que
   * mora no mesmo `.media-hub-card`. Nenhuma linha aparece sem o módulo
   * correspondente existir, senão a folha subiria vazia.
   */
  _linhasResumo() {
    const a = [
      {
        chave: "luzes",
        icone: "mdi:lightbulb-group",
        tom: "tone-amber",
        titulo: "Iluminação",
        resumo: this._linhaLuzes()
      }
    ];
    return this._temEletrodomesticos ? a.push({
      chave: "eletro",
      icone: "mdi:home-lightning-bolt-outline",
      tom: "tone-amber",
      titulo: "Eletrodomésticos",
      resumo: this._resumoEletrodomesticos()
    }) : a.push({
      chave: "midia",
      // ANTERIOR (rollback): no Office o launcher usava
      // mdi:desktop-tower-monitor, diferente do mdi:desk do cabeçalho.
      icone: this._temPc ? "mdi:desk" : "mdi:music",
      tom: "tone-blue",
      // ANTERIOR (rollback refinamento mobile): o launcher dizia apenas
      // "Mídia", embora a folha e o roteiro usem o nome completo do módulo.
      titulo: this._temPc ? "Estação de trabalho" : "Hub de Mídia",
      resumo: this._resumoMidia()
    }), this._estadoClimate() && a.push({
      chave: "ac",
      icone: "mdi:snowflake",
      tom: "tone-blue",
      titulo: "Ar-condicionado",
      resumo: this._resumoClimate()
    }), a;
  }
  /** "Frio · 23°" — mesmo vocabulário do card completo, via `_rotuloModo`. */
  _resumoClimate() {
    const a = this._modeloClimate();
    if (a.indisponivel) return "Indisponível";
    if (!a.ativo) return "Desligado";
    const o = this._rotuloModo(String(a.modo));
    return a.alvo == null ? o : `${o} · ${M(a.alvo)}°`;
  }
  /**
   * O mesmo resumo que a fonte ativa mostra dentro do hub.
   *
   * A ordem de prioridade é a do próprio hub (PC ou TV primeiro, Spotify
   * depois) — se divergisse, a linha diria uma coisa e a folha outra.
   */
  _resumoMidia() {
    if (this._temPc) return this._modeloPc().ativo ? "Ligado" : "Desligado";
    const a = this._modeloTv();
    if (a.ativo) return `Ligada · ${a.fonte}`;
    const o = this._modeloSpotify();
    return o.ativo ? o.titulo : "Nada tocando";
  }
  /**
   * "1 de 5 ligados" — conta só o que tem tomada.
   *
   * Os `placeholder: true` da configuração da Cozinha (air fryer, geladeira)
   * não têm entidade e nunca contariam como ligados; incluí-los no total faria
   * a linha parecer sempre incompleta.
   */
  _resumoEletrodomesticos() {
    const a = this._sub?.entities?.appliances;
    if (!Array.isArray(a) || !a.length) return "Sem aparelhos";
    const o = a.filter((i) => !i.placeholder && i.entity);
    return o.length ? `${o.filter((i) => {
      const t = this._hass?.states[String(i.stateEntity ?? i.entity)]?.state, r = Array.isArray(i.activeStates) ? i.activeStates : ["on"];
      return t != null && r.includes(String(t));
    }).length} de ${o.length} ligados` : `${a.length} sem tomada`;
  }
  /**
   * As linhas + o escurecimento.
   *
   * O escurecimento fica ABAIXO da câmera na pilha de camadas (o CSS dá
   * `z-index` maior ao módulo de câmeras), então ela continua acesa e clicável
   * com a folha aberta — que é a razão de o usuário ter escolhido este cenário.
   * Tocar no escurecimento fecha.
   */
  /*
   * ANTERIOR (rollback rev. faixa-de-tiles): depois do scrim era renderizado
   * um button com classe folha-fechar e texto "Concluir". Ele foi retirado do
   * DOM porque fechamento nao e etapa de formulario. Permanecem os tres gestos
   * previstos: X no cabecalho, toque fora e arrasto para baixo.
   */
  _renderResumoTelefone() {
    const a = this._linhasResumo();
    return l`
      <div
        class="folha-scrim"
        aria-hidden="true"
        @click=${() => this._fecharFolha()}
      ></div>
      <div class="resumo-telefone">
        ${a.map(
      (o) => l`
            <button
              type="button"
              class="resumo-linha ${this._folha === o.chave ? "is-active" : ""}"
              aria-expanded=${this._folha === o.chave ? "true" : "false"}
              @click=${() => this._abrirFolha(o.chave)}
            >
              <span class="micro-icon ${o.tom}"><bruno-icon icon=${o.icone}></bruno-icon></span>
              <span class="resumo-texto">
                <span class="resumo-titulo">${o.titulo}</span>
                <span class="resumo-estado">${o.resumo}</span>
              </span>
              <!-- ANTERIOR (rollback rev. faixa-de-tiles): mdi:chevron-up,
                   girado 180deg pelo CSS. O roteiro pede chevron discreto
                   apontando para a direita: a linha abre um SEGUNDO NIVEL
                   (bottom sheet), nao expande no lugar. -->
              <span class="resumo-chevron" aria-hidden="true">
                <bruno-icon icon="mdi:chevron-right"></bruno-icon>
              </span>
            </button>
          `
    )}
      </div>
    `;
  }
  _renderLightsDock() {
    const a = this._lightsOpen, o = [
      "glass-card",
      "lights-card",
      a ? "is-open" : "",
      // Só depois que a animação termina o corpo pode rolar. Ver a nota em
      // `static styles`: rolar durante a abertura é o que fazia a barra piscar
      // e as células encolherem.
      this._luzesAssentadas ? "is-settled" : ""
    ].filter(Boolean).join(" ");
    return l`
      <div class=${o}>
        <div class="lights-dock">
          <button
            type="button"
            class="lights-dock-id"
            aria-expanded=${a ? "true" : "false"}
            @click=${() => this._acionarCabecalhoLuzes()}
          >
            <span class="micro-icon tone-amber"><bruno-icon icon="mdi:lightbulb-group"></bruno-icon></span>
            <span class="module-title">Iluminação</span>
            <span class="lights-dock-chevron" aria-hidden="true">
              <bruno-icon
                icon=${this._estaNoTelefone() && this._folha === "luzes" ? "mdi:chevron-down" : "mdi:chevron-up"}
              ></bruno-icon>
            </span>
          </button>
          <div class="lights-dock-actions">
            <button type="button" class="chip-button is-active" @click=${() => this._todasAsLuzes("turn_on")}>
              Todas acesas
            </button>
            <button type="button" class="chip-button" @click=${() => this._todasAsLuzes("turn_off")}>
              Apagar todas
            </button>
            ${this._botaoFecharFolha()}
          </div>
        </div>
        <div class="lights-body">
          <div class="lights-body-clip">
            <div class="lights-scroll">${this._renderSecoesDeLuz()}</div>
          </div>
        </div>
      </div>
    `;
  }
  /**
   * Seções de zona dentro do dock, com a grade de células de luz.
   *
   * As luzes vêm da configuração gerada (`entities.lights`), cada uma com
   * `zone`, `name` e `icon_type`. A ordem das zonas é a de aparição na lista, e
   * não uma lista fixa: é assim que a Sala tem "Sala" e "Varanda" e os demais
   * têm só uma.
   *
   * Célula larga na primeira posição quando a contagem é ÍMPAR — a luz principal
   * ocupa a linha inteira. Os filetes são por célula, não por gap: com gap o
   * fundo vazaria por baixo.
   */
  _renderSecoesDeLuz() {
    const a = this._luzesDaConfiguracao();
    if (!a.length) return b;
    const o = this._sub?.lightZoneLabels ?? {}, e = this._sub?.lightZoneIcons ?? {}, i = { sala: "Sala", varanda: "Varanda" }, t = { sala: "mdi:sofa-outline", varanda: "bruno:balcony" }, r = [];
    for (const s of a) r.includes(s.zone) || r.push(s.zone);
    const n = r.map((s) => {
      const c = a.filter((m) => m.zone === s);
      return {
        chave: s,
        // Sem rotulo mapeado, a chave vira o nome com inicial maiuscula: no
        // Office e na Cozinha a zona unica saia como "office" e "cozinha".
        nome: o[s] ?? i[s] ?? s.charAt(0).toUpperCase() + s.slice(1),
        icone: e[s] ?? t[s] ?? "mdi:lightbulb-group",
        luzes: c,
        acesas: c.filter((m) => this._hass?.states[m.entity]?.state === "on").length
      };
    }).filter((s) => s.luzes.length > 0), p = n.length > 1;
    return n.map((s) => {
      const c = s.luzes.length % 2 === 1;
      return l`
        <section class="light-section">
          <div class="section-head">
            <span class="zone-icon"><bruno-icon icon=${s.icone}></bruno-icon></span>
            <span class="zone-id">
              <strong>${s.nome}</strong>
              <small>${s.acesas}/${s.luzes.length} acesas</small>
            </span>
            ${p ? l`<button
                  type="button"
                  class="zone-off"
                  @click=${() => this._apagarZona(s.luzes)}
                >
                  Apagar ${s.nome.toLowerCase()}
                </button>` : b}
          </div>
          <div class="light-grid">
            ${s.luzes.map((m, d) => this._renderCelulaDeLuz(m, d, c))}
          </div>
        </section>
      `;
    });
  }
  _luzesDaConfiguracao() {
    const a = this._sub?.entities?.lights;
    return Array.isArray(a) ? a.filter((o) => !!o && typeof o == "object").filter((o) => typeof o.entity == "string" && !o.placeholder).map((o) => ({
      entity: String(o.entity),
      name: String(o.name ?? "Luz"),
      zone: String(o.zone ?? "sala"),
      icon: typeof o.iconType == "string" ? o.iconType : void 0
    })) : [];
  }
  _renderCelulaDeLuz(a, o, e) {
    const i = this._hass?.states[a.entity]?.state === "on", t = e && o === 0, r = e ? o - 1 : o, n = t ? 0 : Math.floor(r / 2) + (e ? 1 : 0), p = [
      "light-cell",
      i ? "is-on" : "",
      t ? "is-wide" : "",
      !t && n > 0 ? "has-rule-top" : "",
      !t && r % 2 === 1 ? "has-rule-left" : ""
    ].filter(Boolean).join(" ");
    return l`
      <button
        type="button"
        class=${p}
        role="switch"
        aria-checked=${i ? "true" : "false"}
        aria-label=${a.name}
        @click=${() => this._alternarLuz(a.entity)}
      >
        <span class="lc-icon">${this._iconeDaLuz(a.icon, i)}</span>
        <span class="lc-name">${a.name}</span>
        <span class="lc-switch" aria-hidden="true"><span class="lc-knob"></span></span>
      </button>
    `;
  }
  /**
   * Ícone da luz — SVG do conjunto próprio, não um `mdi:`.
   *
   * As subviews atuais chamam `BrunoIcons.render()` com nomes do conjunto do
   * projeto: `ledstrip`, `pendant`, `light_flush`. Eu havia mapeado esses nomes
   * para equivalentes `mdi:`, e o resultado era um ícone minúsculo ou um círculo
   * — o `mdi:` correspondente não existe, e o `bruno-icon` cai no genérico.
   *
   * A marcação de fora (`tpl-light-icon`, `icon-<nome>`, `is-on`) é o que o CSS
   * usa para dimensionar e colorir; sem ela o glifo fica sem tamanho.
   */
  _iconeDaLuz(a, o) {
    const i = String(a ?? "light_flush").replace(/^mdi:/, "").replace(/[^a-z0-9_-]/gi, "") || "light_flush";
    return l`<span class="tpl-light-icon icon-${i} ${o ? "is-on" : ""}">
      <bruno-icon icon=${i}></bruno-icon>
    </span>`;
  }
  _alternarLuz(a) {
    this._hass && this._hass.callService("light", "toggle", { entity_id: a }, { entity_id: a });
  }
  _apagarZona(a) {
    if (!this._hass || !a.length) return;
    const o = a.map((e) => e.entity);
    this._hass.callService("light", "turn_off", { entity_id: o }, { entity_id: o });
  }
  _todasAsLuzes(a) {
    const o = this._room?.entities.lightGroup;
    !o || !this._hass || this._hass.callService("light", a, { entity_id: o }, { entity_id: o });
  }
  render() {
    return this._room ? l`
      <main class="room-subview" @pointerdown=${this._iniciarArrasto}>
        ${this._renderTopBand()}
        ${this._temEletrodomesticos ? this._corpoCozinha() : this._corpoPadrao()}
      </main>
    ` : b;
  }
  /**
   * Cinco cômodos: coluna esquerda (hero + linha de câmeras/hub) e coluna
   * direita (dock de luzes + A/C), dentro de `content-left` e `right-column`.
   */
  _corpoPadrao() {
    return l`
      <div class="content-left">
        ${this._renderHero()}
        <div class="cams-media-row">${this._renderCameras()} ${this._renderMediaHub()}</div>
      </div>
      <div class="right-column">${this._renderLightsDock()} ${this._renderAC()}</div>
      ${this._renderResumoTelefone()}
    `;
  }
  /**
   * Hero — a foto do cômodo com o dock de cortina sobreposto na base.
   *
   * A hierarquia de três níveis (`hero-stage` > `hero-content` > `curtain-dock`)
   * não é decorativa: é ela que faz a cortina flutuar sobre a foto sem entrar no
   * fluxo. Lida do DOM renderizado.
   */
  _renderHero() {
    const a = this._entidadeCortina(), o = this._estado(a), e = this._indisponivel(o), i = ["opening", "closing"].includes(String(o?.state));
    return l`
      <div class="hero-panel">
        <div class="hero-stage hero-atmosphere">
          <div class="hero-content">
            <!-- O dock de cortina aparece nos CINCO cômodos com corpo padrão,
                 mesmo onde não há entidade: nos quatro sem cortina ele renderiza
                 inerte, mostrando "Indisponível". Só a Cozinha não o tem, e ela
                 usa outro corpo. Condicioná-lo à entidade tirava o dock de
                 Office, Casal, Marina e Miguel, que o exibem hoje. -->
            <div
              class="curtain-dock curtain-overlay"
              style=${`--curtain-position:${this._fechamentoCortina()}%`}
            >
              <div class="curtain-control-row">
                <div class="curtain-identity">
                  <span class="curtain-icon-shell">
                    <bruno-icon icon="hugeicons:curtains"></bruno-icon>
                  </span>
                  <span class="curtain-title">Cortina</span>
                </div>
                <div class="curtain-status" aria-live="polite">
                  <span class="curtain-status-text">${this._estadoCortina()}</span>
                  <span class="curtain-status-percent">${this._percentualCortina()}</span>
                </div>
                <div class="curtain-main-actions">
                  ${[
      ["cover-open", "open_cover", "Abrir"],
      ["cover-stop", "stop_cover", "Parar"],
      ["cover-close", "close_cover", "Fechar"]
    ].map(
      ([t, r, n]) => l`
                      <button
                        type="button"
                        class="curtain-action-button ${t === "cover-stop" ? "is-muted" : ""} ${t === "cover-stop" && i ? "is-active" : ""}"
                        data-action=${t}
                        ?disabled=${e}
                        @click=${() => this._acionarCortina(r)}
                      >
                        <bruno-icon icon="hugeicons:curtains"></bruno-icon>
                        <span>${n}</span>
                      </button>
                    `
    )}
                </div>
              </div>
              <div class="curtain-slider-zone">
                <div class="curtain-slider-glow"></div>
                <!-- ANTERIOR (rollback funcional da cortina): o range nao tinha
                     evento algum; arrastar o polegar mudava apenas o DOM local. -->
                <input
                  class="curtain-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  .value=${String(this._fechamentoCortina())}
                  aria-label="Percentual de fechamento da cortina"
                  ?disabled=${e}
                  @input=${(t) => this._previsualizarFechamentoCortina(t)}
                  @change=${(t) => this._posicionarCortinaPorFechamento(Number(t.currentTarget.value))}
                />
                <!-- As marcas sao BOTOES, nao rotulos: cada uma leva a cortina
                     para aquela posicao. Como span elas mediam 17px em vez de
                     22px, e eram os 5px que faltavam na altura do dock. -->
                <div class="curtain-marks">
                  ${[0, 25, 50, 75, 100].map(
      (t) => l`
                      <button
                        type="button"
                        class="curtain-mark"
                        data-action="cover-position"
                        data-position=${this._posicaoBrutaPorFechamento(t)}
                        data-closed=${t}
                        aria-label="${t}% fechada"
                        ?disabled=${e}
                        @click=${() => this._posicionarCortinaPorFechamento(t)}
                      >
                        ${t}%
                      </button>
                    `
    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  _entidadeCortina() {
    const a = this._sub?.entities?.curtain;
    return typeof a == "string" ? a : void 0;
  }
  _posicaoCortina() {
    const a = this._entidadeCortina(), e = (a && this._hass ? this._hass.states[a] : void 0)?.attributes.current_position;
    return typeof e == "number" ? e : void 0;
  }
  _percentualCortinaValido(a) {
    const o = Number(a);
    if (Number.isFinite(o))
      return Math.max(0, Math.min(100, Math.round(o)));
  }
  _interpolarCortina(a, o, e) {
    const i = this._percentualCortinaValido(a) ?? 0, t = Ga, r = t[0];
    if (i <= r[o]) return r[e];
    for (let n = 1; n < t.length; n += 1) {
      const p = t[n - 1], s = t[n];
      if (i <= s[o]) {
        const c = s[o] - p[o];
        if (c === 0) return s[e];
        const m = (i - p[o]) / c;
        return this._percentualCortinaValido(
          p[e] + (s[e] - p[e]) * m
        ) ?? s[e];
      }
    }
    return t[t.length - 1][e];
  }
  /** Posição física do cover, já convertida para percentual visual FECHADO. */
  _fechamentoCortinaFisico() {
    const a = this._percentualCortinaValido(this._posicaoCortina());
    return a == null ? void 0 : 100 - this._interpolarCortina(a, "position", "visual");
  }
  /** Valor do helper de comando, usado somente quando o cover não mede posição. */
  _fechamentoCortinaComandado() {
    const a = this._sub?.entities?.curtainPercentControl, o = typeof a == "string" ? this._estado(a) : void 0;
    return this._indisponivel(o) ? void 0 : this._percentualCortinaValido(o?.state);
  }
  /**
   * Leitura publicada pelo HA, sem a estimativa local de percurso.
   *
   * ANTERIOR (rollback 2026-08-15): o helper de percentual tinha prioridade.
   * Ele representa o ALVO do comando e salta imediatamente a 0/100, embora o
   * motor continue em movimento. A posição física do cover volta a ser a fonte
   * primária; o helper permanece como fallback para covers sem telemetria.
   */
  _fechamentoCortinaRelatado() {
    const a = this._fechamentoCortinaFisico();
    if (a != null) return a;
    const o = this._fechamentoCortinaComandado();
    return o ?? (String(this._estado(this._entidadeCortina())?.state ?? "").toLowerCase() === "closed" ? 100 : 0);
  }
  _fechamentoMovimentoCortina(a = this._movimentoCortina, o = Date.now()) {
    if (!a) return;
    if (a.retido) return this._percentualCortinaValido(a.fechado);
    const e = Math.min(1, Math.max(0, (o - a.iniciadoEm) / Math.max(1, a.duracao)));
    return this._percentualCortinaValido(
      a.inicioFechado + (a.alvoFechado - a.inicioFechado) * e
    );
  }
  /** Percentual visual fechado: 0 = aberta; 100 = fechada. */
  _fechamentoCortina() {
    const a = this._fechamentoCortinaRelatado(), o = this._movimentoCortina, e = this._entidadeCortina();
    if (!o || o.entityId !== e) return a;
    const i = Date.now(), t = String(this._estado(e)?.state ?? "").toLowerCase(), r = t === "opening" || t === "closing", n = this._fechamentoCortinaFisico();
    if (o.retido)
      return !r && n != null && i - o.retidoEm >= Xa ? (this._movimentoCortina = void 0, n) : o.fechado;
    const p = i - o.iniciadoEm, s = n != null && Math.abs(n - o.alvoFechado) <= L;
    if (n != null && !s && Math.abs(n - o.ultimoRelatado) >= 1)
      return o.ultimoRelatado = n, o.inicioFechado = n, o.iniciadoEm = i, o.duracao = Math.max(
        X,
        Y * (Math.abs(o.alvoFechado - n) / 100)
      ), n;
    const d = this._fechamentoMovimentoCortina(o, i) ?? a;
    if (p >= o.duracao && !r) {
      this._movimentoCortina = void 0, this._pararTimerMovimentoCortina();
      const x = t === "closed" && o.alvoFechado >= 100 - L || t === "open" && o.alvoFechado <= L;
      return s || x ? o.alvoFechado : n ?? o.alvoFechado;
    }
    return r ? o.alvoFechado > o.inicioFechado ? Math.min(d, Math.max(o.inicioFechado, o.alvoFechado - 1)) : Math.max(d, Math.min(o.inicioFechado, o.alvoFechado + 1)) : d;
  }
  _iniciarTimerMovimentoCortina() {
    this._timerMovimentoCortina || !this.isConnected || (this._timerMovimentoCortina = xa(h, () => {
      if (!this._movimentoCortina || this._movimentoCortina.retido) {
        this._pararTimerMovimentoCortina();
        return;
      }
      this._motivo = "cortina em movimento", this.requestUpdate();
    }, Ya));
  }
  _pararTimerMovimentoCortina() {
    v(h, this._timerMovimentoCortina), this._timerMovimentoCortina = void 0;
  }
  _iniciarMovimentoCortina(a) {
    const o = this._entidadeCortina(), e = this._percentualCortinaValido(a);
    if (!o || e == null) return;
    const i = this._fechamentoMovimentoCortina() ?? this._fechamentoCortinaRelatado(), t = Math.abs(e - i);
    this._movimentoCortina = {
      entityId: o,
      inicioFechado: i,
      alvoFechado: e,
      iniciadoEm: Date.now(),
      duracao: Math.max(X, Y * (t / 100)),
      ultimoRelatado: this._fechamentoCortinaRelatado()
    }, this._iniciarTimerMovimentoCortina(), this.requestUpdate();
  }
  _reterMovimentoCortina() {
    const a = this._entidadeCortina();
    if (!a) return;
    const o = this._fechamentoMovimentoCortina() ?? this._fechamentoCortinaRelatado();
    this._movimentoCortina = { entityId: a, fechado: o, retidoEm: Date.now(), retido: !0 }, this._pararTimerMovimentoCortina(), this.requestUpdate();
  }
  _posicaoBrutaPorFechamento(a) {
    const o = 100 - (this._percentualCortinaValido(a) ?? 0);
    return this._interpolarCortina(o, "visual", "position");
  }
  _estadoCortina() {
    const a = this._entidadeCortina();
    if (!a) return "Indisponível";
    const o = this._hass?.states[a];
    if (!o) return "Indisponível";
    const e = this._fechamentoCortina(), i = String(o.state ?? "").toLowerCase(), t = this._movimentoCortina, r = t && !t.retido && t.entityId === a ? t : void 0;
    return i === "opening" || r && r.alvoFechado < r.inicioFechado ? `Abrindo ${e}%` : i === "closing" || r && r.alvoFechado > r.inicioFechado ? `Fechando ${e}%` : e <= 1 ? "Aberta" : e >= 99 ? "Fechada" : `Fechada ${e}%`;
  }
  _percentualCortina() {
    return "";
  }
  _previsualizarFechamentoCortina(a) {
    const o = a.currentTarget, e = this._percentualCortinaValido(o.value) ?? 0, i = o.closest(".curtain-dock");
    i?.style.setProperty("--curtain-position", `${e}%`), i?.querySelector(".curtain-status-text")?.replaceChildren(
      document.createTextNode(
        e <= 1 ? "Aberta" : e >= 99 ? "Fechada" : `Fechada ${e}%`
      )
    );
  }
  _posicionarCortinaPorFechamento(a) {
    this._iniciarMovimentoCortina(a), this._posicionarCortina(this._posicaoBrutaPorFechamento(a));
  }
  _posicionarCortina(a) {
    const o = this._entidadeCortina();
    !o || !this._hass || this._hass.callService("cover", "set_cover_position", { entity_id: o, position: a }, { entity_id: o });
  }
  _acionarCortina(a) {
    const o = this._entidadeCortina();
    !o || !this._hass || this._indisponivel(this._estado(o)) || (a === "stop_cover" ? this._reterMovimentoCortina() : this._iniciarMovimentoCortina(a === "open_cover" ? 0 : 100), this._hass.callService("cover", a, { entity_id: o }, { entity_id: o }));
  }
  _estado(a) {
    return a && this._hass ? this._hass.states[a] : void 0;
  }
  _indisponivel(a) {
    return !a || ["unavailable", "unknown", ""].includes(String(a.state).toLowerCase());
  }
  _servico(a, o, e) {
    this._hass && ya(this._hass, a, o, e);
  }
  /**
   * A lista de câmeras vem da configuração gerada — `entities.cameras` —, com
   * nome, nome curto e os três interruptores de cada uma (som, movimento,
   * privacidade). Eu vinha lendo só `cameraMain`/`cameraSecondary`, que são
   * ids soltos: sem nome, sem controles, e sem a segunda câmera onde a chave
   * não existia.
   */
  _camerasConfiguradas() {
    const a = this._sub?.entities?.cameras;
    return Array.isArray(a) ? a.filter((o) => !!o && typeof o.entity == "string") : [];
  }
  /**
   * Estado vivo de uma câmera.
   *
   * A imagem sai de `entity_picture` quando o HA a publica, e cai para
   * `/api/camera_proxy/<entidade>` quando não. O último quadro conhecido fica
   * guardado: numa reconexão a imagem antiga continua na tela em vez de sumir.
   */
  _cameraViva(a) {
    const o = this._estado(a.entity), e = a.fallbackEntity ? this._estado(a.fallbackEntity) : void 0, i = this._indisponivel(o) && !!a.fallbackEntity && !this._indisponivel(e), t = i ? String(a.fallbackEntity) : a.entity, r = i ? e : o, n = this._indisponivel(r), p = !n && ja.includes(String(r?.state ?? "")), s = String(r?.attributes.entity_picture ?? "");
    s && (this._ultimaImagem[t] = s);
    const c = s || this._ultimaImagem[t] || `/api/camera_proxy/${t}`;
    return {
      ...a,
      entity: t,
      online: p,
      indisponivel: n,
      base: c,
      // ANTERIOR (rollback 6.2B rev.2):
      //   url: this._urlsCarregadas[cam.entity] ?? comSelo(base, this._seloCameras)
      //
      // O selo aqui tornava a URL inicial ÚNICA a cada montagem — nunca reusava
      // o cache do navegador, e ainda por cima duplicava a requisição, porque o
      // motor disparava outra no mesmo instante. Sem o selo, voltar a um cômodo
      // visitado mostra o último quadro imediatamente, e o motor cuida da
      // atualização a partir daí.
      url: this._urlsCarregadas[t] ?? c
    };
  }
  /** Um dos três interruptores da câmera (som, movimento, privacidade). */
  _controleCamera(a, o) {
    const e = (a?.controls ?? []).find((r) => String(r.key ?? "").toLowerCase() === o);
    if (!e?.entity) return;
    const i = this._estado(e.entity), t = this._indisponivel(i);
    return {
      ...e,
      entity: e.entity,
      ativo: !t && String(i?.state ?? "").toLowerCase() === "on",
      indisponivel: t
    };
  }
  /**
   * Um feed de câmera.
   *
   * A estrutura — moldura, imagem, placeholder e legenda — é a que o CSS gerado
   * espera. O PIP é um botão: tocá-lo promove aquela câmera ao feed principal.
   */
  _renderFeed(a, o) {
    const e = a?.shortName || a?.name || "Câmera", t = !!this._controleCamera(a, "privacy")?.ativo, r = !a || a.indisponivel, n = [
      "camera-main",
      "camera-feed",
      o ? "camera-pip-feed" : "camera-primary-feed",
      t ? "is-private" : "",
      r ? "is-unavailable" : ""
    ].filter(Boolean).join(" "), p = r ? l`<div class="camera-state-surface">
          <bruno-icon icon="mdi:video-off-outline"></bruno-icon><span>Indisponível</span>
        </div>` : t ? l`<div class="camera-state-surface">
            <bruno-icon icon="mdi:eye-off-outline"></bruno-icon><span>Modo privacidade ativo</span>
          </div>` : b, s = !!(a && !o && V(a.entity)), c = l`
      <div class="camera-row-image">
        ${s ? l`<div class="camera-live-slot" data-camera-live=${a.entity}></div>` : b}
        ${a ? l`<img
              src=${a.url}
              data-camera-src-base=${a.base}
              data-camera-entity=${a.entity}
              alt=""
              @load=${(m) => {
      const d = m.currentTarget;
      d.classList.add("is-loaded"), d.closest(".camera-main")?.classList.add("has-loaded-image"), this._marcarQuadroNaTela(a.entity);
    }}
              @error=${(m) => {
      const d = m.currentTarget;
      d.classList.remove("is-loaded"), d.closest(".camera-main")?.classList.remove("has-loaded-image"), this._socorrerCamera(a.entity);
    }}
            />` : b}
        <div class="camera-placeholder" aria-hidden="true"></div>
      </div>
      ${p}
      <div class="camera-row-copy"><strong>${e}</strong></div>
    `;
    return o && a ? l`<button
        type="button"
        class=${n}
        aria-label=${`Mostrar câmera ${e}`}
        @click=${() => {
      this._cameraAtiva = a.entity, this.requestUpdate();
    }}
      >
        ${c}
      </button>` : a ? l`<button
      type="button"
      class=${n}
      aria-label=${`Abrir câmera ${e} em tela cheia`}
      @click=${() => this._maisInfo(a.entity)}
    >
      ${c}
    </button>` : l`<div class=${n} aria-label=${`Câmera ${e}`}>${c}</div>`;
  }
  /** Câmeras: cabeçalho com o menu de três pontos + palco com feed e PIP. */
  _renderCameras() {
    const a = this._camerasConfiguradas().map((n) => this._cameraViva(n));
    if (!a.length)
      return l`
        <div class="glass-card cameras-card cameras-card-controls">
          <div class="mh-head cameras-head">
            <div class="mh-head-title">
              <span class="micro-icon tone-blue"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
              <div class="module-title">Câmeras</div>
            </div>
          </div>
          <div class="camera-stage camera-pip-stage">${this._renderFeed(void 0, !1)}</div>
        </div>
      `;
    const o = a.find((n) => n.entity === this._cameraAtiva) ?? a[0], e = a.find((n) => n.online), i = o?.online || !e ? o : e, t = a.find((n) => n.entity !== i?.entity), r = this._controlesCameraAbertos;
    return l`
      <div class="glass-card cameras-card cameras-card-controls">
        <div class="mh-head cameras-head">
          <div class="mh-head-title">
            <span class="micro-icon tone-blue"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
            <div class="module-title">Câmeras</div>
          </div>
          <button
            type="button"
            class="mh-menu camera-settings-button ${r ? "is-active" : ""}"
            title="Controles"
            aria-expanded=${r ? "true" : "false"}
            aria-label=${r ? "Fechar controles das câmeras" : "Abrir controles das câmeras"}
            @click=${() => {
      this._controlesCameraAbertos = !this._controlesCameraAbertos, this.requestUpdate();
    }}
          >
            <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
          </button>
        </div>
        <div class="camera-stage camera-pip-stage ${r ? "is-controls-open" : ""}">
          ${this._renderFeed(i, !1)}
          ${t ? this._renderFeed(t, !0) : b}
          ${r ? this._renderControlesCamera(i) : b}
        </div>
      </div>
    `;
  }
  _renderControlesCamera(a) {
    const o = ["sound", "motion", "privacy"].map((i) => this._controleCamera(a, i)).filter((i) => !!i);
    if (!o.length) return b;
    const e = a?.shortName || a?.name || "Câmera";
    return l`
      <div class="camera-control-strip" aria-label=${`Controles da câmera ${e}`}>
        <div class="camera-controls">
          ${o.map((i) => {
      const t = i.description || i.label || "Controle";
      return l`
              <button
                type="button"
                class="camera-control ${i.ativo ? "is-on" : ""} ${i.indisponivel ? "is-unavailable" : ""}"
                ?disabled=${i.indisponivel}
                aria-pressed=${i.ativo ? "true" : "false"}
                title=${`${t} — câmera ${e}`}
                @click=${() => this._servico("homeassistant", "toggle", { entity_id: i.entity })}
              >
                <bruno-icon icon=${i.icon ?? "mdi:toggle-switch-outline"}></bruno-icon>
                <span class="camera-control-label">${i.label || t}</span>
                <span class="camera-control-switch" aria-hidden="true"></span>
              </button>
            `;
    })}
        </div>
      </div>
    `;
  }
  // ── Modelos das fontes de mídia ────────────────────────────────────────────
  /**
   * Uma chave de entidade pode ser um id ou uma LISTA de candidatos.
   *
   * O A/C do Q. Marina, por exemplo, traz onze nomes possíveis — a instalação
   * mudou de nome mais de uma vez e a configuração guarda todos. Vale o primeiro
   * que existir e estiver disponível; sem nenhum, o primeiro da lista, para que
   * o cartão ainda mostre a que ele se refere.
   */
  _resolverId(a) {
    if (typeof a == "string") return a || void 0;
    if (!Array.isArray(a)) return;
    const o = a.filter((i) => typeof i == "string" && !!i);
    return o.find((i) => !this._indisponivel(this._hass?.states[i])) ?? o[0];
  }
  _idDe(a) {
    return this._resolverId(this._sub?.entities?.[a]);
  }
  _carregarHistoricoTv() {
    if (!this._tvHistoricoCarregado) {
      this._tvHistoricoCarregado = !0;
      try {
        const a = globalThis.localStorage?.getItem(Q);
        if (!a) return;
        const o = JSON.parse(a), e = String(o.fonte ?? "").trim(), i = String(o.titulo ?? "").trim(), t = String(o.poster ?? "").trim(), r = Number(o.volume);
        e && (this._tvUltimaFonte = e), i && (this._tvUltimoTitulo = i), t && (this._tvUltimoPoster = t), Number.isFinite(r) && (this._tvUltimoVolume = r);
      } catch {
      }
    }
  }
  _salvarHistoricoTv() {
    if (!(!this._tvUltimoPoster && !this._tvUltimoTitulo))
      try {
        globalThis.localStorage?.setItem(Q, JSON.stringify({ fonte: this._tvUltimaFonte, titulo: this._tvUltimoTitulo, poster: this._tvUltimoPoster, volume: this._tvUltimoVolume, savedAt: Date.now() }));
      } catch {
      }
  }
  _modeloTv() {
    this._carregarHistoricoTv();
    const a = this._idDe("tv"), o = this._idDe("tvMedia") ?? a, e = this._estado(a), i = this._estado(o), t = e?.attributes ?? {}, r = i?.attributes ?? {}, n = fa(this._hass, a), p = va(this._hass, o), s = String(e?.state ?? "off").toLowerCase(), c = String(i?.state ?? "").toLowerCase(), m = String(r.app_name ?? r.source ?? t.source ?? t.app_name ?? "").trim(), d = String(r.media_title ?? r.media_series_title ?? r.app_name ?? "").trim(), g = String(r.media_image_url || r.entity_picture || r.entity_picture_local || "").trim(), x = t.volume_level ?? r.volume_level, y = x == null ? Number.NaN : Number(x), C = Number.isFinite(y) ? Math.round(y * 100) : null;
    return n && (m && (this._tvUltimaFonte = m), d && (this._tvUltimoTitulo = d), g && (this._tvUltimoPoster = g), C != null && (this._tvUltimoVolume = C), this._salvarHistoricoTv()), {
      st: e,
      media: i,
      estado: p ? c : s,
      ativo: n,
      reproduzindo: p,
      fonte: m || (n ? this._tvUltimaFonte : "HDMI 1") || "HDMI 1",
      titulo: d || (n ? this._tvUltimoTitulo : ""),
      volume: C ?? (n ? this._tvUltimoVolume : null),
      poster: g || (n ? this._tvUltimoPoster : "")
    };
  }
  _modeloSpotify() {
    const a = this._estado(this._idDe("spotify")), o = a?.attributes ?? {}, e = a?.state ?? "off", t = Pa.includes(e) && wa(
      a,
      this._sub?.spotifyDeviceName,
      this._estado(this._idDe("speaker"))
    ), r = String(o.media_title ?? "") || "SpotifyPlus", n = Number(o.media_duration) || 0, p = Number(o.media_position) || 0, s = Date.parse(String(o.media_position_updated_at ?? "")), c = t && e === "playing", m = c && Number.isFinite(s) ? p + (Date.now() - s) / 1e3 : p, d = n > 0 ? Math.max(0, Math.min(n, m)) : Math.max(0, m);
    return {
      st: a,
      estado: e,
      ativo: t,
      tocando: c,
      titulo: t ? /^SpotifyPlus\s+Bruno/i.test(r) ? "SpotifyPlus" : r : "SpotifyPlus",
      artista: t ? String(o.media_artist ?? o.media_album_name ?? "") : "",
      capa: t ? String(o.entity_picture ?? o.media_image_url ?? "") : "",
      volume: o.volume_level != null ? Math.round(Number(o.volume_level) * 100) : null,
      dispositivo: this._sub?.spotifyDeviceName || String(o.source ?? "") || "SpotifyPlus",
      progresso: n > 0 ? Math.max(0, Math.min(100, d / n * 100)) : 0,
      decorrido: Z(d),
      total: n > 0 ? Z(n) : "--:--"
    };
  }
  _modeloPc() {
    const a = this._estado(this._idDe("pcActive"))?.state === "on", o = this._estado(this._idDe("pcSession"))?.state ?? "", e = this._estado(this._idDe("pcWindow"))?.state ?? "";
    return { ativo: a, sessao: o, janela: e };
  }
  /**
   * Qual fonte fica aberta.
   *
   * As duas regras do original, e elas DIFEREM entre os cômodos:
   *
   * - TV + Spotify (cinco cômodos): a escolha manual persiste, mas quando
   *   qualquer fonte ACABA de ficar ativa ela é descartada e a prioridade
   *   automática volta a valer — é o que faz a TV subir sozinha ao ser ligada.
   * - PC + Spotify (Office): o Spotify TEM precedência. Ele toma a vaga ao
   *   começar a tocar, e assume também quando o PC se desliga com o painel do
   *   PC aberto. Sem seleção, Spotify ativo vence o PC ativo.
   *
   * Eu tratava os seis pela primeira regra, e o Office abria o PC quando devia
   * abrir o Spotify.
   */
  _fonteAberta(a, o) {
    const e = a.filter((t) => o[t]), i = this._midiaAtivasAntes;
    return this._midiaAtivasAntes = e, this._estaNoTelefone() && this._fonteMidiaManual && a.includes(this._fonteMidia) ? this._fonteMidia : this._temPc ? (o.spotify && !i.includes("spotify") && (this._fonteMidia = "spotify"), !o.pc && this._fonteMidia === "pc" && o.spotify && (this._fonteMidia = "spotify"), a.includes(this._fonteMidia) ? this._fonteMidia : o.spotify ? "spotify" : "pc") : (e.some((t) => !i.includes(t)) && (this._fonteMidia = ""), a.includes(this._fonteMidia) ? this._fonteMidia : e[0] ?? a[0] ?? "");
  }
  /** Linha de volume — o mesmo controle nas duas fontes. */
  _linhaVolume(a, o) {
    return l`
      <div class=${a ? "mh-vol" : "mh-vol is-disabled"}>
        <bruno-icon icon="mdi:volume-medium"></bruno-icon>
        <span class="mh-vol-label">Volume ${o}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value=${String(o)}
          .value=${String(o)}
          aria-label="Volume"
          ?disabled=${!a}
          @change=${(e) => {
      const i = e.currentTarget;
      a && this._servico("media_player", "volume_set", {
        entity_id: a,
        volume_level: Number(i.value) / 100
      });
    }}
        />
      </div>
    `;
  }
  /** Volume da TV: o Android TV Remote físico responde a VOLUME_UP/DOWN,
   * enquanto volume_set nas media_player não altera o aparelho. O slider continua
   * absoluto visualmente e converte o delta em passos do remote ao soltar. */
  _linhaVolumeTv(a, o) {
    return l`
      <div class=${a ? "mh-vol" : "mh-vol is-disabled"}>
        <bruno-icon icon="mdi:volume-medium"></bruno-icon>
        <span class="mh-vol-label">Volume ${o}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value=${String(o)}
          .value=${String(o)}
          aria-label="Volume da TV"
          ?disabled=${!a}
          @change=${(e) => {
      const i = e.currentTarget;
      if (!a) return;
      const t = Math.max(0, Math.min(100, Number(i.value))), r = Math.max(0, Math.min(100, Number(o) || 0)), n = Math.round(t - r);
      n && this._servico("remote", "send_command", {
        entity_id: a,
        command: n > 0 ? "VOLUME_UP" : "VOLUME_DOWN",
        num_repeats: Math.min(100, Math.abs(n)),
        delay_secs: 0.05
      });
    }}
        />
      </div>
    `;
  }
  /** Botão do corpo do hub. `soIcone` evita o truncamento nas fileiras de 4-5. */
  _botaoMidia(a, o, e, i = {}) {
    const t = !!(i.soIcone ?? i.mais), r = [
      "mh-btn",
      i.principal ? "is-main" : "",
      i.mais ? "is-plus" : "",
      t ? "is-icon" : ""
    ].filter(Boolean).join(" ");
    return l`
      <button
        type="button"
        class=${r}
        title=${a}
        aria-label=${a}
        ?disabled=${i.desabilitado}
        @click=${e}
      >
        <bruno-icon icon=${o}></bruno-icon>${t ? b : l`<span>${a}</span>`}
      </button>
    `;
  }
  /**
   * A arte da direita.
   *
   * Só o PNG, sobreposto — posicionado de forma absoluta pelo CSS, para nunca
   * ditar a altura da linha e empurrar os botões para fora do cartão.
   */
  _arteMidia(a, o, e, i, t = !1) {
    return l`
      <div class="mh-art mh-art-${o} ${i ? "is-cover" : "is-standby"}${t ? " is-paused" : ""}">
        ${a ? l`<img src=${a} alt="" loading="lazy" />` : l`<bruno-icon icon=${e}></bruno-icon>`}
      </div>
    `;
  }
  _corpoTv() {
    const a = this._modeloTv(), o = this._idDe("tv"), e = this._idDe("tvMedia") ?? o, i = this._sub?.tvStandbyImage ?? Ka, r = (!(!a.titulo || /^TV (ligada|desligada)$/i.test(a.titulo) || a.titulo === a.fonte) && a.estado === "playing" ? a.titulo : "") || a.fonte;
    if (!a.ativo)
      return l`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>HDMI 1 disponível</em></div>
          <div class="mh-controls">
            ${this._botaoMidia(
        "Ligar TV",
        "mdi:power",
        () => this._servico("media_player", "turn_on", { entity_id: o }),
        { principal: !0, desabilitado: !o }
      )}
          </div>
        </div>
        ${this._arteMidia(i, "wide", "mdi:television-classic", !1)}
      `;
    const n = Array.isArray(this._sub?.tvApps) ? this._sub.tvApps : [], p = this._appsTvAbertos && n.length ? l`<div class="mh-btn-row mh-btn-row-5">
          ${n.map(
      (s) => this._botaoMidia(s.label, "mdi:play-box-outline", () => {
        s.script && this._servico("script", "turn_on", { entity_id: s.script });
      }, { soIcone: !0, desabilitado: !s.script })
    )}
          ${this._botaoMidia("Voltar", "mdi:chevron-left", () => {
      this._appsTvAbertos = !1, this.requestUpdate();
    }, { mais: !0 })}
        </div>` : l`<div class="mh-btn-row mh-btn-row-3">
          ${this._botaoMidia("Pausar", "mdi:pause", () => this._servico("media_player", "media_play_pause", { entity_id: e }), { soIcone: !0 })}
          ${this._botaoMidia("Controle remoto", "mdi:remote-tv", () => this._abrirControleRemoto(), {
      soIcone: !0,
      desabilitado: !this._idDe("tvRemote")
    })}
          ${this._botaoMidia("Apps", "mdi:apps", () => {
      this._appsTvAbertos = !0, this.requestUpdate();
    }, { soIcone: !0, desabilitado: !n.length })}
        </div>`;
    return l`
      <div class="mh-left">
        <div class="mh-info">
          <small>Ligada</small>${r ? l`<em>${r}</em>` : b}
        </div>
        <div class="mh-controls">${this._linhaVolumeTv(this._idDe("tvRemote"), a.volume ?? 60)} ${p}</div>
      </div>
      ${this._arteMidia(a.poster || i, "wide", "mdi:television-classic", !!a.poster, a.estado === "paused")}
    `;
  }
  /**
   * Popup premium do controle remoto da Sala.
   *
   * Mantém `browser_mod.popup` + `universal-remote-card` para preservar o caminho
   * funcional já validado em `remote.smart_tv_pro`, mas troca apenas a composição
   * visual. O material replica a mesma base VisionOS das bottom sheets do telefone:
   * gradientes translúcidos + blur moderado, sem animações contínuas ou filtros
   * caros por botão. Assim o popup ganha hierarquia visual sem reabrir a regressão
   * de performance remota já estabilizada nas rounds anteriores.
   */
  _abrirControleRemoto() {
    const a = this._idDe("tvRemote");
    if (!a) return;
    const o = this._idDe("tvMedia") ?? this._idDe("tv"), e = (n) => ({
      action: "perform-action",
      perform_action: "remote.send_command",
      target: { entity_id: a },
      data: { command: n }
    }), i = (n, p, s, c, m = !1) => ({
      type: "button",
      name: n,
      icon: p,
      label: c,
      tap_action: e(s),
      ...m ? { hold_action: { action: "repeat" } } : {}
    }), t = `
      :host {
        --remote-accent: rgba(244, 194, 96, 0.96);
        --remote-accent-soft: rgba(244, 194, 96, 0.16);
        --remote-text: rgba(248, 248, 250, 0.96);
        --remote-muted: rgba(235, 235, 242, 0.58);
        --remote-divider: rgba(255, 255, 255, 0.105);
        display: block;
        width: min(390px, calc(100vw - 28px));
        max-width: 100%;
        box-sizing: border-box;
        margin: clamp(12px, 3.2dvh, 34px) auto;
        padding: 10px 10px 14px;
        border-radius: 30px;
        overflow: hidden;
        color: var(--remote-text);
        background:
          radial-gradient(360px 240px at 18% -10%, rgba(255, 255, 255, 0.105), transparent 64%),
          linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.060),
            rgba(255, 255, 255, 0.018) 48%,
            rgba(0, 0, 0, 0.035)
          ),
          rgba(0, 0, 0, 0.300);
        backdrop-filter: blur(20px) saturate(1.18) brightness(1.03);
        -webkit-backdrop-filter: blur(20px) saturate(1.18) brightness(1.03);
        border: 1px solid rgba(255, 255, 255, 0.075);
        box-shadow:
          0 24px 68px -24px rgba(0, 0, 0, 0.78),
          inset 0 1px 0 rgba(255, 255, 255, 0.11);
      }

      .row {
        width: 100%;
        box-sizing: border-box;
        justify-content: center;
        align-items: center;
        gap: 0;
        margin: 0 0 10px;
      }

      #row-1,
      #row-3,
      #row-4 {
        padding: 4px;
        border-radius: 20px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.016)),
          rgba(10, 12, 16, 0.24);
        border: 1px solid rgba(255, 255, 255, 0.055);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
      }

      #row-2 {
        margin: 2px 0 14px;
      }

      /* Filetes curtos e translúcidos entre todos os botões das barras.
         O gradiente evita a aparência de grade rígida e mantém a linguagem
         VisionOS da composição de referência. */
      #row-1 remote-button + remote-button,
      #row-3 remote-button + remote-button,
      #row-4 remote-button + remote-button {
        background-image: linear-gradient(
          180deg,
          transparent 8%,
          var(--remote-divider) 24%,
          var(--remote-divider) 76%,
          transparent 92%
        );
        background-size: 1px 78%;
        background-position: left center;
        background-repeat: no-repeat;
      }

      remote-button {
        flex: 1 1 0;
        min-width: 0;
        margin: 0;
        padding: 0;
        border-radius: 16px;
        background: transparent;
        --icon-size: 25px;
        --icon-color: var(--remote-text);
      }

      remote-button::part(button) {
        min-height: 60px;
        border-radius: 16px;
        background: transparent;
        transition: background 120ms ease, transform 120ms ease, box-shadow 120ms ease;
      }

      remote-button:active::part(button) {
        transform: scale(0.965);
        background: rgba(255, 255, 255, 0.075);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
      }

      remote-button::part(icon) {
        color: var(--remote-text);
        filter: drop-shadow(0 1px 5px rgba(0,0,0,0.25));
      }

      remote-button::part(label) {
        color: var(--remote-muted);
        font-size: 9.5px;
        line-height: 1.1;
        font-weight: 650;
        letter-spacing: 0.075em;
        text-transform: uppercase;
        margin-top: 5px;
      }

      #power::part(icon),
      #home::part(icon) {
        color: var(--remote-accent);
        filter: drop-shadow(0 0 7px rgba(244, 194, 96, 0.34));
      }

      #power::part(button),
      #home::part(button) {
        background: radial-gradient(circle at 50% 50%, var(--remote-accent-soft), transparent 68%);
      }

      #row-4 remote-button::part(button) {
        min-height: 54px;
      }

      #row-4 remote-button::part(label) {
        font-size: 8.5px;
        letter-spacing: 0.055em;
      }

      @media (max-width: 390px) {
        :host {
          width: calc(100vw - 20px);
          border-radius: 26px;
          padding: 8px 8px 12px;
        }
        remote-button::part(button) { min-height: 56px; }
        #row-4 remote-button::part(button) { min-height: 50px; }
        #navigation { margin-inline: auto; }
      }
    `, r = `
      :host {
        width: min(72vw, 282px);
        max-width: 282px;
        margin: 2px auto;
        --icon-size: 29px;
        --icon-color: rgba(248, 248, 250, 0.90);
      }

      .circlepad {
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        overflow: hidden;
        background:
          /* quatro filetes diagonais delimitam UP / RIGHT / DOWN / LEFT sem
             criar quatro botões visivelmente separados */
          repeating-conic-gradient(
            from 45deg at 50% 50%,
            transparent 0deg 89.15deg,
            rgba(255,255,255,0.115) 89.15deg 90deg
          ),
          radial-gradient(circle at 42% 32%, rgba(255,255,255,0.075), transparent 43%),
          linear-gradient(145deg, rgba(36,39,45,0.84), rgba(10,12,16,0.82));
        border: 1px solid rgba(255,255,255,0.09);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -14px 30px rgba(0,0,0,0.18),
          0 18px 38px -26px rgba(0,0,0,0.95);
      }

      #up::part(button),
      #down::part(button),
      #left::part(button),
      #right::part(button) {
        background: transparent;
      }

      .center-row {
        align-items: center;
        justify-content: center;
      }

      #left,
      #right {
        flex: 1 1 0;
        min-width: 0;
        align-self: stretch;
      }

      /* O centro da round5 herdava a célula retangular do circlepad e o botão
         virava oval. A round6 fixa host e part no mesmo quadrado. */
      #center {
        flex: 0 0 43%;
        width: 43%;
        max-width: 122px;
        aspect-ratio: 1 / 1;
        align-self: center;
        border-radius: 50%;
        overflow: hidden;
      }

      #up::part(icon),
      #down::part(icon),
      #left::part(icon),
      #right::part(icon) {
        color: rgba(248,248,250,0.88);
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.34));
      }

      #center::part(button) {
        width: 100%;
        height: 100%;
        min-width: 100%;
        min-height: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        background:
          radial-gradient(circle at 42% 30%, rgba(244,194,96,0.24), rgba(26,24,21,0.80) 58%, rgba(12,13,16,0.92));
        border: 1px solid rgba(244,194,96,0.40);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.11),
          0 0 0 5px rgba(244,194,96,0.045),
          0 0 22px rgba(244,194,96,0.13);
      }

      #center::part(icon) {
        color: rgba(255, 223, 158, 0.98);
        --icon-size: 31px;
        filter: drop-shadow(0 0 7px rgba(244,194,96,0.30));
      }
    `;
    this.dispatchEvent(
      new CustomEvent("ll-custom", {
        bubbles: !0,
        composed: !0,
        detail: {
          action: "fire-dom-event",
          browser_mod: {
            service: "browser_mod.popup",
            data: {
              title: "Controle da TV",
              tag: "tv_remote",
              style: "--popup-background-color: rgba(6,8,12,0.18); --popup-min-width: min(390px, 96vw); --popup-max-width: min(430px, 96vw); --popup-border-width: 0;",
              popup_styles: [
                {
                  style: "all",
                  styles: `
                    ha-dialog {
                      --dialog-surface-margin-top: auto !important;
                    }
                  `
                }
              ],
              content: {
                type: "custom:universal-remote-card",
                remote_id: a,
                media_player_id: o,
                autofill: !1,
                haptics: !0,
                rows: [
                  ["power", "input", "menu"],
                  ["navigation"],
                  ["back", "home", "mute"],
                  ["volume_down", "volume_up", "channel_down", "channel_up"]
                ],
                custom_actions: [
                  i("power", "mdi:power", "POWER", "Power"),
                  i("input", "mdi:import", "TV", "Entrada"),
                  i("menu", "mdi:menu", "MENU", "Menu"),
                  {
                    type: "circlepad",
                    name: "navigation",
                    icon: "mdi:check-bold",
                    label: "OK",
                    tap_action: e("DPAD_CENTER"),
                    up: { icon: "mdi:chevron-up", tap_action: e("DPAD_UP"), hold_action: { action: "repeat" } },
                    down: { icon: "mdi:chevron-down", tap_action: e("DPAD_DOWN"), hold_action: { action: "repeat" } },
                    left: { icon: "mdi:chevron-left", tap_action: e("DPAD_LEFT"), hold_action: { action: "repeat" } },
                    right: { icon: "mdi:chevron-right", tap_action: e("DPAD_RIGHT"), hold_action: { action: "repeat" } },
                    styles: r
                  },
                  i("back", "mdi:keyboard-backspace", "BACK", "Voltar"),
                  i("home", "mdi:home", "HOME", "Início"),
                  i("mute", "mdi:volume-off", "MUTE", "Mudo"),
                  i("volume_down", "mdi:volume-minus", "VOLUME_DOWN", "Vol −", !0),
                  i("volume_up", "mdi:volume-plus", "VOLUME_UP", "Vol +", !0),
                  i("channel_down", "mdi:chevron-down", "CHANNEL_DOWN", "Canal −", !0),
                  i("channel_up", "mdi:chevron-up", "CHANNEL_UP", "Canal +", !0)
                ],
                styles: t
              }
            }
          }
        }
      })
    );
  }
  _corpoPc() {
    const a = this._modeloPc(), o = this._sub?.pcImage ?? oo, e = a.ativo ? [a.sessao, a.janela].filter((t) => t && t !== "--")[0] || "Sessão ativa" : "Pronto para ligar", i = (t) => () => {
      const r = this._idDe(t);
      r && this._servico("button", "press", { entity_id: r });
    };
    return l`
      <div class="mh-left">
        <div class="mh-info"><small>${a.ativo ? "Ligado" : "Desligado"}</small><em>${e}</em></div>
        <div class="mh-controls">
          ${a.ativo ? l`<div class="mh-btn-row mh-btn-row-5 office-pc-actions">
                ${this._botaoMidia("Sleep", "mdi:weather-night", i("pcSleep"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcSleep")
    })}
                ${this._botaoMidia("Reiniciar", "mdi:restart", i("pcRestart"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcRestart")
    })}
                ${this._botaoMidia("Desligar", "mdi:power-standby", i("pcShutdown"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcShutdown")
    })}
                ${this._botaoMidia("Bloquear", "mdi:lock-outline", i("pcLock"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcLock")
    })}
                ${this._botaoMidia(
      a.sessao && a.sessao !== "--" ? a.sessao : "Sessão",
      "mdi:account-clock-outline",
      () => this._maisInfo(this._idDe("pcSession")),
      { soIcone: !0 }
    )}
              </div>` : l`<div class="mh-btn-row mh-btn-row-3">
                ${this._botaoMidia("Ligar PC", "mdi:power", i("pcPower"), {
      principal: !0,
      desabilitado: !this._idDe("pcPower")
    })}
              </div>`}
        </div>
      </div>
      ${this._arteMidia(o, "wide", "mdi:desktop-tower", !1)}
    `;
  }
  _corpoSpotify() {
    const a = this._modeloSpotify(), o = this._idDe("spotify"), e = this._sub?.spotifyStandbyImage ?? ao;
    if (!a.ativo)
      return l`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>${a.dispositivo}</em></div>
          <div class="mh-controls">
            ${this._botaoMidia("Dispositivos", "mdi:speaker-wireless", () => this._abrirSpotifyPlus("devices"), {
        principal: !0,
        desabilitado: !o
      })}
          </div>
        </div>
        ${this._arteMidia(e, "square", "mdi:music-note", !1)}
      `;
    const i = this._spotifyFerramentas ? l`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia("Dispositivos", "mdi:speaker-wireless", () => this._abrirSpotifyPlus("devices"), { soIcone: !0 })}
          ${this._botaoMidia("Presets", "mdi:bookmark-music-outline", () => this._abrirSpotifyPlus("presets"), { soIcone: !0 })}
          ${this._botaoMidia("Fila", "mdi:playlist-play", () => this._abrirSpotifyPlus("queue"), { soIcone: !0 })}
          ${this._botaoMidia("Voltar", "mdi:chevron-left", () => {
      this._spotifyFerramentas = !1, this.requestUpdate();
    }, { mais: !0 })}
        </div>` : l`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia("Anterior", "mdi:skip-previous", () => this._servico("media_player", "media_previous_track", { entity_id: o }), { soIcone: !0 })}
          ${this._botaoMidia(a.tocando ? "Pausar" : "Tocar", a.tocando ? "mdi:pause" : "mdi:play", () => {
      a.tocando ? this._servico("media_player", "media_pause", { entity_id: o }) : this._tocarSpotify();
    }, { soIcone: !0 })}
          ${this._botaoMidia("Próxima", "mdi:skip-next", () => this._servico("media_player", "media_next_track", { entity_id: o }), { soIcone: !0 })}
          ${this._botaoMidia("Mais", "mdi:plus", () => {
      this._spotifyFerramentas = !0, this.requestUpdate();
    }, { mais: !0 })}
        </div>`;
    return l`
      <div class="mh-left">
        <div class="mh-info">
          <small>${a.titulo}</small>${a.artista ? l`<em>${a.artista}</em>` : b}
          <div class="mh-progress-wrap" aria-label="Progresso da faixa">
            <span class="mh-progress-time">${a.decorrido}</span>
            <div class="mh-progress" aria-hidden="true"><span style=${`width:${a.progresso}%`}></span></div>
            <span class="mh-progress-time">${a.total}</span>
          </div>
        </div>
        <div class="mh-controls">${this._linhaVolume(o, a.volume ?? 66)} ${i}</div>
      </div>
      ${this._arteMidia(a.capa || e, "square", "mdi:music-note", !!a.capa, a.estado === "paused")}
    `;
  }
  /**
   * Abre o SpotifyPlus Card na aba pedida.
   *
   * Mesmo evento e mesma carga da origem: `ll-custom` com `bruno_action:
   * 'spotify'` e a configuração do card. Quem monta a janela é a shell.
   */
  _abrirSpotifyPlus(a) {
    const o = this._idDe("spotify");
    o && this.dispatchEvent(
      new CustomEvent("ll-custom", {
        bubbles: !0,
        composed: !0,
        detail: {
          action: "fire-dom-event",
          bruno_action: "spotify",
          bruno_spotify_config: {
            entity: o,
            deviceDefaultId: this._sub?.spotifyDeviceName,
            mode: a
          }
        }
      })
    );
  }
  /**
   * Retomar o Spotify no dispositivo do cômodo.
   *
   * `media_player.media_play` sem dispositivo ativo dá erro. A origem transfere
   * a reprodução com `spotifyplus.player_transfer_playback`, ativando o
   * dispositivo pelo nome; só cai no serviço genérico quando o cômodo não
   * declara dispositivo.
   */
  _tocarSpotify() {
    const a = this._idDe("spotify");
    if (!a) return;
    const o = this._sub?.spotifyDeviceName || String(this._estado(a)?.attributes.source ?? "");
    if (o) {
      this._servico("spotifyplus", "player_transfer_playback", {
        entity_id: a,
        device_id: o,
        play: !0,
        delay: 0.75,
        force_activate_device: !0
      });
      return;
    }
    this._servico("media_player", "media_play", { entity_id: a });
  }
  _maisInfo(a) {
    a && (V(a) && (this._tokenDefinicaoPlayer++, this._estadoAoVivo = "entregue-more-info", R(a, "entregue ao more-info"), this._pararAoVivo(), this._sincronizarCameras()), this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: a },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  /**
   * Hub de mídia: acordeão de duas fontes — TV (ou PC, no Office) e Spotify.
   *
   * Só uma fica aberta por vez, no próprio lugar da lista: a fonte nunca é
   * promovida ao topo. A entrada do PS5 vive no menu de três pontos, e só onde
   * há entidade — hoje, apenas a Sala.
   */
  _renderMediaHub() {
    const a = this._temPc, o = a ? void 0 : this._modeloTv(), e = a ? this._modeloPc() : void 0, i = this._modeloSpotify(), r = [
      a ? {
        chave: "pc",
        rotulo: "PC",
        icone: "mdi:desktop-tower",
        ativo: !!e?.ativo,
        tocando: !!e?.ativo,
        resumo: e?.ativo ? "Ligado" : "Desligado",
        atmosfera: "",
        corpo: () => this._corpoPc()
      } : {
        chave: "tv",
        rotulo: this._room?.id === "sala" ? "TV da sala" : "TV",
        icone: "mdi:television-classic",
        ativo: !!o?.ativo,
        tocando: !!o?.reproduzindo,
        resumo: o?.ativo ? `Ligada · ${o.fonte}` : "Desligada",
        atmosfera: o?.ativo ? o.poster : "",
        corpo: () => this._corpoTv()
      },
      {
        chave: "spotify",
        rotulo: "Spotify",
        icone: "mdi:spotify",
        ativo: i.ativo,
        tocando: i.tocando,
        resumo: i.ativo ? i.titulo : "Nenhuma faixa",
        atmosfera: i.ativo ? i.capa : "",
        corpo: () => this._corpoSpotify()
      }
    ], n = Object.fromEntries(r.map((d) => [d.chave, d.ativo])), p = !a && r.some((d) => d.tocando) ? Object.fromEntries(r.map((d) => [d.chave, !!d.tocando])) : n, s = this._fonteAberta(r.map((d) => d.chave), p), c = !!r.find((d) => d.chave === s)?.tocando, m = [
      "glass-card",
      "media-hub-card",
      a ? "workspace-hub-card" : "",
      "mh-accordion",
      c ? "is-playing" : "",
      this._menuMidiaAberto ? "is-menu-open" : ""
    ].filter(Boolean).join(" ");
    return l`
      <div class=${m}>
        <div class="mh-head">
          <div class="mh-head-title">
            <span class="micro-icon ${a ? "" : "tone-amber"}">
              <bruno-icon icon=${a ? "mdi:desk" : "mdi:multimedia"}></bruno-icon>
            </span>
            <div class="module-title">${a ? "Estação de Trabalho" : "Hub de Mídia"}</div>
            ${this._botaoRecolherFolha()}
          </div>
          <button
            type="button"
            class="mh-menu ${this._menuMidiaAberto ? "is-active" : ""}"
            title="Opções"
            aria-label="Opções"
            aria-expanded=${this._menuMidiaAberto ? "true" : "false"}
            @click=${() => {
      this._menuMidiaAberto = !this._menuMidiaAberto, this.requestUpdate();
    }}
          >
            <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
          </button>
          ${this._botaoFecharFolha()}
        </div>
        ${this._menuMidiaAberto ? this._renderMenuMidia() : b}
        <div class="mh-sources">
          ${r.map((d) => {
      const g = d.chave === s, x = ["mh-source", g ? "is-open" : "", d.ativo ? "is-active" : ""].filter(Boolean).join(" "), y = [
        "mh-source-body",
        `mh-source-body-${d.chave}`,
        d.ativo ? "is-source-active" : "is-source-idle",
        d.atmosfera ? "has-atmosphere" : ""
      ].filter(Boolean).join(" ");
      return l`
              <div class=${x}>
                <button
                  type="button"
                  class="mh-source-head"
                  aria-expanded=${g ? "true" : "false"}
                  @click=${() => this._selecionarFonteMidia(d.chave)}
                >
                  <bruno-icon
                    class="mh-src-icon ${d.chave === "spotify" ? "mh-icon-spotify" : ""}"
                    icon=${d.icone}
                  ></bruno-icon>
                  <span class="mh-src-name">${d.rotulo}</span>
                  <span class="mh-src-summary">${d.resumo}</span>
                  ${g ? b : l`<bruno-icon class="mh-src-chevron" icon="mdi:chevron-right"></bruno-icon>`}
                </button>
                ${g ? l`<div class=${y}>
                      ${this._estaNoTelefone() && d.atmosfera ? l`<img class="mh-now-atmosphere" src=${d.atmosfera} alt="" aria-hidden="true" />` : b}
                      ${d.corpo()}
                    </div>` : b}
              </div>
            `;
    })}
        </div>
      </div>
    `;
  }
  /** O menu de três pontos. Só a Sala tem PS5; nos demais fica o more-info. */
  _renderMenuMidia() {
    const a = this._idDe("ps5"), e = this._estado(a)?.state === "on", i = a ? [{ icone: "mdi:sony-playstation", titulo: "PS5", sub: e ? "Online" : "Offline", entidade: a, ativo: e }] : [];
    return i.length ? l`
      <div class="mh-overflow-panel" role="menu" aria-label="Opções de mídia">
        ${i.map(
      (t) => l`
            <div class="mh-overflow-item">
              <span class="mh-overflow-icon"><bruno-icon icon=${t.icone}></bruno-icon></span>
              <span class="mh-overflow-copy"><strong>${t.titulo}</strong><small>${t.sub}</small></span>
              <button
                type="button"
                class="mh-overflow-action ${t.ativo ? "is-active" : ""}"
                title=${t.ativo ? "Desligar PS5" : "Ligar PS5"}
                aria-label=${t.ativo ? "Desligar PS5" : "Ligar PS5"}
                @click=${() => this._servico("homeassistant", "toggle", { entity_id: t.entidade })}
              >
                <bruno-icon icon="mdi:power"></bruno-icon>
              </button>
              <button
                type="button"
                class="mh-overflow-action"
                title="Detalhes"
                aria-label="Detalhes do PS5"
                @click=${() => this._maisInfo(t.entidade)}
              >
                <bruno-icon icon="mdi:dots-horizontal"></bruno-icon>
              </button>
            </div>
          `
    )}
      </div>
    ` : b;
  }
  /**
   * Os cinco eletrodomésticos da Cozinha.
   *
   * Cada tile tem imagem, nome e o estado em texto. Só a lava-louças tem
   * entidade hoje; os demais são placeholders com `is-muted`, como no original —
   * aparecem, mas não prometem controle que não existe.
   */
  _renderEletrodomesticos() {
    const a = this._sub?.entities?.appliances;
    return Array.isArray(a) ? a.filter((o) => !!o && typeof o == "object").map((o) => {
      const e = String(o.key ?? "item").replace(/[^a-z0-9_-]/gi, "-").toLowerCase(), i = String(o.name ?? "Eletrodoméstico"), t = typeof o.image == "string" ? o.image : "", r = typeof o.entity == "string" ? o.entity : "", n = typeof o.stateEntity == "string" ? o.stateEntity : r, p = n && this._hass ? this._hass.states[n] : void 0, s = Array.isArray(o.activeStates) ? o.activeStates.map((C) => String(C).toLowerCase()) : ["on"], c = typeof o.activeAttr == "string" ? o.activeAttr : "", m = this._room?.activeSensor ? this._hass?.states[this._room.activeSensor] : void 0, d = s.includes(String(p?.state ?? "").toLowerCase()) || (c ? La(m?.attributes[c]) : !1), g = !!o.placeholder || !r, x = typeof o.moreInfoEntity == "string" ? o.moreInfoEntity : r, y = ["appliance-tile", `is-${e}`, d ? "is-on" : "", g ? "is-muted" : ""].filter(Boolean).join(" ");
      return l`
          <article class=${y}>
            <button
              type="button"
              class="appliance-main"
              aria-label=${i}
              ?disabled=${g}
              @click=${() => !g && this._alternarAparelho(r)}
            >
              <div class="appliance-visual" data-image-wrapper>
                ${t ? l`<img src=${t} alt="" loading="lazy" decoding="async" />` : b}
              </div>
              <div class="appliance-copy">
                <strong>${i}</strong>
                <small>${this._rotuloDoAparelho(o, p, d, g)}</small>
              </div>
            </button>
            <button
              type="button"
              class="mh-menu appliance-more"
              title="Mais detalhes"
              aria-label=${`Mais detalhes de ${i}`}
              ?disabled=${!x}
              @click=${() => this._maisInfo(x)}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </article>
        `;
    }) : b;
  }
  /** Rótulo de estado: os textos vêm da configuração, como no original. */
  _rotuloDoAparelho(a, o, e, i) {
    const t = (n, p) => typeof a[n] == "string" ? a[n] : p;
    if (i) return t("placeholderLabel", "Sem tomada");
    if (!o) return "Indisponível";
    if (e) return t("activeLabel", "Ligada");
    const r = String(o.state).toLowerCase();
    return r === "off" || r === "unavailable" ? t("offLabel", "Desligada") : t("idleLabel", "Ligada");
  }
  _alternarAparelho(a) {
    if (!this._hass) return;
    const o = a.split(".")[0] ?? "switch";
    this._hass.callService(o, "toggle", { entity_id: a }, { entity_id: a });
  }
  _entidadeClimate() {
    return this._idDe("climate");
  }
  _estadoClimate() {
    return this._estado(this._entidadeClimate());
  }
  /**
   * O A/C está trabalhando?
   *
   * `hvac_action` manda quando existe: um aparelho em `cool` mas com a ação
   * `idle` não está resfriando. Sem ela, vale o estado.
   */
  _modeloClimate() {
    const a = this._estadoClimate(), o = a?.attributes ?? {}, e = String(o.hvac_action ?? "").toLowerCase(), i = this._indisponivel(a), t = i || a?.state === "off" ? !1 : Ua.includes(e) ? !0 : Ha.includes(e) ? !1 : Ba.includes(String(a?.state ?? "")), r = (n, p) => Number.isFinite(Number(n)) ? Number(n) : p;
    return {
      st: a,
      indisponivel: i,
      ativo: t,
      alvo: r(o.temperature, null),
      atual: r(o.current_temperature, null),
      minima: r(o.min_temp, 16),
      maxima: r(o.max_temp, 30),
      modo: a?.state ?? "off",
      ventilacao: String(o.fan_mode ?? "auto"),
      swing: String(o.swing_mode ?? ""),
      modos: Array.isArray(o.hvac_modes) ? o.hvac_modes : [],
      ventilacoes: Array.isArray(o.fan_modes) ? o.fan_modes : [],
      swings: Array.isArray(o.swing_modes) ? o.swing_modes : []
    };
  }
  _rotuloModo(a) {
    return {
      off: "Desligado",
      cool: "Frio",
      heat: "Aquecimento",
      fan_only: "Ventilar",
      dry: "Secar",
      heat_cool: "Auto",
      auto: "Auto"
    }[String(a).toLowerCase()] ?? P(a);
  }
  _iconeModo(a) {
    return {
      off: "mdi:power",
      cool: "mdi:snowflake",
      heat: "mdi:fire",
      fan_only: "mdi:fan",
      dry: "mdi:water-percent",
      auto: "mdi:autorenew",
      heat_cool: "mdi:autorenew"
    }[String(a).toLowerCase()] ?? "mdi:thermostat";
  }
  _rotuloVentilacao(a) {
    const o = String(a).toLowerCase();
    return o === "auto" ? "Auto" : o.includes("low") || o.includes("baixo") ? "Baixa" : o.includes("med") ? "Média" : o.includes("high") || o.includes("alto") ? "Alta" : o.includes("fort") ? "Forte" : P(a);
  }
  _iconeVentilacao(a) {
    const o = String(a).toLowerCase();
    return o.includes("auto") ? "mdi:fan-auto" : o.includes("low") || o.includes("baixo") ? "mdi:fan-speed-1" : o.includes("med") ? "mdi:fan-speed-2" : o.includes("high") || o.includes("alto") || o.includes("fort") ? "mdi:fan-speed-3" : "mdi:fan";
  }
  _rotuloSwing(a) {
    const o = String(a).toLowerCase();
    return o ? ["off", "desativado", "desativada", "disabled"].includes(o) ? "Desligado" : ["on", "ativo", "ativada", "enabled"].includes(o) ? "Ativo" : P(a) : "Indisponível";
  }
  /**
   * O anel — gauge semicircular de 180°, do mínimo à esquerda ao máximo à
   * direita, com o alvo no arco aceso e a temperatura ambiente sob a linha.
   *
   * A caixa preserva a geometria original: centro em (360, 410), viewBox
   * 720×460. O arco luminoso tem raio próprio; marcas, textos, Power, Swing e
   * todos os containers externos mantêm exatamente a geometria aprovada.
   */
  _renderAnelClimate(a) {
    const s = Number.isFinite(a.minima) ? a.minima : 12, c = Number.isFinite(a.maxima) ? a.maxima : 30, m = Number.isFinite(Number(a.alvo)) ? Math.max(s, Math.min(c, Number(a.alvo))) : s + (c - s) / 2, g = -180 + 180 * Math.max(0, Math.min(1, (m - s) / Math.max(1, c - s))), x = (f, _) => {
      const q = _ * Math.PI / 180;
      return { x: 360 + f * Math.cos(q), y: 410 + f * Math.sin(q) };
    }, y = (f, _, q) => {
      const k = x(f, _), z = x(f, q), T = Math.abs(q - _) <= 180 ? "0" : "1";
      return `M ${k.x.toFixed(3)} ${k.y.toFixed(3)} A ${f} ${f} 0 ${T} 1 ${z.x.toFixed(3)} ${z.y.toFixed(3)}`;
    }, C = Array.from({ length: 91 }, (f, _) => {
      const q = -180 + 180 * (_ / 90), k = _ % 15 === 0, z = _ % 5 === 0, T = x(334, q), U = x(
        k ? 308 : z ? 314 : 321,
        q
      ), ta = k ? "icg-tick major" : z ? "icg-tick medium" : "icg-tick minor";
      return F`<line x1=${T.x.toFixed(3)} y1=${T.y.toFixed(3)} x2=${U.x.toFixed(3)} y2=${U.y.toFixed(3)} class=${ta}></line>`;
    }), oa = Array.from({ length: 73 }, (f, _) => {
      const q = -180 + 180 * (_ / 72), k = x(282, q), z = x(266, q);
      return F`<line x1=${k.x.toFixed(3)} y1=${k.y.toFixed(3)} x2=${z.x.toFixed(3)} y2=${z.y.toFixed(3)} class="icg-inner-tick"></line>`;
    }), ea = [
      { texto: `${M(s, 0)}°`, ang: -180, r: 352, cls: "edge" },
      { texto: "10", ang: -148, r: 358, cls: "" },
      { texto: "20", ang: -90, r: 352, cls: "top" },
      { texto: "25", ang: -32, r: 358, cls: "" },
      { texto: `${M(c, 0)}°`, ang: 0, r: 352, cls: "edge" }
    ].map((f) => {
      const _ = x(f.r, f.ang);
      return F`<text x=${_.x.toFixed(3)} y=${_.y.toFixed(3)} text-anchor="middle" dominant-baseline="middle" class=${`icg-label ${f.cls}`}>${f.texto}</text>`;
    }), $ = x(315, g), j = a.alvo == null ? "--" : M(a.alvo, 0), B = a.atual == null ? "--" : M(a.atual, 1), ia = (a.modo === "cool" ? "Resfriamento" : a.modo === "heat" ? "Aquecimento" : a.modo === "fan_only" ? "Ventilacao" : "Temperatura").toUpperCase();
    return l`
      <div class="icg-root">
        <div class="icg-shell">
          <svg
            class="icg-svg"
            viewBox="0 0 720 460"
            role="img"
            aria-label=${`Temperatura alvo ${j}°. Ambiente ${B}°.`}
          >
            <defs>
              <linearGradient id="icgActiveBlue" x1="90" y1="340" x2="560" y2="90">
                <stop offset="0%" stop-color="#0078ff"></stop>
                <stop offset="38%" stop-color="#1fb7ff"></stop>
                <stop offset="72%" stop-color="#3ed6ff"></stop>
                <stop offset="100%" stop-color="#96f0ff"></stop>
              </linearGradient>
              <filter id="icgBlueGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="7" result="blur"></feGaussianBlur>
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="0 0 0 0 0.02  0 0 0 0 0.42  0 0 0 0 1  0 0 0 0.95 0"
                ></feColorMatrix>
                <feMerge><feMergeNode></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
              <filter id="icgTextGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#dcecff" flood-opacity="0.24"></feDropShadow>
              </filter>
            </defs>
            <path d=${y(315, -180, 0)} class="icg-track-shadow"></path>
            <path d=${y(315, g, 0)} class="icg-track-muted"></path>
            <path d=${y(315, -180, g)} class="icg-active-glow"></path>
            <path d=${y(315, -180, g)} class="icg-active-arc"></path>
            <g>${C}</g>
            <g>${oa}</g>
            ${ea}
            <circle cx=${$.x.toFixed(3)} cy=${$.y.toFixed(3)} r="21" class="icg-marker-glow"></circle>
            <circle cx=${$.x.toFixed(3)} cy=${$.y.toFixed(3)} r="13" class="icg-marker-ring"></circle>
            <circle
              cx=${($.x - 4).toFixed(3)}
              cy=${($.y - 5).toFixed(3)}
              r="4"
              class="icg-marker-highlight"
            ></circle>
            <text x=${360} y="260" text-anchor="middle" dominant-baseline="middle" class="icg-center-mode">
              ${ia}
            </text>
            <text x=${360} y="328" text-anchor="middle" dominant-baseline="middle" class="icg-center-temp">
              ${j}°
            </text>
            <text x=${360} y="382" text-anchor="middle" dominant-baseline="middle" class="icg-center-sub">
              SET TEMPERATURE
            </text>
            <line x1=${332} y1="408" x2=${388} y2="408" class="icg-center-line"></line>
            <text x=${360} y="432" text-anchor="middle" dominant-baseline="middle" class="icg-ambient">
              Ambient ${B}°
            </text>
          </svg>
        </div>
      </div>
    `;
  }
  /** A/C: cabeçalho com power, anel de temperatura e três controles na base. */
  _renderAC() {
    const a = this._entidadeClimate(), o = this._modeloClimate(), e = o.swing.toLowerCase(), i = ["on", "ativo", "ativada", "enabled"].includes(e) || e.includes("ativ") && !e.includes("desativ"), t = (c) => [...new Set(c.filter(Boolean))], r = this._painelClima, n = {
      mode: t(o.modos).map((c) => ({
        modo: c,
        rotulo: this._rotuloModo(c),
        icone: this._iconeModo(c),
        ativo: c.toLowerCase() === String(o.modo).toLowerCase(),
        servico: "set_hvac_mode",
        campo: "hvac_mode"
      })),
      fan: t(o.ventilacoes).map((c) => ({
        modo: c,
        rotulo: this._rotuloVentilacao(c),
        icone: this._iconeVentilacao(c),
        ativo: c.toLowerCase() === o.ventilacao.toLowerCase(),
        servico: "set_fan_mode",
        campo: "fan_mode"
      })),
      swing: t(o.swings).map((c) => ({
        modo: c,
        rotulo: this._rotuloSwing(c),
        icone: c.toLowerCase() === "off" ? "mdi:air-conditioner" : "mdi:swap-vertical",
        ativo: c.toLowerCase() === e,
        servico: "set_swing_mode",
        campo: "swing_mode"
      }))
    }, p = (c) => {
      if (r !== c) return b;
      const m = n[c];
      return m.length ? l`<div class="ac-popover" role="menu">
        ${m.map(
        (d) => l`
            <button
              type="button"
              class="ac-popover-option ${d.ativo ? "is-active" : ""}"
              role="menuitem"
              @click=${() => {
          this._painelClima = "", a && this._servico("climate", d.servico, { entity_id: a, [d.campo]: d.modo }), this.requestUpdate();
        }}
            >
              <bruno-icon icon=${d.icone}></bruno-icon><span>${d.rotulo}</span>
            </button>
          `
      )}
      </div>` : l`<div class="ac-popover" role="menu">
          <button type="button" class="ac-popover-option" disabled>
            <bruno-icon icon="mdi:alert-circle-outline"></bruno-icon><span>Indisponível</span>
          </button>
        </div>`;
    }, s = (c, m, d, g) => l`
      <div class="ac-control-wrap">
        <button
          type="button"
          class="ac-action ${r === c ? "is-open" : ""}"
          aria-expanded=${r === c ? "true" : "false"}
          ?disabled=${o.indisponivel || !a}
          @click=${() => {
      this._painelClima = this._painelClima === c ? "" : c, this.requestUpdate();
    }}
        >
          <span class="ac-action-icon"><bruno-icon icon=${m}></bruno-icon></span>
          <span class="ac-action-text"><small>${d}</small><strong>${g}</strong></span>
        </button>
        ${p(c)}
      </div>
    `;
    return l`
      <div class="glass-card ac-card ac-card-lean">
        <div class="ac-lean-head">
          <div class="mh-head-title ac-head-title">
            <span class="micro-icon tone-cyan"><bruno-icon icon="mdi:air-conditioner"></bruno-icon></span>
            <div class="module-title">Ar-condicionado</div>
            ${this._botaoRecolherFolha()}
          </div>
          <div class="ac-top-stack">
            <button
              type="button"
              class="mh-menu ac-more-button"
              title="Mais detalhes"
              aria-label="Mais detalhes"
              @click=${() => {
      this._painelClima = "", this._maisInfo(a);
    }}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
            <button
              type="button"
              class="ac-power-floating ${o.ativo ? "is-active" : ""}"
              aria-label=${o.ativo ? "Desligar ar condicionado" : "Ligar ar condicionado"}
              ?disabled=${o.indisponivel || !a}
              @click=${() => {
      a && (this._painelClima = "", this._servico("climate", o.ativo ? "turn_off" : "turn_on", { entity_id: a }));
    }}
            >
              <bruno-icon icon="mdi:power"></bruno-icon>
            </button>
            ${this._botaoFecharFolha()}
          </div>
        </div>
        <div class="ac-lean-mid">
          <div class="ac-ring">${this._renderAnelClimate(o)}</div>
        </div>
        <div class="ac-lean-foot">
          ${s(
      "mode",
      "mdi:thermostat-auto",
      "Modo",
      !o.ativo || o.modo === "off" ? "Desligado" : this._rotuloModo(o.modo)
    )}
          ${s("fan", "mdi:fan", "Ventilação", this._rotuloVentilacao(o.ventilacao))}
          ${s(
      "swing",
      "mdi:air-conditioner",
      "Swing",
      o.swing ? this._rotuloSwing(o.swing) : i ? "Ativo" : "Desligado"
    )}
        </div>
      </div>
    `;
  }
  /**
   * Cozinha: grid próprio de três colunas.
   *
   *   "topband topband topband"
   *   "hero    hero    right"
   *   "cams    appliances appliances"
   *
   * Não há `content-left` nem A/C, e o hero, as câmeras e os eletrodomésticos
   * são filhos DIRETOS da raiz — cada um ocupando sua área. Lido do DOM da
   * subview atual; deduzir do CSS teria dado o grid errado, porque o arquivo
   * guarda definições antigas empilhadas.
   */
  _corpoCozinha() {
    return l`
      <div class="hero-panel is-unconfigured">
        <div class="hero-stage hero-atmosphere"><div class="hero-content"></div></div>
      </div>
      <div class="right-column">${this._renderLightsDock()}</div>
      ${this._renderCameras()}
      <div class="glass-card appliances-card kitchen-appliances-card">
        <div class="mh-head appliances-head">
          <div class="mh-head-title">
            <!-- O nome tem de ser um dos apelidos da tabela de Hugeicons.
                 "silverware-fork-knife" não está lá e caía no genérico — o
                 círculo que aparecia no lugar do ícone. O original usa este,
                 que resolve para "hugeicons:electric-home-01". -->
            <span class="micro-icon tone-amber">
              <bruno-icon icon="mdi:home-lightning-bolt-outline"></bruno-icon>
            </span>
            <div class="module-title">Eletrodomésticos</div>
            ${this._botaoRecolherFolha()}
          </div>
          ${this._botaoFecharFolha()}
        </div>
        <div class="appliances-grid">${this._renderEletrodomesticos()}</div>
      </div>
      ${this._renderResumoTelefone()}
    `;
  }
}
customElements.get("bruno-room-subview") || customElements.define("bruno-room-subview", eo);
const D = window;
D.customCards = D.customCards ?? [];
D.customCards.some((u) => u.type === "bruno-room-subview") || D.customCards.push({
  type: "bruno-room-subview",
  name: "Bruno · Subview de cômodo",
  description: "Subview parametrizada por cômodo (arquitetura nova)."
});
export {
  eo as BrunoRoomSubview
};
//# sourceMappingURL=bruno-room-subview.a9STnX81.js.map
