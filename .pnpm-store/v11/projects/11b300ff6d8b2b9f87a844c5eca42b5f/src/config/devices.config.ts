/**
 * Os dispositivos do popup Dispositivos.
 *
 * **Acrescentar um aparelho é acrescentar uma entrada aqui.** Nada de editar o
 * popup, nada de escrever marcação. É o requisito central da Fase 5e.6, e o
 * motivo de os contratos (`application/device-registry.ts`) existirem antes.
 *
 * Conteúdo inicial: TV e ar-condicionado da sala — as duas funções que saíram
 * da faixa de ações rápidas da Home.
 *
 * Para acrescentar um dispositivo:
 *   1. confirme que o `type` está registrado (ver `components/devices/controls.ts`);
 *   2. acrescente a entrada abaixo, com `id` único.
 *
 * Para um tipo NOVO de aparelho (persiana, aspirador, som), registre o controle
 * em `controls.ts` e use o `type` aqui. O popup não muda.
 */

import type { DeviceInstanceConfig } from '@/application/device-registry';

export const DEVICES: readonly DeviceInstanceConfig[] = [
  {
    id: 'sala-tv',
    type: 'media-tv',
    name: 'TV da Sala',
    group: 'Sala',
    icon: 'mdi:television-classic',
    entity: 'media_player.android_tv_192_168_3_17',
    version: 1,
    config: {
      // O controle remoto reaproveita o mesmo caminho da subview da Sala.
      remote: 'remote.atv',
    },
  },
  {
    id: 'sala-ac',
    type: 'climate',
    name: 'Ar-condicionado da Sala',
    group: 'Sala',
    icon: 'mdi:air-conditioner',
    entity: 'climate.sl_ar_condicionado',
    version: 1,
  },
];
