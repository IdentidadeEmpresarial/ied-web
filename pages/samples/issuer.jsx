import { useState, useEffect } from 'react';
import Head from 'next/head';
import Web3 from 'web3';
import CredentialABI from '../../lib/credential-abi.json';

export default function Issuer() {
  const iWeb3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const contract = new iWeb3.eth.Contract(CredentialABI, contractAddress)

  const [ethEnabled, setEthEnabled] = useState(false);
  const [address, setAddress] = useState(null);
  const [type, setType] = useState("certidao");
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(() => {
          window.web3 = new Web3(window.ethereum);
          setEthEnabled(true);
          window.web3.eth.getAccounts().then(accounts => {
            setAddress(accounts[0]);
          })
        })
    }
    setEthEnabled(false);
  }, [])


  async function getPublicKeyWithMetamask() {
    return await window.ethereum
      .request({
        method: 'eth_getEncryptionPublicKey',
        params: [address],
      });
  }


  async function sendCredential() {
    const holderPublicKey = await getPublicKeyWithMetamask();

    fetch('/api/issue-credential', {
      method: 'POST',
      headers: {
        'Content-Type': "application/json",
      },
      body: JSON.stringify({
        holderAddress: address,
        holderPublicKey: holderPublicKey,
        credentialType: type
      })
    });
  }


  async function listCredentials() {
    contract.methods.getAllTokensByOwner(address).call(async (err, tokensIds) => {
      const tokensByOwner = await Promise.all(tokensIds.map(async (tokenId) => {
        const attributes = await contract.methods.attributes(tokenId).call((err, attributes) => {
          if (err) {
            console.log(err);
          }
        });
        console.log(attributes);
        return {
          id: tokenId,
          type: attributes.objectType,
          hash: attributes.dataHash
        }
      }));
      setTokens(tokensByOwner);
    });
  }

  return (
    <>
      <Head>
        <title>Emissor</title>
      </Head>
      <article>
        <h1>emissor</h1>
        <div>{ethEnabled ? 'enabled' : 'disabled'}</div>
        <div>{address}</div>
        <br />
        <input onChange={e => setType(e.target.value)} placeholder="Tipo de credencial" />
        <button onClick={sendCredential} disabled={!ethEnabled}>Emitir credencial</button>
        <br />
        <button onClick={listCredentials} disabled={!ethEnabled}>Listar credenciais</button>
      </article>
      <ul>{tokens.map((token) => (
        <li key={token.id}>{token.id}: {token.type}: {token.hash}</li>
      ))}
      </ul>
    </>
  );
}