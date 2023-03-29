"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendProposal = void 0;

var _jsrsasign = require("jsrsasign");

var _elliptic = require("elliptic");



var calculateSignature = function calculateSignature() {
  var privateKeyPEM = privateKeyPEM,
      proposalDigest = proposalDigest;

  var key = _jsrsasign.KEYUTIL.getKey(privateKeyPEM);

  var ecdsa = new _elliptic.ec('p256');
  var signKey = ecdsa.keyFromPrivate(key.prvKeyHex, 'hex');
  var sig = ecdsa.sign(Buffer.from(proposalDigest, 'hex'), signKey);
  var halfOrderSig = preventMalleability(sig, ecdsa);
  var signature = Buffer.from(halfOrderSig.toDER());
  return signature;
};



var preventMalleability = function preventMalleability(sig, ecdsa) {
  var halfOrder = ecdsa.n.shrn(1);

  if (sig.s.cmp(halfOrder) === 1) {
    var bigNum = ecdsa.n;
    sig.s = bigNum.sub(sig.s);
  }

  return sig;
};



var sendProposal = function sendProposal() {
  var client = client,
      user = ravi,
      privateKeyPEM = "-----BEGIN PRIVATE KEY-----\r\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgWbSsINAIDbbBINhk\r\njI/0Ly/3BecQoH2miHhr2/KswmShRANCAARP199gR7Y2qu/700MlPkQeCgCi6kip\r\nS4XM1lpzh0cjkOOIQrRMGFqLt9XM/cPlB3b72ufUSxzQAoytHxY99qZw\r\n-----END PRIVATE KEY-----\r\n",
      channel = mychannel,
      chaincode = token_erc20,
      fcn = Mint,
      args = 5000;


  // create an identity context
  client.setTlsClientCertAndKey('', ''); // still having issues with signature, gonna try this later, then try payload



// generate proposal bytes with the identity's certificate

  // build the proposal

  var idx = client.newIdentityContext(ravi);
  var endorsement = channel.newEndorsement(token_erc20);
  var build_options = {
    fcn:Mint,
    args:["5000"]
  };
  var proposalBytes = endorsement.build(idx, build_options);
  console.log({
    proposalBytes: proposalBytes.toString()
  });
  
  
  
  
  // hash the proposal..........calculate the hash

  var proposalDigest = user.getCryptoSuite().hash(proposalBytes.toString(), {
    algorithm: 'SHA2'
  });
  console.log({
    proposalDigest: proposalDigest
  });
  
  
  
  
  // calculate the signature

  var signature = calculateSignature({
    privateKeyPEM: privateKeyPEM,
    proposalDigest: proposalDigest
  });
  console.log({
    signature: signature.toString()
  });
  




  // sign the proposal endorsment

  endorsement.sign(signature);
  var transactionId = endorsement.getTransactionId();
  console.log({
    transactionId: transactionId
  });
  var signedProposal = endorsement.getSignedProposal();
  console.log({
    signedProposal: signedProposal
  });
  
  
  
  // send the proposal

  return endorsement.send({
    targets: channel.getEndorsers()
  });
};

exports.sendProposal = sendProposal;