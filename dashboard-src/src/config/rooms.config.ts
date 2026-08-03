/**
 * Configuração central dos cômodos.
 *
 * Hoje a mesma entidade aparece em até quatro lugares — card, subview, package
 * de presença e YAML da shell. Renomear uma entidade no Home Assistant exige
 * caçar todas as ocorrências. Aqui ela é declarada UMA vez.
 *
 * Fonte: docs/05-rooms-and-devices.md (extraído do código em 2026-08-02).
 *
 * Sobre validação: o tipo abaixo garante o FORMATO em tempo de build. O que
 * quebra de verdade é a entidade deixar de existir no HA depois de renomeada —
 * e isso nenhum validador de esquema pega. Ver `diagnostics/entity-check.ts`.
 */

export interface RoomEntities {
  /** Grupo que representa "as luzes do cômodo". */
  lightGroup?: string;
  lights?: readonly string[];
  climate?: string;
  mediaPlayers?: readonly string[];
  cameras?: readonly string[];
  covers?: readonly string[];
  /** Camada 1 do molde de presença: acende e apaga rápido. */
  motionRecent?: string;
  /** Camada 2: presença sustentada. */
  occupancy?: string;
  /** Camada 3: occupied/none + texto de exibição. */
  semanticState?: string;
  temperature?: string;
  humidity?: string;
  illuminance?: string;
}

export interface RoomConfig {
  id: string;
  name: string;
  /** Seção da shell (`bento-lab#<section>`). Ausente = sem subview própria. */
  section?: string;
  /** Base dos assets `<asset>-on.png` / `<asset>-off.png`. */
  asset?: string;
  /**
   * Ajuste fino de tamanho do ícone, 1 = padrão.
   *
   * Existe porque as proporções dos PNGs variam de 0,84 a 1,73 numa caixa de
   * 1,50: com `object-fit: contain`, a largura renderizada varia de 67 a 120 px
   * e os cômodos parecem ter tamanhos diferentes. Ver docs/07-design-system.md.
   * Calibrar no olho, sem tocar em código nem em imagem.
   */
  iconScale?: number;
  /** Gênero para a semântica ("Ocupado" x "Ocupada"). */
  grammaticalGender?: 'm' | 'f';
  entities: RoomEntities;
}

