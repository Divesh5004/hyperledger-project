/*
* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const {Client, User, Endorser, DiscoveryService, Discoverer, Committer} = require('fabric-common');
const fs = require('fs');
const path = require('path');

const elliptic = require('elliptic');
const { KEYUTIL } = require('jsrsasign');
const crypto = require('crypto');

async function main() {
try {


const enrollmentID = 'abhi'
var userEnrollmentSecret = 'abhipw'
var userEnrollment;


// load the network configuration
const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// Create a new CA client for interacting with the CA.
const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
const caTLSCACerts = caInfo.tlsCACerts.pem;
const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = await Wallets.newFileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

// Check to see if we've already enrolled an user.
const userIdentity = await wallet.get(enrollmentID);
if(userIdentity){
console.log('An identity for an user already exists in the wallet');
// Need to do: userEnrollment = userIdentity.getEnrollmentCertificate;

} else {

// Check to see if we've already enrolled the admin user.
const adminIdentity = await wallet.get('admin');
if (!adminIdentity) {
console.log('An identity for the admin user "admin" does not exists in the wallet. Enrolling Now...');
// Enroll the admin user, and import the new identity into the wallet.
const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
const x509Identity = {
credentials: {
certificate: enrollment.certificate,
privateKey: enrollment.key.toBytes(),
},
mspId: 'Org1MSP',
type: 'X.509',
};
await wallet.put('admin', x509Identity);
console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
}

const adminId = await wallet.get('admin');
// build a user object for authenticating with the CA
const provider = wallet.getProviderRegistry().getProvider(adminId.type);
const adminUser = await provider.getUserContext(adminId, 'admin');

// Register the user
const userEnrollSecret = await ca.register({
affiliation: 'org1.department1',
enrollmentID: enrollmentID,
enrollmentSecret: userEnrollmentSecret,
role: 'client'
}, adminUser);

// Read CSR from File system
const csr = fs.readFileSync('csr.pem', 'utf8');
const req = {
enrollmentID: enrollmentID,
enrollmentSecret: userEnrollmentSecret,
csr: csr,
};
// Enroll the user with CSR, and import the new identity into the wallet.
userEnrollment = await ca.enroll(req);
const x509Identity = {
credentials: {
certificate: userEnrollment.certificate
},
mspId: 'Org1MSP',
type: 'X.509',
};


await wallet.put(enrollmentID, x509Identity);
console.log('Successfully enrolled an User and imported it into the wallet');
console.log(userEnrollment.certificate)
console.log(userEnrollment.key)

}

 
// This is a sample code for signing the digest from step 2 with EC.
// Different signature algorithm may have different interfaces
// ECDSA -- ASN1 OID: prime256v1 -- NIST CURVE: P-256 -- Signature Algorithm: ecdsa-with-SHA256 --

const privateKeyPEM = fs.readFileSync("private-key.pem", "utf8");
console.log("My key is: ", privateKeyPEM);
const { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM); // convert the pem encoded key to hex encoded private key

const EC = elliptic.ec;
const ecdsaCurve = elliptic.curves['p256'];

const ecdsa = new EC(ecdsaCurve);
const signKey = ecdsa.keyFromPrivate(prvKeyHex, 'hex');


// Creating Client, Identity Context, etc
const client = new Client('myclient');
const channel = client.newChannel('mychannel');
const user = User.createUser(enrollmentID, userEnrollmentSecret, 'Org1MSP', userEnrollment.certificate, privateKeyPEM);
const idx = client.newIdentityContext(user);

// To get Service Discovery Results if suppose we need to get dynamic Peer and Orderer Info
// Right now - static peer and orderer objects were used
const discoverer = new Discoverer("peer0", client, "Org1MSP");
const endpoint = client.newEndpoint({
url: 'grpcs://localhost:7051',
pem : "-----BEGIN CERTIFICATE-----\nMIICJjCCAc2gAwIBAgIUa7nuWqEAeGOKvJNAxFAT2g7BYMEwCgYIKoZIzj0EAwIw\ncDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQH\nEwZEdXJoYW0xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMjMwMzIxMDQ1OTAwWhcNMzgwMzE3MDQ1OTAw\nWjBwMQswCQYDVQQGEwJVUzEXMBUGA1UECBMOTm9ydGggQ2Fyb2xpbmExDzANBgNV\nBAcTBkR1cmhhbTEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMT\nY2Eub3JnMS5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABPNY\ndART4NLHzs4uX/4w012gaNvABIgsYsgJZaZEg1xaAoDKt4V/ZXIettgtHiF3d76r\n9bwxJpFsZNt1gagWdN2jRTBDMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMBAf8ECDAG\nAQH/AgEBMB0GA1UdDgQWBBQt8vp4TH/z3FQhrkN26yQG15hw7DAKBggqhkjOPQQD\nAgNHADBEAiAUChTo3ZOVC3YCUsIqWxvjJjhUZ6cb48Dk7ZN35qMOZAIgN5WdYNqK\n56Lzixw4v3BpUN/fw5bOiPEKt4sT7jwDVJQ=\n-----END CERTIFICATE-----\n",
"ssl-target-name-override" : 'peer0.org1.example.com',
requestTimeout: 3000
});
discoverer.setEndpoint(endpoint);
// await discoverer.connect()

const discovery = new DiscoveryService("basic", channel);
// const endorsement1 = channel.newEndorsement("basic");
// discovery.build(idx, {endorsement: endorsement1});
discovery.build(idx);
discovery.sign(idx);

const discovery_results = await discovery.send({targets: [discoverer], asLocalhost: true});
console.log(JSON.stringify(discovery_results))

 

// Creating Proposal
const endorsement = channel.newEndorsement("basic");
const build_options = {fcn: 'TransferAsset', args: ['asset2', 'Kavin']};
const proposalBytes = endorsement.build(idx, build_options);


// Calculate Hash for transaction Proposal Bytes
const hash = crypto.createHash('sha256').update(proposalBytes).digest('hex');


// Creating Signature
const sig = ecdsa.sign(Buffer.from(hash, 'hex'), signKey, { canonical: true });
const signature = Buffer.from(sig.toDER());
console.log('signature:', signature)

// Endorserer Objects
const peer0Org1Endorser = new Endorser("peer0Org1", client, "Org1MSP");
const peer0Org1Endpoint = client.newEndpoint({
url: 'grpcs://localhost:7051',
pem : "-----BEGIN CERTIFICATE-----\nMIICJjCCAc2gAwIBAgIUa7nuWqEAeGOKvJNAxFAT2g7BYMEwCgYIKoZIzj0EAwIw\ncDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQH\nEwZEdXJoYW0xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMjMwMzIxMDQ1OTAwWhcNMzgwMzE3MDQ1OTAw\nWjBwMQswCQYDVQQGEwJVUzEXMBUGA1UECBMOTm9ydGggQ2Fyb2xpbmExDzANBgNV\nBAcTBkR1cmhhbTEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMT\nY2Eub3JnMS5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABPNY\ndART4NLHzs4uX/4w012gaNvABIgsYsgJZaZEg1xaAoDKt4V/ZXIettgtHiF3d76r\n9bwxJpFsZNt1gagWdN2jRTBDMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMBAf8ECDAG\nAQH/AgEBMB0GA1UdDgQWBBQt8vp4TH/z3FQhrkN26yQG15hw7DAKBggqhkjOPQQD\nAgNHADBEAiAUChTo3ZOVC3YCUsIqWxvjJjhUZ6cb48Dk7ZN35qMOZAIgN5WdYNqK\n56Lzixw4v3BpUN/fw5bOiPEKt4sT7jwDVJQ=\n-----END CERTIFICATE-----\n",
requestTimeout: 30000
});

peer0Org1Endorser.setEndpoint(peer0Org1Endpoint);
await peer0Org1Endorser.connect();
console.log("peer0Org1Endorser status: ", await peer0Org1Endorser.checkConnection())


const peer0Org2Endorser = new Endorser("peer0Org2", client, "Org2MSP");


const peer0Org2Endpoint = client.newEndpoint({
url: 'grpcs://localhost:9051',
pem: "-----BEGIN CERTIFICATE-----\nMIICHzCCAcWgAwIBAgIUJ7rHN5RcYSjzuNeAr8zhfMNRThEwCgYIKoZIzj0EAwIw\nbDELMAkGA1UEBhMCVUsxEjAQBgNVBAgTCUhhbXBzaGlyZTEQMA4GA1UEBxMHSHVy\nc2xleTEZMBcGA1UEChMQb3JnMi5leGFtcGxlLmNvbTEcMBoGA1UEAxMTY2Eub3Jn\nMi5leGFtcGxlLmNvbTAeFw0yMzAzMjEwNDU5MDBaFw0zODAzMTcwNDU5MDBaMGwx\nCzAJBgNVBAYTAlVLMRIwEAYDVQQIEwlIYW1wc2hpcmUxEDAOBgNVBAcTB0h1cnNs\nZXkxGTAXBgNVBAoTEG9yZzIuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2NhLm9yZzIu\nZXhhbXBsZS5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQ77HY37zSKU+xG\nAJlP6ycRAW6JU2BsZ6GHsN70mOKDVTFBpnvv8YsL7wkSxPtBNvqeg8TOJB36SZZR\nQZ6bi4yGo0UwQzAOBgNVHQ8BAf8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBATAd\nBgNVHQ4EFgQU/lY9eQNldvtedSBAOJjqCgW8O54wCgYIKoZIzj0EAwIDSAAwRQIh\nALFA9CGstI95Xw2FQxbX4ZCBkWy3KTaiIGMXOArHToYNAiBE0IpzD4qeUUwlsYcX\nDXdMzS4pdEdvoxRTP6qpODw63g==\n-----END CERTIFICATE-----\n",
"ssl-target-name-override" : 'peer0.org2.example.com',
requestTimeout: 3000
});

peer0Org2Endorser.setEndpoint(peer0Org2Endpoint);
await peer0Org2Endorser.connect();
console.log("peer0Org2Endorser status: ", await peer0Org2Endorser.checkConnection())

// Final - Sending Proposal Request
endorsement.sign(signature);
const proposalResponses = await endorsement.send({targets : [peer0Org1Endorser, peer0Org2Endorser]});
console.log(proposalResponses.responses);




// Committer Objects
const newCommitter = new Committer("orderer.example.com", client, "OrdererMSP");
const newCommitterEndpoint = client.newEndpoint({
url: 'grpcs://localhost:7050',
pem : '-----BEGIN CERTIFICATE-----\n' +
'MIICCzCCAbGgAwIBAgIUJjnLhEyhbYm1oBScDfEUOeCmu+EwCgYIKoZIzj0EAwIw\n' +
'YjELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcg\n' +
'WW9yazEUMBIGA1UEChMLZXhhbXBsZS5jb20xFzAVBgNVBAMTDmNhLmV4YW1wbGUu\n' +
'Y29tMB4XDTIzMDMyMTA0NTkwMFoXDTM4MDMxNzA0NTkwMFowYjELMAkGA1UEBhMC\n' +
'VVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcgWW9yazEUMBIGA1UE\n' +
'ChMLZXhhbXBsZS5jb20xFzAVBgNVBAMTDmNhLmV4YW1wbGUuY29tMFkwEwYHKoZI\n' +
'zj0CAQYIKoZIzj0DAQcDQgAEpzCnXuCWvwKh0ZpBM7UtK3zkMgKFxd/raJkV6GEn\n' +
'TSAR+z8+Qt0XsijSI5pxYJsiQtQ1i0b+5Bbv5nfw/ubASqNFMEMwDgYDVR0PAQH/\n' +
'BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYEFB5FeV9pQUjL5nXW\n' +
'uiZaDf5hzBWFMAoGCCqGSM49BAMCA0gAMEUCIQCElxp7SZBZlmPSWhOaCRFKV+iV\n' +
'JrU8AEASKk5LnJu1gQIgc+jdruyl450/3bpbo++3IdhHT3HrUM6i0uQBHMFpydw=\n' +
'-----END CERTIFICATE-----\n',
'ssl-target-name-override': 'orderer.example.com',
requestTimeout: 3000
});


newCommitter.setEndpoint(newCommitterEndpoint);
await newCommitter.connect();
console.log("Committer Connection Status: ", await newCommitter.checkConnection())

// Commit the Transaction
const commitReq = endorsement.newCommit();
commitReq.build(idx);
commitReq.sign(idx);
const res = await commitReq.send({targets: [newCommitter]});
console.log("Commit Result: ", res);


} catch (error) {
console.error(`Failed to enroll admin user "admin": ${error}`);
process.exit(1);
}
}

main();




// const newCommitter = new Committer("orderer.example.com", client, "OrdererMSP");

// const newCommitterEndpoint = client.newEndpoint({
//   url: 'grpcs://localhost:7050',
//   pem : '-----BEGIN CERTIFICATE-----MIICCjCCAbGgAwIBAgIUc0RQztzJJ9bEfbM8/WwXJiox0WAwCgYIKoZIzj0EAwIwYjELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcgWW9yazEUMBIGA1UEChMLZXhhbXBsZS5jb20xFzAVBgNVBAMTDmNhLmV4YW1wbGUuY29tMB4XDTIzMDMyMDA5MzMwMFoXDTM4MDMxNjA5MzMwMFowYjELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcgWW9yazEUMBIGA1UEChMLZXhhbXBsZS5jb20xFzAVBgNVBAMTDmNhLmV4YW1wbGUuY29tMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAETTvxpAiWhUGZOwWRdLuCx34wd3CuT2ooK8WA2iD6OOmMyzUEVDUvNO2Q9CEz2mqmt/KPoOlALbZTa7gr6b9iiqNFMEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYEFMNo0ErHiNxWLwaaqPVN6WxFLgMwMAoGCCqGSM49BAMCA0cAMEQCIAbN/UsLeR3na+HQFFd4mZulcxHaVJjdOg0uvY7hEPJlAiA9ZNdOMOKKBkFmt1yDcHg1kZIc5iwCXXNBKw+uudp+MA==-----END CERTIFICATE-----',
//   "ssl-target-name-override" : 'orderer.example.com',
//   requestTimeout: 3000
// });

// newCommitter.setEndpoint(newCommitterEndpoint);

// await newCommitter.connect();

// console.log("Committer Connection Status: ", await newCommitter.checkConnection());

// // Build and sign the endorsement
// const endorsement = client.newEndorsement('mychannel');
// const idx = endorsement.build({fcn: 'myFunction', args: ['arg1', 'arg2']});
// endorsement.sign(idx, 'mySigningIdentity');

// // Commit the Transaction
// const commitReq = endorsement.newCommit();






// Committer Objects
// const newCommitter = new Committer("orderer.example.com", client, "OrdererMSP");
// const newCommitterEndpoint = client.newEndpoint({
// url: 'grpcs://localhost:7050',
// pem : '-----BEGIN CERTIFICATE-----MIICCjCCAbGgAwIBAgIUc0RQztzJJ9bEfbM8/WwXJiox0WAwCgYIKoZIzj0EAwIwYjELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcgWW9yazEUMBIGA1UEChMLZXhhbXBsZS5jb20xFzAVBgNVBAMTDmNhLmV4YW1wbGUuY29tMB4XDTIzMDMyMDA5MzMwMFoXDTM4MDMxNjA5MzMwMFowYjELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcgWW9yazEUMBIGA1UEChMLZXhhbXBsZS5jb20xFzAVBgNVBAMTDmNhLmV4YW1wbGUuY29tMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAETTvxpAiWhUGZOwWRdLuCx34wd3CuT2ooK8WA2iD6OOmMyzUEVDUvNO2Q9CEz2mqmt/KPoOlALbZTa7gr6b9iiqNFMEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYEFMNo0ErHiNxWLwaaqPVN6WxFLgMwMAoGCCqGSM49BAMCA0cAMEQCIAbN/UsLeR3na+HQFFd4mZulcxHaVJjdOg0uvY7hEPJlAiA9ZNdOMOKKBkFmt1yDcHg1kZIc5iwCXXNBKw+uudp+MA==-----END CERTIFICATE-----',
// "ssl-target-name-override" : 'orderer.example.com',
// requestTimeout: 3000
// });
// newCommitter.setEndpoint(newCommitterEndpoint);
// await newCommitter.connect();
// console.log("Committer Connection Status: ", await newCommitter.checkConnection())

// // Commit the Transaction
// const commitReq = endorsement.newCommit();
// commitReq.build(idx);
// commitReq.sign(idx);
// const res = await commitReq.send({targets : [newCommitter]});
// console.log("Commit Result: ", res)
