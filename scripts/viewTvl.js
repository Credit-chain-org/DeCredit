const DCtroller = artifacts.require("DCtroller");
const Unitroller = artifacts.require("Unitroller");
const CToken = artifacts.require("CToken");

module.exports = async function(callback) {
    try {
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedDCtroller = await DCtroller.at(unitrollerInstance.address);
        let allSupportedMarkets = await proxiedDCtroller.getAllMarkets();
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CToken.at(market);
            let cTokenName = await cTokenInstance.name();
            let exchangeRate = await cTokenInstance.exchangeRateStored();
            let totalSupply = await cTokenInstance.totalSupply() * exchangeRate / Math.pow(10, 36);
            let totalBorrows = await cTokenInstance.totalBorrows() / Math.pow(10, 18);
            console.log(`${cTokenName} totalSupply: ${totalSupply}, totalBorrows: ${totalBorrows}`)
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}