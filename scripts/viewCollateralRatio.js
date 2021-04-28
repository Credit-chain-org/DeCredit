const DCtroller = artifacts.require("DCtroller");
const Unitroller = artifacts.require("Unitroller");
const CToken = artifacts.require("CToken");

module.exports = async function(callback) {
    try {
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedDCtroller = await DCtroller.at(unitrollerInstance.address);
        let allSupportedMarkets = await proxiedDCtroller.getAllMarkets();
        let tokens = [];
        let compSpeeds = [];
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CToken.at(market);
            let cTokenName = await cTokenInstance.name();
            let compSpeed = await proxiedDCtroller.compSpeeds(market);
            let mintPaused = await proxiedDCtroller.mintGuardianPaused(market)
            //console.log(`${cTokenName} ${market} mintPaused: ${mintPaused}`);
            if (compSpeed <= 0) continue;
            let marketState = await proxiedDCtroller.markets(market);
            let collateralRatio = marketState['collateralFactorMantissa'].toString()
            console.log(`${cTokenName} ${market} collateralFactor: ${collateralRatio}`);
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}