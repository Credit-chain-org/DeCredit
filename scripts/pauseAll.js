const DCtroller = artifacts.require("DCtroller")
const Unitroller = artifacts.require("Unitroller")

const argv = require('yargs').argv

module.exports = async function(callback) {
    try {
        console.log(`argv> dToken=${argv.fToken}, paused=${argv.paused}`)

        let DCControllerInstance = await DCtroller.at(Unitroller.address)
        
        await DCControllerInstance._setMintPaused(argv.fToken, argv.paused)
        console.log("MintPaused: ", await DCControllerInstance.mintGuardianPaused(argv.fToken))

        await DCControllerInstance._setBorrowPaused(argv.fToken, argv.paused)
        console.log("BorrowPaused: ", await DCControllerInstance.borrowGuardianPaused(argv.fToken))
        
        await DCControllerInstance._setTransferPaused(argv.paused)
        console.log("TransferPaused: ", await DCControllerInstance.transferGuardianPaused())

        await DCControllerInstance._setSeizePaused(argv.paused)
        console.log("SeizePaused: ", await DCControllerInstance.seizeGuardianPaused())

        callback()
    } catch (e) {
        callback(e)
        console.log(e)
    }
}
