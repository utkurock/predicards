// The exact message the wallet signs. MUST be byte-identical on client and server,
// otherwise signature recovery won't match. Address is always lowercased.
export function buildSignMessage(address: string, nonce: string, chainId: number): string {
  return [
    "Predicards wants you to sign in with your Base wallet.",
    "",
    `Address: ${address}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    "",
    "Signing is free and does not send a transaction.",
  ].join("\n");
}
