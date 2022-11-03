import { useState, useEffect} from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Web3 from 'web3'
import CredentialABI from '../../lib/credential-abi.json'

export default function Issuer() {
  const iWeb3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const contract = new iWeb3.eth.Contract(CredentialABI, contractAddress)

  const [ethEnabled, setEthEnabled] = useState(false);
  const [address, setAddress] = useState(null);
  const router = useRouter();
  const [type, setType] = useState();

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
    setType(router.query.type);
  }, [router.query])


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
        credentialType: type,
        data: JSON.stringify({description: "sample credential json encrypted by holder public key"})
      })
    });
  }

  return (
    <>
      <Head>
        <title>Emissor</title>
      </Head>
      <article>
        <h1>Emissor</h1>
        <div>User address: {address}</div>
        <br />
        <input type="text" value={type} onChange={e => setType(e.target.value)} />
        <button onClick={sendCredential} disabled={!ethEnabled}>Emitir credencial</button>
        <br />
      </article>
    </>
  );
}