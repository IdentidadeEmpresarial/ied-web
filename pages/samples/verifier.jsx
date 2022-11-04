import { useState, useEffect } from 'react';
import Head from 'next/head';
import Web3 from 'web3';
import CredentialABI from '../../lib/credential-abi.json';

export default function Verifier() {

    const iWeb3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const contract = new iWeb3.eth.Contract(CredentialABI, contractAddress)

    const [ethEnabled, setEthEnabled] = useState(false);
    const [address, setAddress] = useState(null);
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

    async function listCredentials() {
        const tokensByOwner = [];
        contract.methods.getAllTokensByOwner(address).call()
            .then(async (tokensIds) => {
                console.log(tokensIds);
                tokensIds.map(async (tokenId) => {
                    await contract.methods.attributes(tokenId).call()
                        .then(async (attributes) => {
                            console.log(attributes);
                            if (attributes.data && attributes.data.length > 10) {
                                await decrypt(attributes.data)
                                    .then(decryptedMessage => {
                                        tokensByOwner.push(
                                            {
                                                id: tokenId,
                                                type: attributes.credentialType,
                                                decryptedData: decryptedMessage
                                            }
                                        );
                                        console.log(tokensByOwner);
                                        setTokens(tokensByOwner.slice())
                                    }).catch(error => console.log(error));
                            }
                        });
                });
            })
    }

    return (
        <>
            <Head>
                <title>Verificador</title>
            </Head>
            <article>
                <h1>verificador</h1>
                <div>{ethEnabled ? 'enabled' : 'disabled'}</div>
                <div>{address}</div>
                <button onClick={listCredentials} disabled={!ethEnabled}>Listar credenciais</button>
            </article>
            <ul>{tokens.map((token) => (
                <li key={token.id}>
                    <div>Token id: {token.id}</div>
                    <div>Tipo: {token.type}</div>
                    <div>Dados desencriptados: {token.decryptedData}</div>
                </li>
            ))}
            </ul>
        </>
    );
}