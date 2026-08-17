import { css } from 'lit';

/**
 * Escalas fluidas.
 *
 * O dashboard atual tem 6.210 valores em px fixos e 157 media queries calibradas
 * num único tablet (Galaxy Tab S6 Lite, 2000x1200). Trocar para o Redmi Pad 2
 * (2560x1600) desorganizou o layout inteiro — ver docs/07-design-system.md.
 *
 * A causa: o CSS não vê a resolução física, vê o viewport CSS (resolução dividida
 * pela densidade de pixels). Com tudo amarrado a faixas fixas, mudar de aparelho
 * joga o layout para outra faixa e tudo salta de uma vez.
 *
 * A saída não é somar breakpoints — eles se multiplicam por aparelho. É medir
 * relativo ao CONTAINER (`cqi` = 1% da largura do container), com piso e teto.
 *
 * REGRA: componente novo não declara px fixo para tamanho, espaço ou tipografia.
 * Só bordas, raios e filetes — coisas que não devem escalar.
 */
export const scaleTokens = css`
  :host {
    /* Tipografia — piso, fluido, teto. Interpola em vez de saltar. */
    --t-xs: clamp(9px, 2.6cqi, 11px);
    --t-sm: clamp(10px, 3cqi, 13px);
    --t-md: clamp(12px, 3.6cqi, 15px);
    --t-lg: clamp(14px, 4.4cqi, 18px);
    --t-xl: clamp(17px, 5.6cqi, 24px);
    --t-2xl: clamp(22px, 8cqi, 38px);
    --t-clock: clamp(34px, 16cqi, 78px);

    /* Espaçamento */
    --s-1: clamp(2px, 0.7cqi, 4px);
    --s-2: clamp(4px, 1.4cqi, 7px);
    --s-3: clamp(6px, 2.2cqi, 11px);
    --s-4: clamp(9px, 3cqi, 15px);
    --s-5: clamp(12px, 4.2cqi, 21px);
    --s-6: clamp(16px, 5.6cqi, 28px);

    /* Elementos de toque. O mínimo de 44px é acessibilidade, não estética:
       abaixo disso o dedo erra o alvo. Nunca reduzir o piso. */
    --hit-min: 44px;
    --control-h: clamp(var(--hit-min), 13cqi, 56px);

    /* Imagem de cômodo. O PNG é servido a 384px; nunca exibir acima disso. */
    --room-img-max: clamp(72px, 30cqi, 132px);

    /* Raios e filetes: NÃO escalam. Um filete de 1px é 1px em qualquer tela. */
    --r-sm: 10px;
    --r-md: 16px;
    --r-lg: 20px;
    --r-full: 999px;
    --hairline: 1px;
  }

  /* Todo componente precisa declarar isto para as unidades cqi funcionarem.
     Sem container-type, a unidade cqi cai para o viewport e o problema volta.
     (Nunca use crase em comentario dentro de template literal — ver
     docs/11-failed-experiments.md.) */
  :host {
    container-type: inline-size;
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      --motion-fast: 0ms;
      --motion-base: 0ms;
    }
  }

  :host {
    --motion-fast: 120ms;
    --motion-base: 220ms;
    --ease: cubic-bezier(0.2, 0, 0, 1);
  }
`;
