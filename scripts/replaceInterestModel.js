const DCtroller = artifacts.require("DCtroller");
const Unitroller = artifacts.require("Unitroller");
const InterestModel = artifacts.require("DefaultHecoInterestModel");
const CToken = artifacts.require("CToken");

module.exports = async function(callback) {
    try {
        let newInterestModel = await InterestModel.new("20000000000000000", "320000000000000000");
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedDCtroller = await DCtroller.at(unitrollerInstance.address);
        let allSupportedMarkets = await proxiedDCtroller.getAllMarkets();
        for (market of allSupportedMarkets) {
            let interestModelAddr = newInterestModel.address;
            let cTokenInstance = await CToken.at(market);
            let cTokenName = await cTokenInstance.name();
            let oldInterestModelAddr = await cTokenInstance.interestRateModel();
            await cTokenInstance._setInterestRateModel(interestModelAddr);
            let newInterestModelAddr = await cTokenInstance.interestRateModel();
            console.log(`oldInterestModel ${oldInterestModelAddr} is replaced with newInterestModel: ${newInterestModelAddr} for token ${cTokenName} : ${cTokenInstance.address}`);
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}