// Re-exports the engine's pinned-link helpers and adds the helpers this site's content uses
// (named in pack.json `refHelpers`): one per document of the specification.
import { docLink, pinned } from '@kse/lib/sources';

export * from '@kse/lib/sources';

/** The overview (clpr-overview.md). */
export function overview(anchor = ''): string {
  return docLink('overview', anchor);
}

/** Protocol: conventions. */
export function conventions(anchor = ''): string {
  return docLink('conventions', anchor);
}

/** Protocol: ledger configuration. */
export function ledgerConfig(anchor = ''): string {
  return docLink('ledgerConfig', anchor);
}

/** Protocol: endpoint manifest. */
export function manifest(anchor = ''): string {
  return docLink('manifest', anchor);
}

/** Protocol: channel setup. */
export function channelSetup(anchor = ''): string {
  return docLink('channelSetup', anchor);
}

/** Protocol: connector setup. */
export function connectorSetup(anchor = ''): string {
  return docLink('connectorSetup', anchor);
}

/** Protocol: messaging. */
export function messaging(anchor = ''): string {
  return docLink('messaging', anchor);
}

/** Protocol: bundle. */
export function bundle(anchor = ''): string {
  return docLink('bundle', anchor);
}

/** Protocol: verifier interface. */
export function verifierIface(anchor = ''): string {
  return docLink('verifierIface', anchor);
}

/** Protocol: channel state transitions. */
export function transitions(anchor = ''): string {
  return docLink('transitions', anchor);
}

/** Protocol: endpoint sync. */
export function endpointSync(anchor = ''): string {
  return docLink('endpointSync', anchor);
}

/** Protocol: schema. */
export function schema(anchor = ''): string {
  return docLink('schema', anchor);
}

/** The open issues list (non-normative). */
export function openIssues(anchor = ''): string {
  return docLink('openIssues', anchor);
}

/** Recommendations: CLPR Service. */
export function service(anchor = ''): string {
  return docLink('service', anchor);
}

/** Recommendations: stakes and bonds. */
export function stakes(anchor = ''): string {
  return docLink('stakes', anchor);
}

/** Recommendations: channel economics. */
export function economics(anchor = ''): string {
  return docLink('economics', anchor);
}

/** A file in the Solidity contracts repo. */
export function sol(path: string, line?: number): string {
  return pinned('clpr-smart-contracts', path, line ? `L${line}` : '');
}
