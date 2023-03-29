const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const util = require('util')
const { BlockDecoder } = require('fabric-common');


const helper = require('./helper')
const qscc = async (channelName, chaincodeName, args, fcn, username, org_name) => {

    try {

        // load the network configuration
        // const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
        const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }
     
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true }
        });
    
// await gateway.connect(connectionProfile, {discovery: { enabled: true, asLocalhost: false}});
// const network = await gateway.getNetwork('mychannel');

        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);


        let result;
        let message;
        


        // console.log("======48======");



        // result = await contract.submitTransaction(fcn);


        // result = await contract.submitTransaction(fcn);





//  clientAccountBalance
        if (fcn === "ClientAccountBalance" || fcn === "ClientAccountBalance"
            || fcn == "ClientAccountBalance") {
            result = await contract.submitTransaction(fcn);
            message = ` clientAccountBalance is ${result}`

        } 

// client ID
        if (fcn === "ClientAccountID" || fcn === "ClientAccountID"
            || fcn == "ClientAccountID") {
            result = await contract.submitTransaction(fcn);
            message = `ClientAccountID is ${result}`

        } 


// blance of 

        if (fcn === "BalanceOf" || fcn === "BalanceOf"
            || fcn == "BalanceOf") {
            result = await contract.submitTransaction(fcn, args[0]);
            message = `Successfully BalanceOf money ${result,"Owner is",args[0]}`

        } 

//TotalSupply
        if (fcn === "TotalSupply" || fcn === "TotalSupply"
        || fcn == "TotalSupply") {
        result = await contract.submitTransaction(fcn, args[0]);
        message = `TotalSupply is ${result}`

        } 



//  TokenName(ctx)


            if (fcn === "TokenName" || fcn === "TokenName"
            || fcn == "TokenName") {
            result = await contract.submitTransaction(fcn);
            message = `TokenName is ${result}`

            } 


// Symbol(ctx)


            if (fcn === "Symbol" || fcn === "Symbol"
            || fcn == "Symbol") {
            result = await contract.submitTransaction(fcn);
            message = `Symbol is ${result}`

            } 



  //   Decimals(ctx) 



        if (fcn === "Decimals" || fcn === "Decimals"
        || fcn == "Decimals") {
        result = await contract.submitTransaction(fcn);
        message = `Decimals is ${result}`

        } 






































        // console.log("========49======");

       console.log( `${fcn}`, "is " ,result.toString())
    // res.send("hello")


    //    console.log("client TotalSupply is -> ",result.toString())




        //  res.send(result.toString());

// console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
// console.log("========62======");
        // result = JSON.toString();

        // result = JSON.parse(result.toString());

        // return result


        // await gateway.disconnect();

        // result = JSON.parse(result.toString());

        // let response = {
        //     message: message,
        //     result
        // }

        // return response;

    }
   
    catch (result) {

        console.log(`${fcn} : ${result}`)
        return result.message

    }

}
exports.qscc = qscc