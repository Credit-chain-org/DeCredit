const Qstroller = artifacts.require("DCtroller");
const Unitroller = artifacts.require("Unitroller");

const allTokens = [
    '0x2345C50D25c62514219D39C53234FEe24807a839'
]

const allCompSpeeds = [
    '1000000000000000000'
]

module.exports = async function(callback) {
    try {
        let sum = BigInt(0)
        for (let i = 0; i < allTokens.length; i++) {
            console.log(`${allTokens[i]} => ${allCompSpeeds[i]}`)
            sum += BigInt(allCompSpeeds[i])
        }
        console.log(`CompRate: ${sum}`)
        //let unitrollerInstance = await Unitroller.deployed();
        //let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        let proxiedQstroller = await Qstroller.at("0xaEAaC914DB01d729a890C876E3CB40F488D1057e");
        await proxiedQstroller._setCompSpeeds(allTokens, allCompSpeeds);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}