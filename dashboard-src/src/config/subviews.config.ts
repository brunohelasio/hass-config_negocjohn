/**
 * Configuração das subviews de cômodo — GERADO, não editado à mão.
 *
 * Fonte: as seis `BRUNO_*_SUBVIEW_DEFAULT_CONFIG` dos arquivos atuais em
 * `config/www/bruno-ui/subviews/`. São 67 chaves por cômodo, das quais 58
 * variam — transcrever isso à mão foi como o Q. Casal acabou apontando para um
 * arquivo órfão na Fase 5a.
 *
 * Regenerar:  node scripts/validation/gen-subview-config.mjs
 *
 * As nove chaves idênticas nos seis (`room_nav`, `refresh_interval`,
 * `greeting_name`, imagens do climate…) NÃO entram aqui: viram padrão do
 * componente. Chaves vazias também saem — string vazia era "não configurado".
 *
 * Complementa `rooms.config.ts`, que descreve o TILE. Mesma chave de cômodo.
 */

export interface SubviewConfig {
  title?: string;
  background?: string;
  fallbackBackground?: string;
  spotifyDeviceName?: string;
  climateDeviceName?: string;
  tvStandbyImage?: string;
  spotifyStandbyImage?: string;
  pcImage?: string;
  /** O script de abertura é opcional: nem todo app declara um. */
  tvApps?: readonly { key: string; label: string; image: string; script?: string }[];
  lightZoneLabels?: Record<string, string>;
  lightZoneIcons?: Record<string, string>;
  entities?: Record<string, unknown>;
  [chave: string]: unknown;
}

