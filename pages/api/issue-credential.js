import Web3 from 'web3';
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from '@metamask/eth-sig-util';
import CredentialABI from '../../lib/credential-abi.json';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(400);
    return;
  }

  const privateKey = process.env.ISSUER_PRIVATE_KEY;
  const issuerAddress = process.env.NEXT_PUBLIC_ISSUER_ADDRESS;
  const iWeb3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const contract = new iWeb3.eth.Contract(CredentialABI, contractAddress)

  const holderAddress = req.body.holderAddress;
  const holderPublicKey = req.body.holderPublicKey;
  const credentialType = req.body.credentialType;

  iWeb3.eth.getTransactionCount(issuerAddress, async (err, txCount) => {
    console.log(`txCount: ${txCount}`);

    const networkId = await iWeb3.eth.net.getId();
    console.log(`networkId: ${networkId}`);
    const hash = await encryptWithPublicKey(holderPublicKey, 'mensagem secreta');
    console.log(hash);
    const tx = await iWeb3.eth.accounts.signTransaction(
      {
        nonce: iWeb3.utils.toHex(txCount),
        chainId: networkId,
        to: contractAddress,
        gasPrice: Web3.utils.toHex(Web3.utils.toWei('10', 'gwei')),
        gas: Web3.utils.toHex(800000),
        data: contract.methods.safeMint(holderAddress, "012345", credentialType, hash, 'key').encodeABI()
      },
      privateKey
    );

    iWeb3.eth.sendSignedTransaction(tx.rawTransaction, (err, txHash) => {
      console.log('err:', err, 'txHash:', txHash)
      res.status(200).json({ txHash: txHash })
    })
  })
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
  console.log(`encrypted text: ${encryptedText}`);
  return encryptedText;
}

