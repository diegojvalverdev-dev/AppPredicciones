/**
 * Extrae el mensaje de error del servidor desde cualquier respuesta HTTP.
 * Soporta: { message }, { Message }, { error }, { Error },
 *          strings planos, XML <Message>, y arrays de errores.
 */
export function extractErrorMessage(err: any, fallback = 'Ha ocurrido un error.'): string {
  if (!err) return fallback;

  // err.error es el body de la respuesta HTTP
  let body = err?.error;

  // ── 1. Body es un objeto directo (caso más común con Angular HttpClient) ──
  if (body && typeof body === 'object') {
    const msg =
      body.Message   ||   // { Message: "..." }  ← formato del servidor
      body.message   ||   // { message: "..." }
      body.Error     ||
      body.error     ||
      body.Detail    ||
      body.detail    ||
      body.Title     ||
      body.title     ||
      (Array.isArray(body.errors) ? body.errors.join(' ') : null);

    if (msg && typeof msg === 'string') return msg;
  }

  // ── 2. Body es un string (a veces Angular lo deja como texto) ──
  if (typeof body === 'string' && body.trim()) {
    // XML: <Message>texto</Message>
    const xmlMatch = body.match(/<Message[^>]*>([\s\S]*?)<\/Message>/i);
    if (xmlMatch) return xmlMatch[1].trim();

    // JSON en string
    try {
      const parsed = JSON.parse(body);
      const msg =
        parsed.Message || parsed.message ||
        parsed.Error   || parsed.error   ||
        parsed.Detail  || parsed.detail  ||
        parsed.Title   || parsed.title;
      if (msg && typeof msg === 'string') return msg;
    } catch { /* no es JSON */ }

    // String plano legible
    if (body.length < 300 && !body.startsWith('<')) return body;
  }

  // ── 3. statusText HTTP  ──
  if (err?.statusText && err.statusText !== 'Unknown Error') {
    return err.statusText;
  }

  // ── 4. Mensaje JS genérico ──
  if (err?.message && typeof err.message === 'string' &&
      !err.message.includes('Http failure')) {
    return err.message;
  }

  return fallback;
}
