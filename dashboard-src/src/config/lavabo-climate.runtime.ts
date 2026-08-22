import { ROOMS } from './rooms.config';

/**
 * Compatibilidade do Lavabo com os sensores de temperatura/umidade já
 * registrados no repositório em dashboards/floorplan/temphumid.yaml.
 *
 * Mantido isolado nesta candidata para não reescrever o arquivo central de
 * cômodos enquanto a migração V3 ainda está em validação física. Depois da
 * validação, estes dois campos podem ser incorporados diretamente ao bloco
 * `lavabo` de rooms.config.ts sem alterar comportamento.
 */
const lavabo = ROOMS.find((room) => room.id === 'lavabo');

if (lavabo) {
  lavabo.entities.temperature = 'sensor.bathroom_temp_humid_temperature';
  lavabo.entities.humidity = 'sensor.bathroom_temp_humid_humidity';
}
