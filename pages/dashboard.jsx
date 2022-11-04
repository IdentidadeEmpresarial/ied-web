import Link from 'next/Link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Web3 from 'web3'
import CredentialABI from '../lib/credential-abi.json'

function Header({ title }) {
  return <h1>{title ? title : "CDiD"}</h1>
}

export default function Dashboard(App) {

  const iWeb3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL)
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  const contract = new iWeb3.eth.Contract(CredentialABI, contractAddress)

  const router = useRouter()

  const [ethEnabled, setEthEnabled] = useState(false)
  const [address, setAddress] = useState(null)
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
  ])


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

  async function decryptCredential(credential) {
    console.log(credential)
    if (credential.data && credential.data.length > 10) {
      await decrypt(credential.data)
        .then(decryptedMessage => {
          credential.decryptedData = decryptedMessage;
          setIssuers(issuers.slice())
        }).catch(error => console.log(error));
    }
  }

  async function listCredentials(address) {
    contract.methods.getAllTokensByOwner(address).call()
      .then(async (tokensIds) => {
        tokensIds.map(async (tokenId) => {
          await contract.methods.attributes(tokenId).call()
            .then(async (attributes) => {
              const credential = {
                id: tokenId,
                issuer: attributes.issuer,
                subjectId: attributes.subjectId,
                type: attributes.credentialType,
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

  async function burnCredential(credential) {
    window.web3.eth.getTransactionCount(address, async (err, txCount) => {
      const networkId = await window.web3.eth.net.getId();
      const tx =
      {
        from: address,
        nonce: window.web3.utils.toHex(txCount),
        to: contractAddress,
        chainId: networkId,
        gasPrice: Web3.utils.toHex(Web3.utils.toWei('10', 'gwei')),
        gas: Web3.utils.toHex(800000),
        data: contract.methods.burn(credential.id).encodeABI()
      };
      console.log(tx)
      window.web3.eth.sendTransaction(tx, (err, txHash) => {
        console.log('err:', err, 'txHash:', txHash)
        router.reload(window.location.pathname)
      })

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
                {type.holderCredential &&
                  <>
                    <div>
                      {!type.holderCredential.decryptedData &&
                        <button onClick={e => decryptCredential(type.holderCredential)}>Visualizar</button>
                      }
                      {type.holderCredential.decryptedData &&
                        <div>JSON da credencial: {type.holderCredential.decryptedData}</div>
                      }
                    </div>
                    <div>
                      <button onClick={e => burnCredential(type.holderCredential)}>Excluir credencial</button>
                    </div>
                  </>
                }
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