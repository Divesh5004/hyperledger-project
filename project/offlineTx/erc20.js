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

// =============================================START OF ADMIN ENROLL======================================================

const enrollmentID = 'dscf'
var userEnrollmentSecret = 'dsfd'
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


// =============================================END OF ADMIN ENROLL======================================================







// =============================================Register the user================================================================


const userEnrollSecret = await ca.register({
affiliation: 'org1.department1',
enrollmentID: enrollmentID,
enrollmentSecret: userEnrollmentSecret,
role: 'client'
}, adminUser);






// ============================================Read CSR from File system================================================

const csr = fs.readFileSync('csr.pem', 'utf8');
const req = {
enrollmentID: enrollmentID,
enrollmentSecret: userEnrollmentSecret,
csr: csr,
};






// ===========================Enroll the user with CSR, and import the new identity into the wallet.=============================


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








// ========================================Creating Client, Identity Context, etc===================================


const client = new Client('myclient');
const channel = client.newChannel('mychannel');
const user = User.createUser(enrollmentID, userEnrollmentSecret, 'Org1MSP', userEnrollment.certificate, privateKeyPEM);
const idx = client.newIdentityContext(user);
// To get Service Discovery Results if suppose we need to get dynamic Peer and Orderer Info
// Right now - static peer and orderer objects were used
const discoverer = new Discoverer("peer0", client, "Org1MSP");
const endpoint = client.newEndpoint({
url: 'grpcs://localhost:7051',
pem : "-----BEGIN CERTIFICATE-----\nMIICJjCCAc2gAwIBAgIUUXrOrnPZSANZFgk3z4kbYQEG8fMwCgYIKoZIzj0EAwIw\ncDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQH\nEwZEdXJoYW0xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMjMwMzIxMDY1OTAwWhcNMzgwMzE3MDY1OTAw\nWjBwMQswCQYDVQQGEwJVUzEXMBUGA1UECBMOTm9ydGggQ2Fyb2xpbmExDzANBgNV\nBAcTBkR1cmhhbTEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMT\nY2Eub3JnMS5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABG8G\nEvaw8lIqlJTnc65xxnSHBknzB10CwVZibRwhWaRzm6rM8gw6TR6GYCj+X40/upIw\n5b2EAY4iE7+khuYl+LyjRTBDMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMBAf8ECDAG\nAQH/AgEBMB0GA1UdDgQWBBTZg1keePx2o6NkqwUruVyg/k4ptjAKBggqhkjOPQQD\nAgNHADBEAiB5rjBfFCHXS2mrnb9Yet+LzGdW/lD6GSVAqfTODD3/WgIgPFOeq4Xl\nNBswSIgO0EFFHZSBhzo8duAv8bv9em+uU2Q=\n-----END CERTIFICATE-----\n",
"ssl-target-name-override" : 'peer0.org1.example.com',
requestTimeout: 3000
});
discoverer.setEndpoint(endpoint);






// =====================================await discoverer.connect()========================================================

const discovery = new DiscoveryService("token_erc20", channel);
// const endorsement1 = channel.newEndorsement("token_erc20");
// discovery.build(idx, {endorsement: endorsement1});
discovery.build(idx);
discovery.sign(idx);

const discovery_results = await discovery.send({targets: [discoverer], asLocalhost: true});
console.log(JSON.stringify(discovery_results))

 




// ================================================Creating Proposal================================================

const endorsement = channel.newEndorsement("token_erc20");
const build_options = {fcn: 'Mint', args: ['300']};
const proposalBytes = endorsement.build(idx, build_options);







//========================================= Calculate Hash for transaction Proposal Bytes==================================

const hash = crypto.createHash('sha256').update(proposalBytes).digest('hex');







// ===============================================Creating Signature=============================================================

const sig = ecdsa.sign(Buffer.from(hash, 'hex'), signKey, { canonical: true });
const signature = Buffer.from(sig.toDER());
console.log('signature:', signature)






// =========================================================Endorserer Objects========================================================

