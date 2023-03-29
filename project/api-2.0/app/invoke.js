// const { Gateway, Wallets, TxEventHandler, GatewayOptions, DefaultEventHandlerStrategies, TxEventHandlerFactory } = require('fabric-network');
// const fs = require('fs');
// const path = require("path")
// const log4js = require('log4js');
// const logger = log4js.getLogger('BasicNetwork');
// const util = require('util')

// const helper = require('./helper')

// const invokeTransaction = async (channelName, chaincodeName, fcn, args, username, org_name) => {
//     try {
//         logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

//         // load the network configuration
//         // const ccpPath =path.resolve(__dirname, '..', 'config', 'connection-org1.json');
//         // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
//         const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);

//         // Create a new file system based wallet for managing identities.
//         const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
//         const wallet = await Wallets.newFileSystemWallet(walletPath);
//         console.log(`Wallet path: ${walletPath}`);

//         // Check to see if we've already enrolled the user.
//         let identity = await wallet.get(username);
//         if (!identity) {
//             console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
//             await helper.getRegisteredUser(username, org_name, true)
//             identity = await wallet.get(username);
//             console.log('Run the registerUser.js application before retrying');
//             return;
//         }

        

//         const connectOptions = {
//             wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
//             eventHandlerOptions: {
//                 commitTimeout: 100,
//                 strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
//             }
//             // transaction: {
//             //     strategy: createTransactionEventhandler()
//             // }
//         }

//         // Create a new gateway for connecting to our peer node.
//         const gateway = new Gateway();
//         await gateway.connect(ccp, connectOptions);

//         // Get the network (channel) our contract is deployed to.
//         const network = await gateway.getNetwork(channelName);

//         const contract = network.getContract(chaincodeName);

//         let result


//         // console.log("======48======");


//         result = await contract.submitTransaction(fcn, args);

//         // result = await contract.submitTransaction(fcn);


//         // console.log("========49======");

//        console.log("client blance is -> ",result.toString())
       
//        console.log("client totalSupply is -> ",result.toString())

//          res.send(result.toString());



// // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
// // console.log("========62======");
//         // result = JSON.toString();

//         result = JSON.parse(result.toString());

//         return result
//     } catch (error) {
//         console.error(`Failed to evaluate transaction: ${error}`);
//         return error.message

//     }
// }

// exports.invokeTransaction = invokeTransaction;


const { Gateway, Wallets, TxEventHandler, GatewayOptions, DefaultEventHandlerStrategies, TxEventHandlerFactory } = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const util = require('util')

const helper = require('./helper');
const { Agent } = require('http');

const invokeTransaction = async (channelName, chaincodeName, fcn, args, username, org_name) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        // load the network configuration
        // const ccpPath =path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
        const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
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

        

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
            // transaction: {
            //     strategy: createTransactionEventhandler()
            // }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

// Minting
        if (fcn === "Mint" || fcn === "Mint"
            || fcn == "Mint") {
            result = await contract.submitTransaction(fcn, args[0]);
            message = `Successfully minting money ${args[0]}`

        } 

// burning 
 if (fcn === "Burn" || fcn === "Burn"
            || fcn == "Burn") {
            result = await contract.submitTransaction(fcn, args[0]);
            message = `Successfully Burn money ${args[0]}`

        } 

// transfer money    Transfer(ctx, to, value)

 if (fcn === "Transfer" || fcn === "Transfer"
            || fcn == "Transfer") {
            result = await contract.submitTransaction(fcn, args[0],args[1]);
            message = `Successfully Transfer money ${args[0],args[1]}`

        } 

 //   Approve(ctx, spender, value) 

            if (fcn === "Approve" || fcn === "Approve"
                    || fcn == "Approve") {
            result = await contract.submitTransaction(fcn, args[0],args[1]);
            message = `Successfully Approve money ${args[0],args[1]}`

            } 





// TransferFrom(ctx, from, to, value) 

            if (fcn === "TransferFrom" || fcn === "TransferFrom"
                   || fcn == "TransferFrom") {
            result = await contract.submitTransaction(fcn, args[0],args[1],args[2]);
            message = `Successfully TransferFrom ${args[2]}`

            }


            
// Allowance(ctx, owner, spender) 


        if (fcn === "Allowance" || fcn === "Allowance"
                   || fcn == "Allowance") {
        result = await contract.submitTransaction(fcn, args[0],args[1]);
        message = `Successfully Allowance money ${args[0],args[1]}`

        } 


       await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}



exports.invokeTransaction = invokeTransaction;