import { TV_POWER_ON_STATES } from '@/services/entities/media-state';

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

/**
 * Ponto de status na coluna direita do tile.
 *
 * Transcrito do `status_dots` que os 6 cards mais novos já usam. Só os pontos
 * ATIVOS renderizam; os demais não ocupam espaço. `entities` é qualquer-um: o
 * ponto acende se ao menos uma das entidades estiver num dos `states`.
 */
export interface RoomDot {
  icon: string;
  label: string;
  tone: 'blue' | 'purple' | 'cyan' | 'amber';
  entities?: readonly string[];
  states?: readonly string[];
  /** Atributo do sensor `*_active` que também acende o ponto. */
  activeAttr?: string;
  /**
   * Nome do dispositivo deste cômodo no Spotify Connect.
   *
   * Quando o Spotify toca ATRAVÉS do Echo, a entidade do Echo costuma continuar
   * em `standby` ou `idle` — a integração da Alexa não vê o áudio que entra por
   * Spotify Connect. Quem está em `playing` é a entidade do Spotify, e o
   * dispositivo em uso aparece nos atributos dela.
   *
   * Com este campo o ponto de mídia também acende quando o Spotify está tocando
   * E o dispositivo ativo é o deste cômodo. Sem ele, o ponto ficava apagado no
   * cômodo onde a música estava de fato tocando.
   */
  spotifyDevice?: string;
}

/** A conta do Spotify é uma só; o que distingue o cômodo é o DISPOSITIVO. */
export const SPOTIFY_ENTITY = 'media_player.spotifyplus_bruno_helasio';

export interface RoomConfig {
  id: string;
  name: string;
  /** Seção da shell (`bento-lab#<section>`). Ausente = sem subview própria. */
  section?: string;
  /**
   * Alvo do toque curto.
   *
   * Não é o grupo: os cards atuais alternam UMA luz (a principal) no tap e só
   * usam o grupo no hold, para apagar tudo. Tratar o grupo como alvo do tap
   * mudaria o comportamento de sete cômodos de uma vez.
   */
  toggleTarget?: string;
  /** Sensor `*_active`: traz `lights_on_count` e atributos de eletrodoméstico. */
  activeSensor?: string;
  statusDots?: readonly RoomDot[];
  /**
   * Linha extra de status, entre a contagem de luzes e a semântica.
   *
   * Existe só na Cozinha hoje ("Lavando / 12m"), mas é conteúdo, não enfeite:
   * some se o componente não a suportar. Modelada aqui para que qualquer cômodo
   * possa ganhar uma sem código novo.
   */
  applianceLine?: {
    entity?: string;
    states?: readonly string[];
    label: string;
    /** Atributo do sensor `*_active` que também liga a linha. */
    activeAttr?: string;
    /** Atributo do sensor `*_active` com o tempo decorrido já formatado. */
    elapsedAttr?: string;
  };
  /**
   * Caminhos completos dos assets, por estado.
   *
   * Eram montados por convenção (`<asset>-on-tight.png`), mas o Q. Casal foge
   * do padrão: o arquivo em uso é `couple-bedroom-on-generated-v3.png`, e
   * existe um `couple-bedroom-on-tight.png` **antigo e órfão** que a convenção
   * carregava por engano. Caminho explícito elimina a classe do problema.
   */
  assetOff?: string;
  assetOn?: string;
  /**
   * Ajuste fino de tamanho do ícone, 1 = padrão.
   *
   * Existe porque as proporções dos PNGs variam de 0,84 a 1,73 numa caixa de
   * 1,50: com `object-fit: contain`, a largura renderizada varia de 67 a 120 px
   * e os cômodos parecem ter tamanhos diferentes. Ver docs/07-design-system.md.
   * Calibrar no olho, sem tocar em código nem em imagem.
   */
  iconScale?: number;
  /**
   * Painel próprio, para cômodo sem subview.
   *
   * O Lavabo é o único hoje: em vez de navegar, o chevron abre um `<dialog>`
   * nativo ancorado ao próprio tile, com atalho para cada luz. `<dialog>` porque
   * `showModal()` renderiza na top layer do navegador — imune ao `overflow:
   * hidden` e aos `transform` dos ancestrais, que era o motivo de o painel
   * antigo, com `position: fixed`, sair cortado dentro da shell.
   */
  popup?: {
    title: string;
    subtitle?: string;
    icon: string;
    banner?: string;
    bannerOn?: string;
    lights: readonly { entity: string; name: string; icon?: string }[];
  };
  /** Gênero para a semântica ("Ocupado" x "Ocupada"). */
  grammaticalGender?: 'm' | 'f';
  entities: RoomEntities;
}