const peer0Org1Endorser = new Endorser("peer0Org1", client, "Org1MSP");
const peer0Org1Endpoint = client.newEndpoint({
url: 'grpcs://localhost:7051',
pem : "-----BEGIN CERTIFICATE-----\nMIICJjCCAc2gAwIBAgIUUXrOrnPZSANZFgk3z4kbYQEG8fMwCgYIKoZIzj0EAwIw\ncDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQH\nEwZEdXJoYW0xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMjMwMzIxMDY1OTAwWhcNMzgwMzE3MDY1OTAw\nWjBwMQswCQYDVQQGEwJVUzEXMBUGA1UECBMOTm9ydGggQ2Fyb2xpbmExDzANBgNV\nBAcTBkR1cmhhbTEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMT\nY2Eub3JnMS5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABG8G\nEvaw8lIqlJTnc65xxnSHBknzB10CwVZibRwhWaRzm6rM8gw6TR6GYCj+X40/upIw\n5b2EAY4iE7+khuYl+LyjRTBDMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMBAf8ECDAG\nAQH/AgEBMB0GA1UdDgQWBBTZg1keePx2o6NkqwUruVyg/k4ptjAKBggqhkjOPQQD\nAgNHADBEAiB5rjBfFCHXS2mrnb9Yet+LzGdW/lD6GSVAqfTODD3/WgIgPFOeq4Xl\nNBswSIgO0EFFHZSBhzo8duAv8bv9em+uU2Q=\n-----END CERTIFICATE-----\n",
requestTimeout: 30000
});
peer0Org1Endorser.setEndpoint(peer0Org1Endpoint);
await peer0Org1Endorser.connect();
console.log("peer0Org1Endorser status: ", await peer0Org1Endorser.checkConnection())
const peer0Org2Endorser = new Endorser("peer0Org2", client, "Org2MSP");
const peer0Org2Endpoint = client.newEndpoint({
url: 'grpcs://localhost:9051',
pem: "-----BEGIN CERTIFICATE-----\nMIICHzCCAcWgAwIBAgIURrCX8ngrBcXw90u3VYD8nMKgjscwCgYIKoZIzj0EAwIw\nbDELMAkGA1UEBhMCVUsxEjAQBgNVBAgTCUhhbXBzaGlyZTEQMA4GA1UEBxMHSHVy\nc2xleTEZMBcGA1UEChMQb3JnMi5leGFtcGxlLmNvbTEcMBoGA1UEAxMTY2Eub3Jn\nMi5leGFtcGxlLmNvbTAeFw0yMzAzMjEwNjU5MDBaFw0zODAzMTcwNjU5MDBaMGwx\nCzAJBgNVBAYTAlVLMRIwEAYDVQQIEwlIYW1wc2hpcmUxEDAOBgNVBAcTB0h1cnNs\nZXkxGTAXBgNVBAoTEG9yZzIuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2NhLm9yZzIu\nZXhhbXBsZS5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARQqhUfINV/POpG\ncC4STVlhgRJMk5zZGbSHtkK5DLdBBK9kyU1hDY/eS6XEyTSCQ//sAJ9KC6OW3lL7\n1Zq+HFMPo0UwQzAOBgNVHQ8BAf8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBATAd\nBgNVHQ4EFgQUDxdn5ZYcdQRrBuL/+qhPtXoE1AIwCgYIKoZIzj0EAwIDSAAwRQIh\nALchB5qhPxVWHH/dO1hi0BxNiqF+XTvwfqryOAMsYqOMAiBhg34f4+PjwQabPvSU\no+kxRX4itwSCZFmC59vVC1jnFg==\n-----END CERTIFICATE-----\n",
"ssl-target-name-override" : 'peer0.org2.example.com',
requestTimeout: 3000
});
peer0Org2Endorser.setEndpoint(peer0Org2Endpoint);
await peer0Org2Endorser.connect();
console.log("peer0Org2Endorser status: ", await peer0Org2Endorser.checkConnection())





// ==================================================Final - Sending Proposal Request=============================================

endorsement.sign(signature);
const proposalResponses = await endorsement.send({targets : [peer0Org1Endorser, peer0Org2Endorser]});
console.log(proposalResponses.responses);





// ==================================================Committer Objects==================================================

const newCommitter = new Committer("orderer.example.com", client, "OrdererMSP");
const newCommitterEndpoint = client.newEndpoint({
url: 'grpcs://localhost:7050',

pem : '-----BEGIN CERTIFICATE-----\n' +
'MIICCjCCAbGgAwIBAgIURhrJFCMrNLbXKqxLnOoC9PABfeQwCgYIKoZIzj0EAwIw\n' +
'YjELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcg\n' +
'WW9yazEUMBIGA1UEChMLZXhhbXBsZS5jb20xFzAVBgNVBAMTDmNhLmV4YW1wbGUu\n' +
'Y29tMB4XDTIzMDMyMTA2NTkwMFoXDTM4MDMxNzA2NTkwMFowYjELMAkGA1UEBhMC\n' +
'VVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcgWW9yazEUMBIGA1UE\n' +
'ChMLZXhhbXBsZS5jb20xFzAVBgNVBAMTDmNhLmV4YW1wbGUuY29tMFkwEwYHKoZI\n' +
'zj0CAQYIKoZIzj0DAQcDQgAEXZjicWHbYo8aSEEB3LyzUx95jI1qnJuKPforMrSK\n' +
'P4NL7pSSR/fTLZI1pMUkrEhZqHRY3iP36QUOoyJxNn0+Q6NFMEMwDgYDVR0PAQH/\n' +
'BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYEFJ2hryD3Qg4B+1ee\n' +
'dfIITI2KKg2LMAoGCCqGSM49BAMCA0cAMEQCIBTeG+NzXaa6IiRWPdiCqCu5rJgk\n' +
'38PqKpcF6+IjDPQMAiADX5bxrs9WxrhWfghGTw196+phuhSrpAqz+JJc8Chp/Q==\n' +
'-----END CERTIFICATE-----\n',

'ssl-target-name-override': 'orderer.example.com',
requestTimeout: 3000
});


newCommitter.setEndpoint(newCommitterEndpoint);
await newCommitter.connect();
console.log("Committer Connection Status: ", await newCommitter.checkConnection())







// ================================================Commit the Transaction=====================================================
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