export const SUBVIEWS: Record<string, SubviewConfig> = {
  sala: {
    title: 'Sala',
    background: '/local/images/sala_estar.jpg?v=20260702-all-images-1',
    fallbackBackground: '/local/images/sala_estar.jpg?v=20260702-all-images-1',
    spotifyDeviceName: 'Echo Show',
    climateDeviceName: 'Gree',
    tvStandbyImage: '/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1',
    spotifyStandbyImage: '/local/images/echo_pop.png?v=20260702-all-images-1',
    tvApps: [
      {
        key: 'netflix',
        label: 'Netflix',
        image: '/local/images/netflix_bg.jpg?v=20260702-all-images-1',
        script: 'script.sala_tv_open_netflix',
      },
      {
        key: 'prime',
        label: 'Prime Video',
        image: '/local/images/prime_video_tile.png?v=20260702-all-images-1',
        script: 'script.sala_tv_open_prime',
      },
      {
        key: 'disney',
        label: 'Disney+',
        image: '/local/images/dp_bg.jpg?v=20260702-all-images-1',
        script: 'script.sala_tv_open_disney',
      },
      {
        key: 'max',
        label: 'Max',
        image: '/local/images/HBOMax_bg.jpg?v=20260702-all-images-1',
        script: 'script.sala_tv_open_hbo',
      },
    ],
    entities: {
      curtain: 'cover.cortina_varanda_cortina_2',
      curtainPercentControl: 'number.cortina_varanda_percent_control',
      activeSensor: 'sensor.living_room_active',
      semanticSensor: 'sensor.sala_semantic_state_supervised',
      motionRecent: 'binary_sensor.sala_motion_recent',
      occupancy: 'binary_sensor.sala_occupancy',
      presence: 'binary_sensor.sensor_4_in_1_sala_presence',
      illuminance: 'sensor.sensor_4_in_1_sala_illuminance',
      temperature: [
        'sensor.sensor_4_in_1_sala_temperature',
        'sensor.sl_sensor_temp_humid_temperatura',
      ],
      humidity: ['sensor.sensor_4_in_1_sala_humidity', 'sensor.sl_sensor_temp_humid_umidade'],
      roomGroup: 'light.grupo_luzes_sala',
      cameraMain: 'camera.sl_camera_2',
      cameraSecondary: 'camera.vr_camera_2',
      activeCameraSelect: 'input_select.bento_active_camera',
      tv: 'media_player.android_tv_192_168_3_17',
      tvRemotePlayer: 'media_player.atv',
      tvRemote: 'remote.atv',
      spotify: 'media_player.spotifyplus_bruno_helasio',
      speaker: 'media_player.echo_show',
      climate: 'climate.sl_ar_condicionado',
      ps5: 'switch.ps5_power',
      ps5Image: '/local/images/ps5.png?v=20260702-all-images-1',
      lights: [
        {
          entity: 'light.sala_switch_2',
          name: 'Luz principal',
          iconType: 'light_flush',
          zone: 'sala',
        },
        {
          entity: 'light.sala_switch_1',
          name: 'Led esquerdo',
          iconType: 'ledstrip',
          zone: 'sala',
        },
        {
          entity: 'light.sala_switch_3',
          name: 'Led direito',
          iconType: 'ledstrip',
          zone: 'sala',
        },
        {
          entity: 'light.sala_2_switch_2',
          name: 'Luz principal',
          iconType: 'ledstrip',
          zone: 'varanda',
        },
        {
          entity: 'light.varanda_switch_2',
          name: 'Pendente',
          iconType: 'pendant',
          zone: 'varanda',
        },
        {
          entity: 'light.varanda_switch_1',
          name: 'Area gourmet',
          iconType: 'ledstrip',
          zone: 'varanda',
        },
        {
          entity: 'light.sala_2_switch_3',
          name: 'Cristaleira',
          iconType: 'ledstrip',
          zone: 'varanda',
        },
      ],
      cameras: [
        {
          entity: 'camera.sl_camera_2',
          name: 'Sala Principal',
          shortName: 'Sala',
          controls: [
            {
              key: 'sound',
              label: 'Som',
              description: 'Detecção de som',
              icon: 'mdi:microphone-outline',
              entity: 'switch.sl_camera_deteccao_de_som',
            },
            {
              key: 'motion',
              label: 'Mov.',
              description: 'Alarme de movimento',
              icon: 'mdi:run-fast',
              entity: 'switch.sl_camera_alarme_de_movimento',
            },
            {
              key: 'privacy',
              label: 'Priv.',
              description: 'Modo de privacidade',
              icon: 'mdi:eye-off-outline',
              entity: 'switch.sl_camera_modo_de_privacidade',
            },
          ],
        },
        {
          entity: 'camera.vr_camera_2',
          name: 'Sala Lateral',
          shortName: 'Varanda',
          controls: [
            {
              key: 'sound',
              label: 'Som',
              description: 'Detecção de som',
              icon: 'mdi:microphone-outline',
              entity: 'switch.vr_camera_deteccao_de_som',
            },
            {
              key: 'motion',
              label: 'Mov.',
              description: 'Alarme de movimento',
              icon: 'mdi:run-fast',
              entity: 'switch.vr_camera_alarme_de_movimento',
            },
            {
              key: 'privacy',
              label: 'Priv.',
              description: 'Modo de privacidade',
              icon: 'mdi:eye-off-outline',
              entity: 'switch.vr_camera_modo_de_privacidade',
            },
          ],
        },
      ],
    },
  },
  office: {
    title: 'Office',
    background: '/local/images/office.jpg?v=20260702-all-images-1',
    fallbackBackground: '/local/images/office.jpg?v=20260702-all-images-1',
    spotifyDeviceName: 'Echo Pop Office',
    climateDeviceName: 'Gree',
    pcImage: '/local/images/office_pc.png?v=20260702-all-images-1',
    spotifyStandbyImage: '/local/images/echo_pop.png?v=20260702-all-images-1',
    entities: {
      activeSensor: 'sensor.office_active',
      semanticSensor: 'sensor.office_semantic_state_supervised',
      motionRecent: 'binary_sensor.office_motion_recent',
      occupancy: 'binary_sensor.office_occupancy',
      meeting: 'binary_sensor.office_meeting_active',
      working: 'binary_sensor.office_working_active',
      presence: 'binary_sensor.sensor_4_in_1_office_presence',
      illuminance: 'sensor.sensor_4_in_1_office_illuminance',
      temperature: ['sensor.sensor_4_in_1_office_temperature'],
      humidity: ['sensor.sensor_4_in_1_office_humidity'],
      roomGroup: 'light.grupo_luzes_office',
      cameraMain: 'camera.of_camera_2',
      spotify: 'media_player.spotifyplus_bruno_helasio',
      speaker: 'media_player.echo_pop_office',
      climate: 'climate.ac_office',
      pcActive: 'binary_sensor.office_pc_active',
      pcPower: 'button.desktop_melg9vv_pc_office_switch',
      pcShutdown: 'button.desktop_melg9vv_pc_office_desliga',
      pcSleep: 'button.desktop_melg9vv_pc_office_sleep',
      pcRestart: 'button.desktop_melg9vv_pc_office_reiniciar',
      pcLock: 'button.desktop_melg9vv_pc_office_bloquear',
      pcSession: 'sensor.desktop_melg9vv_office_pc_session_state',
      pcIdle: 'sensor.desktop_melg9vv_office_pc_idle_time',
      pcWindow: 'sensor.desktop_melg9vv_office_pc_active_window',
      lights: [
        {
          entity: 'light.office_switch_3',
          name: 'Luz central',
          iconType: 'light_flush',
          zone: 'office',
        },
        {
          entity: 'light.office_switch_2',
          name: 'Luz ambiente',
          iconType: 'light_flush',
          zone: 'office',
        },
        {
          entity: 'light.office_switch_1',
          name: 'Luz estante',
          iconType: 'ledstrip',
          zone: 'office',
        },
      ],
      cameras: [
        {
          entity: 'camera.of_camera_2',
          name: 'Office',
          shortName: 'Office',
          controls: [
            {
              key: 'sound',
              label: 'Som',
              description: 'Detecção de som',
              icon: 'mdi:microphone-outline',
              entity: 'switch.of_camera_deteccao_de_som',
            },
            {
              key: 'motion',
              label: 'Mov.',
              description: 'Alarme de movimento',
              icon: 'mdi:run-fast',
              entity: 'switch.of_camera_alarme_de_movimento',
            },
            {
              key: 'privacy',
              label: 'Priv.',
              description: 'Modo de privacidade',
              icon: 'mdi:eye-off-outline',
              entity: 'switch.of_camera_modo_de_privacidade',
            },
          ],
        },
      ],
    },
  },
  cozinha: {
    title: 'Cozinha',
    background: '/local/images/cozinha.jpg?v=20260702-all-images-1',
    fallbackBackground: '/local/images/cozinha.jpg?v=20260702-all-images-1',
    entities: {
      activeSensor: 'sensor.cozinha_active',
      semanticSensor: 'sensor.cozinha_semantic_state_supervised',
      motionRecent: 'binary_sensor.cozinha_motion_recent',
      occupancy: 'binary_sensor.cozinha_occupancy',
      presence: 'binary_sensor.sensor_4_in_1_cozinha_presence',
      illuminance: 'sensor.sensor_4_in_1_cozinha_illuminance',
      temperature: [
        'sensor.sensor_4_in_1_cozinha_temperature',
        'sensor.temperatura_cozinha',
        'sensor.cozinha_temperature',
        'sensor.cozinha_temperatura',
      ],
      humidity: [
        'sensor.sensor_4_in_1_cozinha_humidity',
        'sensor.umidade_cozinha',
        'sensor.cozinha_humidity',
        'sensor.cozinha_umidade',
      ],
      roomGroup: 'light.grupo_luzes_cozinha',
      cameraMain: 'camera.cz_camera_2',
      cameraSecondary: 'camera.as_camera_2',
      dishwasher: 'sensor.lava_loucas_operation_state',
      dishwasherPower: 'switch.cz_tomada_maq_lav_louca_socket_1',
      lights: [
        {
          entity: 'light.cozinha_switch_2',
          name: 'Luz principal 1',
          iconType: 'ledstrip',
          zone: 'cozinha',
        },
        {
          entity: 'light.cozinha_switch_3',
          name: 'Luz principal 2',
          iconType: 'ledstrip',
          zone: 'cozinha',
        },
        {
          entity: 'light.cozinha_switch_1',
          name: 'Lavanderia',
          iconType: 'light_flush',
          zone: 'cozinha',
        },
      ],
      appliances: [
        {
          key: 'dishwasher',
          name: 'Lava-louças',
          entity: 'switch.cz_tomada_maq_lav_louca_socket_1',
          stateEntity: 'sensor.lava_loucas_operation_state',
          moreInfoEntity: 'switch.cz_tomada_maq_lav_louca_socket_1',
          image: '/local/images/lava_louca.png?v=20260702-all-images-1',
          activeStates: ['on', 'run'],
          activeAttr: 'dishwasher_running',
          activeLabel: 'Lavando',
          onLabel: 'Ligada',
          idleLabel: 'Ligada',
          offLabel: 'Desligada',
        },
        {
          key: 'airfryer',
          name: 'Air fryer',
          image: '/local/images/air_fry.png?v=20260702-all-images-1',
          placeholder: true,
          placeholderLabel: 'Sem tomada',
        },
        {
          key: 'fridge',
          name: 'Geladeira',
          image: '/local/images/geladeira.png?v=20260702-all-images-1',
          placeholder: true,
          placeholderLabel: 'Sem tomada',
        },
        {
          key: 'microwave',
          name: 'Micro-ondas',
          image: '/local/images/microondas.png?v=20260702-all-images-1',
          placeholder: true,
          placeholderLabel: 'Sem tomada',
        },
        {
          key: 'washer',
          name: 'Lavadora',
          image: '/local/images/lava_roupa.png?v=20260702-all-images-1',
          placeholder: true,
          placeholderLabel: 'Wi-Fi pendente',
        },
      ],
      cameras: [
        {
          entity: 'camera.cz_camera_2',
          name: 'Cozinha',
          shortName: 'Cozinha',
          controls: [
            {
              key: 'sound',
              label: 'Som',
              description: 'Detecção de som',
              icon: 'mdi:microphone-outline',
              entity: 'switch.cz_camera_deteccao_de_som',
            },
            {
              key: 'motion',
              label: 'Mov.',
              description: 'Alarme de movimento',
              icon: 'mdi:run-fast',
              entity: 'switch.cz_camera_alarme_de_movimento',
            },
            {
              key: 'privacy',
              label: 'Priv.',
              description: 'Modo de privacidade',
              icon: 'mdi:eye-off-outline',
              entity: 'switch.cz_camera_modo_de_privacidade',
            },
          ],
        },
        {
          entity: 'camera.as_camera_2',
          name: 'Area de Servico',
          shortName: 'Area',
        },
      ],
    },
  },
  casal: {
    title: 'Q. Casal',
    background: '/local/images/quarto_casal.jpg?v=20260702-all-images-1',
    fallbackBackground: '/local/images/quarto_casal.jpg?v=20260702-all-images-1',
    spotifyDeviceName: 'Echo Pop Quarto Casal',
    climateDeviceName: 'Gree',
    tvStandbyImage: '/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1',
    spotifyStandbyImage: '/local/images/echo_pop.png?v=20260702-all-images-1',
    tvApps: [
      {
        key: 'netflix',
        label: 'Netflix',
        image: '/local/images/netflix_bg.jpg?v=20260702-all-images-1',
      },
      {
        key: 'prime',
        label: 'Prime Video',
        image: '/local/images/prime_video_tile.png?v=20260702-all-images-1',
      },
      {
        key: 'disney',
        label: 'Disney+',
        image: '/local/images/dp_bg.jpg?v=20260702-all-images-1',
      },
      {
        key: 'max',
        label: 'Max',
        image: '/local/images/HBOMax_bg.jpg?v=20260702-all-images-1',
      },
    ],
    lightZoneLabels: {
      sala: 'Quarto',
      varanda: 'Suíte',
    },
    lightZoneIcons: {
      varanda: 'hugeicons:shower-head',
    },
    entities: {
      activeSensor: 'sensor.quarto_casal_active',
      semanticSensor: 'sensor.q_casal_semantic_state_supervised',
      motionRecent: 'binary_sensor.q_casal_motion_recent',
      occupancy: 'binary_sensor.q_casal_occupancy',
      presence: 'binary_sensor.sensor_4_in_1_q_casal_presence',
      illuminance: 'sensor.sensor_4_in_1_q_casal_illuminance',
      temperature: ['sensor.sensor_4_in_1_q_casal_temperature'],
      humidity: ['sensor.sensor_4_in_1_q_casal_humidity'],
      roomGroup: 'light.grupo_quarto_casal',
      cameraMain: 'camera.camera_quarto_casal_2',
      spotify: 'media_player.spotifyplus_bruno_helasio',
      speaker: 'media_player.echo_pop_quarto_casal',
      climate: 'climate.qc_ar_condicionado',
      lights: [
        {
          entity: 'light.qc_luz_principal',
          name: 'Luz principal',
          iconType: 'ledstrip',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_casal_switch_1',
          name: 'Luzes quadros',
          iconType: 'light_flush',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_casal_2_switch_2',
          name: 'Luz sanca',
          iconType: 'light_flush',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_casal_switch_2',
          name: 'Luzes closet',
          iconType: 'light_flush',
          zone: 'sala',
        },
        {
          entity: 'light.suite_casal_switch_1',
          name: 'Luz principal',
          iconType: 'light_flush',
          zone: 'varanda',
        },
        {
          entity: 'light.suite_casal_switch_2',
          name: 'Luz azul',
          iconType: 'light_flush',
          zone: 'varanda',
        },
      ],
      cameras: [
        {
          entity: 'camera.camera_quarto_casal_2',
          name: 'Quarto Casal',
          shortName: 'Casal',
        },
      ],
    },
  },
  marina: {
    title: 'Q. Marina',
    background: '/local/images/quarto_marina.jpg?v=20260702-all-images-1',
    fallbackBackground: '/local/images/quarto_marina.jpg?v=20260702-all-images-1',
    spotifyDeviceName: 'Echo Pop Marina',
    climateDeviceName: 'Gree',
    tvStandbyImage: '/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1',
    spotifyStandbyImage: '/local/images/echo_pop.png?v=20260702-all-images-1',
    tvApps: [
      {
        key: 'netflix',
        label: 'Netflix',
        image: '/local/images/netflix_bg.jpg?v=20260702-all-images-1',
      },
      {
        key: 'prime',
        label: 'Prime Video',
        image: '/local/images/prime_video_tile.png?v=20260702-all-images-1',
      },
      {
        key: 'disney',
        label: 'Disney+',
        image: '/local/images/dp_bg.jpg?v=20260702-all-images-1',
      },
      {
        key: 'max',
        label: 'Max',
        image: '/local/images/HBOMax_bg.jpg?v=20260702-all-images-1',
      },
    ],
    lightZoneLabels: {
      sala: 'Quarto',
      varanda: 'Suíte',
    },
    lightZoneIcons: {
      varanda: 'hugeicons:shower-head',
    },
    entities: {
      activeSensor: 'sensor.quarto_marina_active',
      motionRecent: 'binary_sensor.q_marina_motion_recent',
      occupancy: 'binary_sensor.q_marina_occupancy',
      semanticSensor: 'sensor.q_marina_semantic_state_supervised',
      presence: 'binary_sensor.sensor_4_in_1_q_marina_presence',
      illuminance: 'sensor.sensor_4_in_1_q_marina_illuminance',
      temperature: [
        'sensor.sensor_4_in_1_q_marina_temperature',
        'sensor.temperatura_quarto_marina',
        'sensor.qma_temperatura',
      ],
      humidity: [
        'sensor.sensor_4_in_1_q_marina_humidity',
        'sensor.umidade_quarto_marina',
        'sensor.qma_umidade',
      ],
      roomGroup: 'light.grupo_luzes_quarto_marina',
      cameraMain: 'camera.qma_camera_2',
      spotify: 'media_player.spotifyplus_bruno_helasio',
      speaker: 'media_player.echo_pop_marina',
      climate: [
        'climate.ac_quarto_marina',
        'climate.q_marina_ar_condicionado',
        'climate.q_marina_ac',
        'climate.qma_ar_condicionado',
        'climate.qma_ac',
        'climate.quarto_marina_ar_condicionado',
        'climate.quarto_marina_ac',
        'climate.ar_condicionado_quarto_marina',
        'climate.ar_condicionado_marina',
        'climate.marina_ar_condicionado',
        'climate.marina_ac',
      ],
      lights: [
        {
          entity: 'light.quarto_marina_switch_4',
          name: 'Luz principal',
          iconType: 'light_flush',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_marina_switch_1',
          name: 'Arandela',
          iconType: 'sconce',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_marina_switch_2',
          name: 'Estante',
          iconType: 'light_flush',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_marina_switch_3',
          name: 'Luz cortineiro',
          iconType: 'light_flush',
          zone: 'sala',
        },
        {
          entity: 'light.suite_marina_switch_2',
          name: 'Luz principal',
          iconType: 'light_flush',
          zone: 'varanda',
        },
        {
          entity: 'light.suite_marina_switch_1',
          name: 'Luz azul',
          iconType: 'light_flush',
          zone: 'varanda',
        },
      ],
      cameras: [
        {
          entity: 'camera.qma_camera_2',
          name: 'Quarto Marina',
          shortName: 'Marina',
        },
      ],
    },
  },
  miguel: {
    title: 'Q. Miguel',
    background: '/local/images/quarto_miguel.jpg?v=20260702-all-images-1',
    fallbackBackground: '/local/images/quarto_miguel.jpg?v=20260702-all-images-1',
    climateDeviceName: 'Gree',
    tvStandbyImage: '/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1',
    spotifyStandbyImage: '/local/images/echo_pop.png?v=20260702-all-images-1',
    tvApps: [
      {
        key: 'netflix',
        label: 'Netflix',
        image: '/local/images/netflix_bg.jpg?v=20260702-all-images-1',
      },
      {
        key: 'prime',
        label: 'Prime Video',
        image: '/local/images/prime_video_tile.png?v=20260702-all-images-1',
      },
      {
        key: 'disney',
        label: 'Disney+',
        image: '/local/images/dp_bg.jpg?v=20260702-all-images-1',
      },
      {
        key: 'max',
        label: 'Max',
        image: '/local/images/HBOMax_bg.jpg?v=20260702-all-images-1',
      },
    ],
    lightZoneLabels: {
      sala: 'Quarto',
      varanda: 'Suíte',
    },
    lightZoneIcons: {
      varanda: 'hugeicons:shower-head',
    },
    entities: {
      activeSensor: 'sensor.quarto_miguel_active',
      semanticSensor: 'sensor.q_miguel_semantic_state_supervised',
      motionRecent: 'binary_sensor.q_miguel_motion_recent',
      occupancy: 'binary_sensor.q_miguel_occupancy',
      presence: 'binary_sensor.sensor_4_in_1_q_miguel_presence',
      illuminance: 'sensor.sensor_4_in_1_q_miguel_illuminance',
      temperature: [
        'sensor.sensor_4_in_1_q_miguel_temperature',
        'sensor.temperatura_quarto_miguel',
        'sensor.qmi_temperatura',
      ],
      humidity: [
        'sensor.sensor_4_in_1_q_miguel_humidity',
        'sensor.umidade_quarto_miguel',
        'sensor.qmi_umidade',
      ],
      roomGroup: 'light.grupo_luzes_quarto_miguel',
      cameraMain: 'camera.qmi_camera_2',
      climate: 'climate.ac_quarto_miguel',
      lights: [
        {
          entity: 'light.quarto_miguel_switch_2',
          name: 'Luz principal',
          iconType: 'ledstrip',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_miguel_2_switch_1',
          name: 'Luzes armario',
          iconType: 'light_flush',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_miguel_2_switch_2',
          name: 'Arandela poltrona',
          iconType: 'sconce',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_miguel_2_switch_3',
          name: 'Arandela berco',
          iconType: 'sconce',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_miguel_switch_1',
          name: 'Luz prateleiras',
          iconType: 'ledstrip',
          zone: 'sala',
        },
        {
          entity: 'light.quarto_miguel_switch_3',
          name: 'Luz cortineiro',
          iconType: 'ledstrip',
          zone: 'sala',
        },
        {
          entity: 'light.suite_miguel_switch_1',
          name: 'Luz suite',
          iconType: 'light_flush',
          zone: 'varanda',
        },
        {
          entity: 'light.suite_miguel_switch_2',
          name: 'Luz azul suite',
          iconType: 'light_flush',
          zone: 'varanda',
        },
      ],
      cameras: [
        {
          entity: 'camera.qmi_camera_2',
          name: 'Quarto Miguel',
          shortName: 'Miguel',
        },
      ],
    },
  },
};