/** Estados de `climate` que os cards tratam como ligado. */
const CLIMATE_ON = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'] as const;
/** Estados de `media_player` que os cards tratam como ativo. */
const MEDIA_ON = ['playing', 'paused', 'on'] as const;

export const ROOMS: readonly RoomConfig[] = [
  {
    id: 'sala',
    name: 'Sala',
    section: 'sala',
    assetOff: 'v2/sala-off',
    assetOn: 'v2/sala-on',
    grammaticalGender: 'f',
    toggleTarget: 'light.sala_switch_2',
    activeSensor: 'sensor.living_room_active',
    statusDots: [
      { icon: 'mdi:account', label: 'Presenca na Sala', tone: 'blue',
        entities: ['binary_sensor.sala_motion_recent'], states: ['on'] },
      { icon: 'mdi:television-classic', label: 'TV ativa', tone: 'purple',
        entities: ['media_player.android_tv_192_168_3_17'],
        states: TV_POWER_ON_STATES },
      { icon: 'mdi:snowflake', label: 'Ar condicionado ativo', tone: 'cyan',
        entities: ['climate.sl_ar_condicionado'], states: CLIMATE_ON },
      { icon: 'mdi:speaker-wireless', label: 'Echo Show ativo', tone: 'amber',
        entities: ['media_player.echo_show'], states: MEDIA_ON,
        spotifyDevice: 'Echo Show' },
    ],
    entities: {
      lightGroup: 'light.grupo_luzes_sala',
      lights: ['light.sala_switch_1', 'light.sala_switch_2'],
      climate: 'climate.sl_ar_condicionado',
      mediaPlayers: [
        'media_player.android_tv_192_168_3_17',
        'media_player.echo_show',
        'media_player.spotifyplus_bruno_helasio',
      ],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.sl_camera_2', 'camera.vr_camera_2'],
      cameras: ['camera.sl_camera_profile_1', 'camera.vr_camera_profile_1'],
      covers: ['cover.cortina_varanda_cortina_2'],
      motionRecent: 'binary_sensor.sala_motion_recent',
      occupancy: 'binary_sensor.sala_occupancy',
      semanticState: 'sensor.sala_semantic_state_supervised',
      temperature: 'sensor.sensor_4_in_1_sala_temperature',
      humidity: 'sensor.sensor_4_in_1_sala_humidity',
      illuminance: 'sensor.sensor_4_in_1_sala_illuminance',
    },
  },
  {
    id: 'office',
    name: 'Office',
    section: 'office',
    assetOff: 'v2/office-off',
    assetOn: 'v2/office-on',
    grammaticalGender: 'm',
    toggleTarget: 'light.office_switch_3',
    activeSensor: 'sensor.office_active',
    statusDots: [
      { icon: 'mdi:account', label: 'Presenca no Office', tone: 'blue',
        entities: ['binary_sensor.office_motion_recent'], states: ['on'] },
      // O estado cru da sessão NÃO participa deste ponto. O HASS.Agent pode
      // ficar congelado em "Unlocked" quando perde API/MQTT; usar esse valor
      // diretamente contorna a proteção temporal já implementada no backend.
      //
      // binary_sensor.office_pc_active é a autoridade de "PC ativo": só fica
      // on quando a sessão está destravada E houve atividade nos últimos 300 s.
      // A sessão continua disponível na subview como telemetria, não como prova.
      { icon: 'mdi:desktop-classic', label: 'PC ativo', tone: 'purple',
        entities: ['binary_sensor.office_pc_active'], states: ['on'] },
      { icon: 'mdi:snowflake', label: 'Ar condicionado ativo', tone: 'cyan',
        entities: ['climate.ac_office'], states: CLIMATE_ON },
      { icon: 'mdi:speaker-wireless', label: 'Echo Pop ativo', tone: 'amber',
        entities: ['media_player.echo_pop_office'], states: MEDIA_ON,
        spotifyDevice: 'Echo Pop Office' },
    ],
    entities: {
      lightGroup: 'light.grupo_luzes_office',
      lights: ['light.office_switch_1', 'light.office_switch_2', 'light.office_switch_3'],
      climate: 'climate.ac_office',
      mediaPlayers: ['media_player.echo_pop_office'],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.of_camera_2'],
      cameras: ['camera.of_camera_profile_1'],
      motionRecent: 'binary_sensor.office_motion_recent',
      occupancy: 'binary_sensor.office_occupancy',
      semanticState: 'sensor.office_semantic_state_supervised',
      temperature: 'sensor.sensor_4_in_1_office_temperature',
      humidity: 'sensor.sensor_4_in_1_office_humidity',
      illuminance: 'sensor.sensor_4_in_1_office_illuminance',
    },
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    section: 'cozinha',
    assetOff: 'v2/cozinha-off',
    assetOn: 'v2/cozinha-on',
    grammaticalGender: 'f',
    toggleTarget: 'light.cz_luz_principal',
    activeSensor: 'sensor.cozinha_active',
    applianceLine: {
      entity: 'sensor.lava_loucas_operation_state',
      states: ['run'],
      label: 'Lavando',
      activeAttr: 'dishwasher_running',
      elapsedAttr: 'dishwasher_elapsed',
    },
    statusDots: [
      { icon: 'mdi:account', label: 'Presenca', tone: 'blue',
        entities: ['binary_sensor.cozinha_motion_recent'], states: ['on'] },
      { icon: 'mdi:dishwasher', label: 'Lava-loucas', tone: 'purple',
        entities: ['sensor.lava_loucas_operation_state'], states: ['run'],
        activeAttr: 'dishwasher_running' },
      // Sem entidade ainda — declarados para manter a ordem quando existirem.
      { icon: 'mdi:washing-machine', label: 'Maquina de lavar', tone: 'cyan' },
      { icon: 'mdi:air-fryer', label: 'Air fryer', tone: 'amber' },
    ],
    entities: {
      lightGroup: 'light.grupo_luzes_cozinha',
      lights: ['light.cz_luz_principal'],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.cz_camera_2', 'camera.as_camera_2'],
      cameras: ['camera.cz_camera_profile_1', 'camera.as_camera_profile_1'],
      motionRecent: 'binary_sensor.cozinha_motion_recent',
      occupancy: 'binary_sensor.cozinha_occupancy',
      semanticState: 'sensor.cozinha_semantic_state_supervised',
      temperature: 'sensor.sensor_4_in_1_cozinha_temperature',
      humidity: 'sensor.sensor_4_in_1_cozinha_humidity',
      illuminance: 'sensor.sensor_4_in_1_cozinha_illuminance',
    },
  },
  {
    id: 'lavabo',
    name: 'Lavabo',
    assetOff: 'v2/lavabo-off',
    assetOn: 'v2/lavabo-on',
    grammaticalGender: 'm',
    toggleTarget: 'light.grupo_luzes_lavabo',
    activeSensor: 'sensor.lavabo_active',
    popup: {
      title: 'Lavabo',
      subtitle: 'Controle rapido de luzes',
      icon: 'mdi:toilet',
      banner: '/local/images/lavabo.jpg?v=20260705-lavabo-jpg-1',
      lights: [
        { entity: 'light.lavabo_switch_2', name: 'Luz principal', icon: 'ledstrip' },
        { entity: 'light.lavabo_switch_1', name: 'Luz parede', icon: 'sconce' },
        { entity: 'light.lavabo_switch_3', name: 'Luz espelho', icon: 'light_flush' },
      ],
    },
    statusDots: [
      { icon: 'mdi:account', label: 'Presenca', tone: 'blue',
        entities: ['binary_sensor.lavabo_motion_recent'], states: ['on'] },
    ],
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
    name: 'Casal',
    section: 'casal',
    assetOff: 'v2/quarto-casal-off',
    assetOn: 'v2/quarto-casal-on',
    grammaticalGender: 'm',
    toggleTarget: 'light.qc_luz_principal',
    activeSensor: 'sensor.quarto_casal_active',
    statusDots: [
      { icon: 'mdi:account', label: 'Presenca', tone: 'blue',
        entities: ['binary_sensor.q_casal_motion_recent'], states: ['on'] },
      // O Q. Casal não tem TV. O ponto existe desde o card original e nunca
      // acendeu — sem entidade não há o que ler.
      { icon: 'mdi:television-classic', label: 'TV', tone: 'purple' },
      // ANTERIOR: { icon: 'mdi:snowflake', label: 'Clima', tone: 'cyan' },
      // O ponto de clima estava sem entidade no card original — buraco, não
      // decisão: `climate.qc_ar_condicionado` existe e é o A/C do cômodo,
      // usado pela subview. Agora o ponto acende como nos demais quartos.
      { icon: 'mdi:snowflake', label: 'Clima', tone: 'cyan',
        entities: ['climate.qc_ar_condicionado'], states: CLIMATE_ON },
      { icon: 'mdi:speaker-wireless', label: 'Midia', tone: 'purple',
        entities: ['media_player.echo_pop_quarto_casal'], states: MEDIA_ON,
        spotifyDevice: 'Echo Pop Quarto Casal' },
    ],
    entities: {
      lightGroup: 'light.grupo_quarto_casal',
      lights: ['light.qc_luz_principal'],
      mediaPlayers: ['media_player.echo_pop_quarto_casal'],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.camera_quarto_casal_2'],
      cameras: ['camera.qc_camera_profile_1'],
      motionRecent: 'binary_sensor.q_casal_motion_recent',
      occupancy: 'binary_sensor.q_casal_occupancy',
      semanticState: 'sensor.q_casal_semantic_state_supervised',
      temperature: 'sensor.sensor_4_in_1_q_casal_temperature',
      humidity: 'sensor.sensor_4_in_1_q_casal_humidity',
      illuminance: 'sensor.sensor_4_in_1_q_casal_illuminance',
    },
  },
  {
    id: 'marina',
    name: 'Marina',
    section: 'marina',
    assetOff: 'v2/quarto-menina-off',
    assetOn: 'v2/quarto-menina-on',
    grammaticalGender: 'm',
    toggleTarget: 'light.quarto_marina_switch_4',
    activeSensor: 'sensor.quarto_marina_active',
    statusDots: [
      { icon: 'mdi:account', label: 'Presenca', tone: 'blue',
        entities: ['binary_sensor.q_marina_motion_recent'], states: ['on'] },
      { icon: 'mdi:television-classic', label: 'TV', tone: 'purple' },
      { icon: 'mdi:snowflake', label: 'Clima', tone: 'cyan',
        entities: ['climate.ac_quarto_marina'], states: CLIMATE_ON },
      { icon: 'mdi:speaker-wireless', label: 'Midia', tone: 'purple',
        entities: ['media_player.echo_pop_marina'], states: MEDIA_ON,
        spotifyDevice: 'Echo Pop Marina' },
    ],
    entities: {
      lightGroup: 'light.grupo_luzes_quarto_marina',
      lights: ['light.quarto_marina_switch_4'],
      climate: 'climate.ac_quarto_marina',
      mediaPlayers: ['media_player.echo_pop_marina'],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.qma_camera_2'],
      cameras: ['camera.qma_camera_profile_1'],
      motionRecent: 'binary_sensor.q_marina_motion_recent',
      occupancy: 'binary_sensor.q_marina_occupancy',
      semanticState: 'sensor.q_marina_semantic_state_supervised',
      temperature: 'sensor.sensor_4_in_1_q_marina_temperature',
      humidity: 'sensor.sensor_4_in_1_q_marina_humidity',
      illuminance: 'sensor.sensor_4_in_1_q_marina_illuminance',
    },
  },
  {
    id: 'miguel',
    name: 'Miguel',
    section: 'miguel',
    assetOff: 'v2/quarto-bebe-off',
    assetOn: 'v2/quarto-bebe-on',
    grammaticalGender: 'm',
    toggleTarget: 'light.quarto_miguel_switch_2',
    activeSensor: 'sensor.quarto_miguel_active',
    statusDots: [
      { icon: 'mdi:account', label: 'Presenca', tone: 'blue',
        entities: ['binary_sensor.q_miguel_motion_recent'], states: ['on'] },
      { icon: 'mdi:television-classic', label: 'TV', tone: 'purple' },
      { icon: 'mdi:snowflake', label: 'Clima', tone: 'cyan',
        entities: ['climate.ac_quarto_miguel'], states: CLIMATE_ON },
      { icon: 'mdi:speaker-wireless', label: 'Midia', tone: 'purple' },
    ],
    entities: {
      lightGroup: 'light.grupo_luzes_quarto_miguel',
      lights: ['light.quarto_miguel_switch_2'],
      climate: 'climate.ac_quarto_miguel',
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.qmi_camera_2'],
      cameras: ['camera.qmi_camera_profile_1'],
      motionRecent: 'binary_sensor.q_miguel_motion_recent',
      occupancy: 'binary_sensor.q_miguel_occupancy',
      semanticState: 'sensor.q_miguel_semantic_state_supervised',
      temperature: 'sensor.sensor_4_in_1_q_miguel_temperature',
      humidity: 'sensor.sensor_4_in_1_q_miguel_humidity',
      illuminance: 'sensor.sensor_4_in_1_q_miguel_illuminance',
    },
  },
  {
    id: 'corredor',
    name: 'Corredor',
    assetOff: 'v2/corredor-off',
    assetOn: 'v2/corredor-on',
    grammaticalGender: 'm',
    toggleTarget: 'light.corredor_switch_1',
    statusDots: [
      { icon: 'mdi:account', label: 'Presenca', tone: 'blue',
        entities: ['binary_sensor.corredor_motion_recent'], states: ['on'] },
    ],
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
