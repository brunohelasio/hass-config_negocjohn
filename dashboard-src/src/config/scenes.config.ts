/**
 * Cenas que o dashboard espera encontrar no Home Assistant.
 *
 * **Este arquivo declara dependências, não as cria.** Criar uma cena é
 * configuração do Home Assistant — `config/scenes.yaml` ou a interface do HA —
 * e está fora do escopo do frontend pela Regra de Trabalho nº 3.
 *
 * O gate (Fase 5e.3, ajuste 4 do usuário):
 *
 *   entidade existe   -> a ação aparece e é invocada normalmente
 *   entidade ausente  -> o dashboard REGISTRA a dependência no diagnóstico e
 *                        NÃO atua fora do frontend. Aguarda autorização.
 *
 * O botão "Apagar todas as luzes" saiu da faixa de ações rápidas na Fase 5e.2.
 * Ele chamava `homeassistant.turn_off` sobre `light.todas_as_luzes` — o que
 * funciona, mas é comando solto: não é uma cena, não aparece no painel de
 * Cenas, e não pode ser reaproveitado por automação nem por voz.
 */

export interface SceneDependency {
  /** Id esperado da entidade `scene`. */
  entity: string;
  /** Rótulo, quando a cena existir. */
  name: string;
  /** O que o dashboard fazia antes — o comportamento a substituir. */
  substitui?: string;
  /** Instrução para quem for criar a cena no Home Assistant. */
  comoCriar: string;
}

export const SCENES: readonly SceneDependency[] = [
  {
    entity: 'script.bruno_scene_apagar_todas_as_luzes',
    name: 'Apagar todas as luzes',
    substitui: 'homeassistant.turn_off sobre light.todas_as_luzes',
    comoCriar:
      'CRIADA em 2026-08-06 (Fase 5e.3), com autorizacao do usuario, em ' +
      'config/packages/bruno_scenes.yaml — mesmo padrao dos demais: script ' +
      'bruno_scene_*, nao entidade scene. O painel de Cenas lista scripts.',
  },
];

export interface ScenesStatus {
  disponiveis: readonly SceneDependency[];
  ausentes: readonly SceneDependency[];
}

/**
 * Quais cenas declaradas existem de fato.
 *
 * Sem `hass` ainda, trata tudo como ausente — é o estado seguro: a ação não
 * aparece antes de haver certeza de que funciona.
 */
export function verificarCenas(
  hass: { states: Record<string, unknown> } | undefined,
): ScenesStatus {
  const disponiveis: SceneDependency[] = [];
  const ausentes: SceneDependency[] = [];
  for (const cena of SCENES) {
    if (hass?.states?.[cena.entity]) disponiveis.push(cena);
    else ausentes.push(cena);
  }
  return { disponiveis, ausentes };
}
