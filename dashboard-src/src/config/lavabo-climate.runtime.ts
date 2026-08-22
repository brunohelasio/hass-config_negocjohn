import { ROOMS } from './rooms.config';

/**
 * Clima do Lavabo.
 *
 * O sensor de temperatura/umidade do Lavabo e o antigo sensor separado que
 * ficava no Office antes da chegada do 4-em-1. O historico do dashboard registra
 * explicitamente estes entity_id no Office antigo:
 *   sensor.office_temp_humid_temperature
 *   sensor.office_temp_humid_humidity
 *
 * Isso e diferente do sensor PIR/iluminancia do Lavabo, que continua mapeado
 * separadamente no bloco `lavabo` de rooms.config.ts.
 *
 * O floorplan ainda contem `sensor.bathroom_temp_humid_*`, herdado da estrutura
 * antiga, mas ele nao e a melhor evidencia para este hardware especifico.
 */
const lavabo = ROOMS.find((room) => room.id === 'lavabo');

if (lavabo) {
  lavabo.entities.temperature = 'sensor.office_temp_humid_temperature';
  lavabo.entities.humidity = 'sensor.office_temp_humid_humidity';
}
