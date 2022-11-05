import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Web3 from 'web3'
import CredentialABI from '../../lib/credential-abi.json'
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from '@metamask/eth-sig-util';

export default function Issuer() {
  const iWeb3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const contract = new iWeb3.eth.Contract(CredentialABI, contractAddress)

  const router = useRouter();

  const [ethEnabled, setEthEnabled] = useState(false);
  const [address, setAddress] = useState(null);
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

  async function encryptWithPublicKey(pubkey, text) {
    const encryptedText = ethUtil.bufferToHex(
      Buffer.from(
        JSON.stringify(
          sigUtil.encrypt({
            publicKey: pubkey,
            data: text,
            version: 'x25519-xsalsa20-poly1305',
          })
        ),
        'utf8'
      ));
    return encryptedText;
  }


  async function sendCredential() {
    const holderPublicKey = await getPublicKeyWithMetamask();
    const credentialData = "1699143646;NAO_CONSTA_DEBITO";
    const prefix = "\x19Ethereum Signed Message:\n" + credentialData.length;
    const dataHash = Web3.utils.sha3(prefix + credentialData);

    console.log(credentialData);
    const holderSignature = await window.web3.eth.personal.sign(credentialData, address);

    const encryptedData = await encryptWithPublicKey(holderPublicKey, credentialData);

    const requestObject = {
      holderAddress: address,
      credentialType: type,
      dataHash: dataHash,
      holderSignature: holderSignature,
      encryptedData: encryptedData
    };

    fetch('/api/issue-credential', {
      method: 'POST',
      headers: {
        'Content-Type': "application/json",
      },
      body: JSON.stringify(requestObject)
    }).then(res => {
      return res.json()
    }).then(data => {
      console.log(data)
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