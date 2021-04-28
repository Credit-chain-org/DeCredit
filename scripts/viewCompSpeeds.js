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
            if (compSpeed <= 0) continue;
            tokens.push(market);
            compSpeeds.push(compSpeed.toString());
            console.log(`${cTokenName} ${market} compSpeed: ${compSpeed}`);
        }
        console.log(tokens);
        console.log(compSpeeds);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}