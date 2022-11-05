import Web3 from 'web3'
import CredentialABI from '../../lib/credential-abi.json'

export default function handler(req, res) {


  const privateKey = process.env.SAMPLE_ISSUER_PRIVATE_KEY
  const issuerAddress = process.env.SAMPLE_ISSUER_ADDRESS
  const iWeb3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL)
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

  const contract = new iWeb3.eth.Contract(CredentialABI, contractAddress)
  const account = iWeb3.eth.accounts.privateKeyToAccount(privateKey)
  iWeb3.eth.accounts.wallet.add(account)
  iWeb3.eth.defaultAccount = account.address

  const holderAddress = req.body.holderAddress
  const credentialType = req.body.credentialType
  // TODO: encrypted data should not come from client, should be encrypted on server
  const encryptedData = req.body.encryptedData
  // TODO: hash should be calculated or verified on server-side
  const dataHash = req.body.dataHash
  const holderSignature = req.body.holderSignature

  if (req.method !== 'POST') {
    res.status(400)
    return
  }

  iWeb3.eth.getTransactionCount(issuerAddress, async (err, txCount) => {
    var result = await contract.methods.safeMint(holderAddress, "012345", credentialType, encryptedData, dataHash, holderSignature, 'key')
      .send({
        from: issuerAddress,
        gasPrice: Web3.utils.toHex(Web3.utils.toWei('10', 'gwei')),
        gas: Web3.utils.toHex(800000),
        nonce: iWeb3.utils.toHex(txCount)
      });
    res.status(200).json(result);
  })
}
