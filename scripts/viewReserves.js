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
            let totalReserves = await cTokenInstance.totalReserves() / Math.pow(10, 18);
            let reserveFactorMantissa = await cTokenInstance.reserveFactorMantissa() / Math.pow(10, 18);
            if (totalReserves <= 0) continue;
            console.log(`${cTokenName} totalReserves: ${totalReserves}, reserveFactorMantissa: ${reserveFactorMantissa}`)
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}