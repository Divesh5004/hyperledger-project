

// first, generate an unsigned transaction proposal with the identity's certificate

// =================================1st step ===========================================================================

const certPem='<"-----BEGIN CERTIFICATE-----\nMIICejCCAiCgAwIBAgIUE5i2+trCcB4WxXx6J9690zOR1BEwCgYIKoZIzj0EAwIw\nbDELMAkGA1UEBhMCVUsxEjAQBgNVBAgTCUhhbXBzaGlyZTEQMA4GA1UEBxMHSHVy\nc2xleTEZMBcGA1UEChMQb3JnMi5leGFtcGxlLmNvbTEcMBoGA1UEAxMTY2Eub3Jn\nMi5leGFtcGxlLmNvbTAeFw0yMzAzMTQxMDQxMDBaFw0yNDAzMTMxMzE5MDBaMEEx\nMDALBgNVBAsTBG9yZzIwDQYDVQQLEwZjbGllbnQwEgYDVQQLEwtkZXBhcnRtZW50\nMTENMAsGA1UEAxMEcmF2aTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABE/X32BH\ntjaq7/vTQyU+RB4KAKLqSKlLhczWWnOHRyOQ44hCtEwYWou31cz9w+UHdvva59RL\nHNACjK0fFj32pnCjgcowgccwDgYDVR0PAQH/BAQDAgeAMAwGA1UdEwEB/wQCMAAw\nHQYDVR0OBBYEFFFtXasjt1ZlF9J5eIBbG4NzDqbxMB8GA1UdIwQYMBaAFEwH62uf\nq5wY2K4ZabP5L3WYL1qDMGcGCCoDBAUGBwgBBFt7ImF0dHJzIjp7ImhmLkFmZmls\naWF0aW9uIjoib3JnMi5kZXBhcnRtZW50MSIsImhmLkVucm9sbG1lbnRJRCI6InJh\ndmkiLCJoZi5UeXBlIjoiY2xpZW50In19MAoGCCqGSM49BAMCA0gAMEUCIQCtGR0W\nNcD6aGukmNPtBKofaw71HRapHaA179IdFjvYrgIgcdp7ptUGKDUosQBk0azo/IgV\nFZRzNkVlSPMMS+6HV+M=\n-----END CERTIFICATE-----\n">';
const mspId = 'Org2MSP';// the msp Id for this org

const transactionProposal={
"fcn": "Mint",
"chaincodeName":"token_erc20",
"channelName": "mychannel",
"args": ["5000"]
};
const{proposal,txId}=channel.generateUnsignedProposal(transactionProposal,mspId,certPem);
// now we have the 'unsigned proposal' for this transaction

// ====================================2nd step===========================================================

// calculate the hash of the transaction proposal bytes

const proposalBytes = proposal.toBuffer(); // the proposal comes from step 1

const hashFunction = xxxx; // A hash function by the user's desire

const digest = hashFunction(proposalBytes); // calculate the hash of the proposal bytes

// =======================================3rd step===========================================================