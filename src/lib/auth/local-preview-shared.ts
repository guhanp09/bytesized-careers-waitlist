const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function isLocalPreviewRequest(input: {
  enabled: boolean;
  nodeEnv: 'development' | 'test' | 'production';
  host: string | null;
}): boolean {
  if (!input.enabled || input.nodeEnv !== 'development' || !input.host) return false;
  const hostname = input.host.startsWith('[')
    ? input.host.slice(0, input.host.indexOf(']') + 1)
    : (input.host.split(':')[0] ?? '');
  return LOCAL_HOSTS.has(hostname.toLowerCase());
}