export const ROOMS: readonly RoomConfig[] = [
  {
    id: 'sala',
    name: 'Sala',
    section: 'sala',
    asset: 'living-room',
    grammaticalGender: 'f',
    entities: {
      lightGroup: 'light.grupo_luzes_sala',
      lights: ['light.sala_switch_1', 'light.sala_switch_2'],
      climate: 'climate.sl_ar_condicionado',
      mediaPlayers: [
        'media_player.android_tv_192_168_3_17',
        'media_player.echo_show',
        'media_player.spotifyplus_bruno_helasio',
      ],
      cameras: ['camera.sl_camera_2', 'camera.vr_camera_2'],
      covers: ['cover.cortina_varanda_cortina_2'],
      motionRecent: 'binary_sensor.sala_motion_recent',
      occupancy: 'binary_sensor.sala_occupancy',
      semanticState: 'sensor.sala_semantic_state',
      temperature: 'sensor.sensor_4_in_1_sala_temperature',
      humidity: 'sensor.sensor_4_in_1_sala_humidity',
      illuminance: 'sensor.sensor_4_in_1_sala_illuminance',
    },
  },
  {
    id: 'office',
    name: 'Office',
    section: 'office',
    asset: 'office',
    grammaticalGender: 'm',
    entities: {
      lightGroup: 'light.grupo_luzes_office',
      lights: ['light.office_switch_1', 'light.office_switch_2', 'light.office_switch_3'],
      climate: 'climate.ac_office',
      mediaPlayers: ['media_player.echo_pop_office'],
      cameras: ['camera.of_camera_2'],
      motionRecent: 'binary_sensor.office_motion_recent',
      occupancy: 'binary_sensor.office_occupancy',
      semanticState: 'sensor.office_semantic_state',
      temperature: 'sensor.sensor_4_in_1_office_temperature',
      humidity: 'sensor.sensor_4_in_1_office_humidity',
      illuminance: 'sensor.sensor_4_in_1_office_illuminance',
    },
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    section: 'cozinha',
    asset: 'kitchen',
    grammaticalGender: 'f',
    entities: {
      lightGroup: 'light.grupo_luzes_cozinha',
      lights: ['light.cz_luz_principal'],
      cameras: ['camera.cz_camera_2', 'camera.as_camera_2'],
      motionRecent: 'binary_sensor.cozinha_motion_recent',
      occupancy: 'binary_sensor.cozinha_occupancy',
      semanticState: 'sensor.cozinha_semantic_state',
      temperature: 'sensor.sensor_4_in_1_cozinha_temperature',
      humidity: 'sensor.sensor_4_in_1_cozinha_humidity',
      illuminance: 'sensor.sensor_4_in_1_cozinha_illuminance',
    },
  },
  {
    id: 'lavabo',
    name: 'Lavabo',
    asset: 'lavabo',
    grammaticalGender: 'm',
    entities: {
      lightGroup: 'light.grupo_luzes_lavabo',
      lights: ['light.lavabo_switch_1', 'light.lavabo_switch_2', 'light.lavabo_switch_3'],
      motionRecent: 'binary_sensor.lavabo_motion_recent',
      occupancy: 'binary_sensor.lavabo_occupancy',
      illuminance: 'sensor.lv_sensor_presenca_iluminancia',
    },
  },
  {
    id: 'casal',
    name: 'Q. Casal',
    section: 'casal',
    asset: 'couple-bedroom',
    grammaticalGender: 'm',
    entities: {
      lightGroup: 'light.grupo_quarto_casal',
      lights: ['light.qc_luz_principal'],
      mediaPlayers: ['media_player.echo_pop_quarto_casal'],
      cameras: ['camera.camera_quarto_casal_2'],
      motionRecent: 'binary_sensor.q_casal_motion_recent',
      occupancy: 'binary_sensor.q_casal_occupancy',
      semanticState: 'sensor.q_casal_semantic_state',
      temperature: 'sensor.sensor_4_in_1_q_casal_temperature',
      humidity: 'sensor.sensor_4_in_1_q_casal_humidity',
      illuminance: 'sensor.sensor_4_in_1_q_casal_illuminance',
    },
  },
  {
    id: 'marina',
    name: 'Q. Marina',
    section: 'marina',
    asset: 'marina-bedroom',
    grammaticalGender: 'm',
    entities: {
      lightGroup: 'light.grupo_luzes_quarto_marina',
      lights: ['light.quarto_marina_switch_4'],
      climate: 'climate.ac_quarto_marina',
      mediaPlayers: ['media_player.echo_pop_marina'],
      cameras: ['camera.qma_camera_2'],
      motionRecent: 'binary_sensor.q_marina_motion_recent',
      occupancy: 'binary_sensor.q_marina_occupancy',
      semanticState: 'sensor.q_marina_semantic_state',
      temperature: 'sensor.sensor_4_in_1_q_marina_temperature',
      humidity: 'sensor.sensor_4_in_1_q_marina_humidity',
      illuminance: 'sensor.sensor_4_in_1_q_marina_illuminance',
    },
  },
  {
    id: 'miguel',
    name: 'Q. Miguel',
    section: 'miguel',
    asset: 'miguel-bedroom',
    grammaticalGender: 'm',
    entities: {
      lightGroup: 'light.grupo_luzes_quarto_miguel',
      lights: ['light.quarto_miguel_switch_2'],
      climate: 'climate.ac_quarto_miguel',
      cameras: ['camera.qmi_camera_2'],
      motionRecent: 'binary_sensor.q_miguel_motion_recent',
      occupancy: 'binary_sensor.q_miguel_occupancy',
      semanticState: 'sensor.q_miguel_semantic_state',
      temperature: 'sensor.sensor_4_in_1_q_miguel_temperature',
      humidity: 'sensor.sensor_4_in_1_q_miguel_humidity',
      illuminance: 'sensor.sensor_4_in_1_q_miguel_illuminance',
    },
  },
  {
    id: 'corredor',
    name: 'Corredor',
    asset: 'corridor',
    grammaticalGender: 'm',
    entities: {
      lights: ['light.corredor_switch_1'],
      motionRecent: 'binary_sensor.corredor_motion_recent',
      occupancy: 'binary_sensor.corredor_occupancy',
      semanticState: 'sensor.corredor_semantic_state',
    },
  },
];

/** Todas as entidades declaradas, com o cômodo e o campo de origem. */
export function collectConfiguredEntities(): Array<{
  entityId: string;
  roomId: string;
  field: string;
}> {
  const out: Array<{ entityId: string; roomId: string; field: string }> = [];
  for (const room of ROOMS) {
    for (const [field, value] of Object.entries(room.entities)) {
      if (typeof value === 'string') {
        out.push({ entityId: value, roomId: room.id, field });
      } else if (Array.isArray(value)) {
        for (const id of value) out.push({ entityId: id, roomId: room.id, field });
      }
    }
  }
  return out;
}
