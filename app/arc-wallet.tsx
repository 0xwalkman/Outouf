"use client";
import { useEffect, useRef, useState } from "react";

type Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: () => void) => void;
  removeListener?: (event: string, callback: () => void) => void;
};
const CHAIN_ID = "0x" + (5042002).toString(16);

export function ArcWallet() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const providerRef = useRef<Provider | undefined>(undefined);
  useEffect(() => {
    const provider = (window as Window & { ethereum?: Provider }).ethereum;
    providerRef.current = provider;
    const clear = () => { generation.current++; setAddress(""); setBalance(""); setBusy(false); setError("Wallet changed. Reconnect to refresh the account and network."); };
    for (const event of ["accountsChanged", "chainChanged", "disconnect"]) provider?.on?.(event, clear);
    return () => { generation.current++; for (const event of ["accountsChanged", "chainChanged", "disconnect"]) provider?.removeListener?.(event, clear); };
  }, []);

  async function connect() {
    const provider = providerRef.current;
    if (!provider) { setError("No browser wallet was detected. Open this site in a browser with an EVM wallet extension."); return; }
    setBusy(true); setError(""); setAddress(""); setBalance("");
    let ticket = ++generation.current;
    try {
      await provider.request({ method: "eth_requestAccounts" });
      try {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID }] });
      } catch (cause) {
        if ((cause as { code?: number }).code !== 4902) throw cause;
        await provider.request({ method: "wallet_addEthereumChain", params: [{
          chainId: CHAIN_ID, chainName: "Arc Testnet",
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          rpcUrls: ["https://rpc.testnet.arc.io"], blockExplorerUrls: ["https://explorer.testnet.arc.io"]
        }] });
      }
      // Account/network events during permission and network selection are expected.
      ticket = ++generation.current; setBusy(true); setError("");
      const chain = await provider.request({ method: "eth_chainId" });
      if (typeof chain !== "string" || BigInt(chain) !== BigInt(CHAIN_ID)) throw new Error("Select Arc Testnet in your wallet, then reconnect.");
      const accounts = await provider.request({ method: "eth_accounts" });
      if (!Array.isArray(accounts) || !/^0x[a-fA-F0-9]{40}$/.test(accounts[0] || "")) throw new Error("No wallet account was authorized.");
      const raw = await provider.request({ method: "eth_getBalance", params: [accounts[0], "latest"] });
      if (typeof raw !== "string" || !/^0x[0-9a-f]+$/i.test(raw)) throw new Error("The wallet returned an invalid balance.");
      const amount = BigInt(raw);
      if (generation.current !== ticket) return;
      setAddress(accounts[0]);
      setBalance((amount / 10n ** 18n).toString() + "." + ((amount % 10n ** 18n) / 10n ** 12n).toString().padStart(6, "0"));
    } catch (cause) {
      if (generation.current === ticket) setError((cause as { code?: number }).code === 4001 ? "Connection cancelled. No funds were moved." : cause instanceof Error ? cause.message : "Could not connect. Check your wallet and try again.");
    } finally { if (generation.current === ticket) setBusy(false); }
  }
  return <section className="app-page wallet-page"><div className="page-intro"><p className="eyebrow">ARC TESTNET · SELF-CUSTODY</p><h1>Your wallet. Your keys.</h1><p>Connect a browser wallet to read its testnet USDC balance. This does not transfer funds or authorize purchases.</p></div><div className="wallet-layout"><article className="balance-card"><p>TEST USDC · NOT REAL MONEY</p><h2>{address ? balance : "Not connected"}</h2>{address && <address>{address}</address>}<div><button className="primary-button" disabled={busy} onClick={connect}>{busy ? "WAITING FOR WALLET…" : address ? "REFRESH CONNECTION" : "CONNECT BROWSER WALLET"}</button>{address && <button className="secondary-button" onClick={() => { generation.current++; setAddress(""); setBalance(""); setError(""); }}>CLEAR CONNECTION</button>}</div>{address && <p><a style={{ color: "white" }} href={"https://explorer.testnet.arc.io/address/" + address} target="_blank" rel="noreferrer">View account on Arc explorer ↗</a></p>}</article><article className="activity-card wallet-help"><h2>A safe place to test.</h2><p>Network: Arc Testnet (5042002). Balance is read from your wallet provider, not an OUTOUF account ledger.</p><p>No seed phrase or private key is requested. Clearing the connection only clears this page; revoke site permissions inside your wallet.</p><p>Card purchases, deposits to OUTOUF and checkout are not enabled. Do not send real funds to testnet.</p></article></div>{error && <p role="alert">{error}</p>}</section>;
}
