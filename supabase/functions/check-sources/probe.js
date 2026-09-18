const allowed = new Set(['dos.fl.gov','floridarevenue.com','www.flsenate.gov','www.fdacs.gov','www.gainesvillefl.gov','www.alachuacollector.com','www.orlando.gov','taxcollector.jacksonville.gov','www.tampa.gov','www.miami.gov','mdctaxcollector.gov']);
export function sourceUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !allowed.has(url.hostname) || url.port || url.username || url.password) throw Error('Source URL requires review');
  return url;
}
export async function fingerprint(response) {
  const reader = response.body?.getReader();
  if (!reader) throw Error('Empty body');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1048576) throw Error('Source exceeds 1 MiB review limit');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  if (!size) throw Error('Empty body');
  const content = new Uint8Array(size); let offset = 0;
  for (const part of chunks) { content.set(part,offset); offset += part.length; }
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',content))).map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function probeSource(source, fetcher = fetch) {
  const response = await fetcher(sourceUrl(source.url), {redirect:'error',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'MDH-Source-Check/1.0'}});
  if (!response.ok) { await response.body?.cancel(); throw Error(`HTTP ${response.status}`); }
  const hash = await fingerprint(response);
  const baseline = typeof source.fingerprint === 'string' && source.fingerprint.length > 0;
  return {hash,changed:baseline && hash !== source.fingerprint,baseline,httpStatus:response.status};
}
