const PriceOracle = artifacts.require("DCPriceOracle")
const DCtroller = artifacts.require("DCtroller");
const Unitroller = artifacts.require("Unitroller");
const CToken = artifacts.require("CToken");

module.exports = async function(callback) {
    try {
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedDCtroller = await DCtroller.at(unitrollerInstance.address);
        let priceOracleAddress = await proxiedDCtroller.oracle();
        let priceInstance = await PriceOracle.at(priceOracleAddress);
        let allSupportedMarkets = await proxiedDCtroller.getAllMarkets();
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CToken.at(market);
            let cTokenName = await cTokenInstance.name();
            let price = await priceInstance.getUnderlyingPrice(market)
            console.log(`${cTokenName} ${market} price: ${price}`)
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}