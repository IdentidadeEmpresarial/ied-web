import Link from 'next/Link'
import { useState, useEffect } from 'react'
import Web3 from 'web3'
import CredentialABI from '../lib/credential-abi.json'

function Header({ title }) {
  return <h1>{title ? title : "CDiD"}</h1>
}

export default function Dashboard(App) {

  const iWeb3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const contract = new iWeb3.eth.Contract(CredentialABI, contractAddress)

  const [ethEnabled, setEthEnabled] = useState(false);
  const [address, setAddress] = useState(null);
  const [issuers, setIssuers] = useState([
    {
      id: 1,
      name: 'Receita',
      credentialTypes: [
        {
          id: 1,
          name: 'CNPJ - Inscrição no Cadastro Nacional da Pessoa Jurídica'
        }, {
          id: 2,
          name: 'Regularidade com a Fazenda Nacional'
        }
      ]
    }
  ]);


  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(() => {
          window.web3 = new Web3(window.ethereum);
          setEthEnabled(true);
          window.web3.eth.getAccounts().then(accounts => {
            setAddress(accounts[0]);
            listCredentials(accounts[0]);
          })
        })
    }
    setEthEnabled(false);
  }, []);

  async function decrypt(encryptedMessage) {
    return ethereum
      .request({
        method: 'eth_decrypt',
        params: [encryptedMessage, address],
      }).catch((error) => {
        console.log(error.message);
      });
  }

  async function decryptCredentials() {
    credentials.forEach(async credential => {
      if (credential.data && credential.data.length > 10) {
        await decrypt(credential.data)
          .then(decryptedMessage => {
            credential.decryptedData = decryptedMessage;
            set(credentials.slice())
          }).catch(error => console.log(error));
      }
    });
  }

  async function listCredentials(address) {
    console.log(address);
    contract.methods.getAllTokensByOwner(address).call()
      .then(async (tokensIds) => {
        tokensIds.map(async (tokenId) => {
          await contract.methods.attributes(tokenId).call()
            .then(async (attributes) => {
              const credential = {
                id: tokenId,
                subjectId: attributes.subjectId,
                type: attributes.objectType,
                data: attributes.data,
                dataHash: attributes.dataHash,
                dataKey: attributes.dataKey
              }
              issuers.forEach(issuer => {
                issuer.credentialTypes
                  .filter(type => type.name === credential.type)
                  .forEach(type => {
                    type.holderCredential = credential;
                  });
              });
              setIssuers(issuers.slice())
            });
        });
      })
  }

  return (
    <>
      <div className="header">
        <div className="header-left">
          <img loading="lazy" src="/images/logo.png" className="logo" />
          <div className="header-title">CDiD</div>
        </div>
        <div className="header-right">
          <span>User address: {address}</span>
        </div>
      </div>
      <div>Dashboard</div>
      <div>
        <ul>{issuers.map((issuer) => (
          <li key={issuer.id}>
            <span>{issuer.name}</span>
            <ul>{issuer.credentialTypes.map((type) => (
              <li key={type.id}>
                <div>{type.name}</div>
                <div>{!type.holderCredential &&
                  <Link href={{
                    pathname: "/samples/issuer",
                    query: { type: type.name }
                  }}>Emitir credencial</Link>
                }</div>
                <div>{type.holderCredential &&
                    <div>{JSON.stringify(type.holderCredential)}</div>
                }</div>
              </li>
            ))}
            </ul>
          </li>
        ))}
        </ul>
      </div>
    </>
  )
}