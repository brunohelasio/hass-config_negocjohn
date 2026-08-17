/**
 * Em qual cômodo o Spotify está tocando.
 *
 * A conta do Spotify é UMA só, e todos os cômodos leem a mesma entidade
 * (`media_player.spotifyplus_bruno_helasio`). O que distingue o cômodo é o
 * DISPOSITIVO ativo — o Echo daquele ambiente.
 *
 * Sem essa distinção acontecem dois defeitos, que são o mesmo por baixo:
 *
 *   1. na Home, o ponto de mídia não acende no cômodo onde a música toca —
 *      quando o áudio entra por Spotify Connect, a entidade do Echo continua em
 *      `standby` e só a do Spotify vai para `playing`;
 *   2. nas subviews, o card do Spotify aparece expandido em TODAS, porque todas
 *      veem a mesma entidade em `playing`.
 *
 * Transportado de `_normalizeMediaDevice` / `_spotifySourceMatchesRoom` /
 * `_spotifySpeakerMatchesRoom` das subviews atuais. Eu não havia portado esses
 * três métodos na Fase 5c, e foi essa a causa dos dois defeitos.
 */

export interface EstadoSimples {
  state: string;
  attributes: Record<string, unknown>;
}

/**
 * Normaliza um nome de dispositivo para comparação.
 *
 * "Echo Pop — Office" e "echo pop office" têm de casar: acentos caem, tudo vira
 * minúscula e qualquer pontuação vira espaço.
 */
export function normalizarDispositivo(valor: unknown): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Os atributos onde o SpotifyPlus publica o dispositivo em uso.
 *
 * A chave varia com a versão da integração e com o tipo de dispositivo, então a
 * origem consulta todas — e basta uma casar.
 */
const CAMPOS_DE_DISPOSITIVO = [
  'source',
  'source_name',
  'device_name',
  'active_device_name',
  'spotify_device_name',
  'media_player',
  'media_player_name',
] as const;

/**
 * O dispositivo ativo do Spotify é o deste cômodo?
 *
 * Sem `dispositivo` declarado, responde `true` — é o comportamento da origem
 * para cômodos que não distinguem aparelho.
 *
 * A comparação aceita conter, além de igualar, porque o Spotify às vezes
 * acrescenta sufixo ao nome ("Echo Show de Bruno"). O caminho inverso — o nome
 * publicado ser um pedaço do esperado — só vale a partir de 10 caracteres, para
 * um "Echo" solto não casar com todos os cômodos.
 */
export function dispositivoDoComodo(
  atributos: Record<string, unknown> | undefined,
  dispositivo: string | undefined,
): boolean {
  const esperado = normalizarDispositivo(dispositivo);
  if (!esperado) return true;
  const attrs = atributos ?? {};
  return CAMPOS_DE_DISPOSITIVO.some((campo) => {
    const lido = normalizarDispositivo(attrs[campo]);
    return Boolean(
      lido &&
        (lido === esperado ||
          lido.includes(esperado) ||
          (lido.length >= 10 && esperado.includes(lido))),
    );
  });
}

/** Estados do Spotify que contam como "tocando aqui". */
const TOCANDO = ['playing', 'paused'];

/**
 * O Spotify está tocando NESTE cômodo?
 *
 * Duas evidências, e basta uma:
 *   - o dispositivo ativo publicado pelo Spotify é o do cômodo;
 *   - o alto-falante do cômodo está tocando a MESMA faixa (usado quando o
 *     Spotify não publica o dispositivo, o que acontece em parte das versões).
 */
export function spotifyTocandoEm(
  spotify: EstadoSimples | undefined,
  dispositivo: string | undefined,
  altoFalante?: EstadoSimples | undefined,
): boolean {
  if (!spotify) return false;
  if (!TOCANDO.includes(String(spotify.state).toLowerCase())) return false;
  if (dispositivoDoComodo(spotify.attributes, dispositivo)) return true;
  return altoFalanteCasa(spotify.attributes, altoFalante);
}

/**
 * O alto-falante do cômodo está tocando a mesma coisa que o Spotify?
 *
 * Primeiro pelo aplicativo — se o Echo diz que a fonte é Spotify, resolvido.
 * Depois pelo conteúdo: mesmo título, ou título contido e mesmo artista.
 */
export function altoFalanteCasa(
  atributosSpotify: Record<string, unknown> | undefined,
  altoFalante: EstadoSimples | undefined,
): boolean {
  if (!altoFalante) return false;
  if (!TOCANDO.includes(String(altoFalante.state).toLowerCase())) return false;

  const a = altoFalante.attributes ?? {};
  const aplicativo = normalizarDispositivo(
    [a['app_name'], a['source'], a['media_content_type'], a['media_channel']].join(' '),
  );
  if (aplicativo.includes('spotify')) return true;

  const sp = atributosSpotify ?? {};
  const tituloFalante = normalizarDispositivo(a['media_title']);
  const tituloSpotify = normalizarDispositivo(sp['media_title']);
  if (tituloFalante && tituloSpotify && tituloFalante === tituloSpotify) return true;

  const artistaFalante = normalizarDispositivo(a['media_artist']);
  const artistaSpotify = normalizarDispositivo(sp['media_artist']);
  return Boolean(
    tituloFalante &&
      tituloSpotify &&
      tituloFalante.includes(tituloSpotify) &&
      artistaFalante &&
      artistaSpotify &&
      artistaFalante === artistaSpotify,
  );
}
