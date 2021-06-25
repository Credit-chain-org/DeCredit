const DCtroller = artifacts.require("DCtroller");
const Unitroller = artifacts.require("Unitroller");

module.exports = async function(callback) {
    try {
       let newControllerInstance = await DCtroller.new();
       let unitrollerInstance = await Unitroller.deployed();
       let impl = await unitrollerInstance.comptrollerImplementation();
       console.log(`unitrollerInstance: ${unitrollerInstance.address}`, );
       console.log(`old implementation: ${impl}`, );
       await unitrollerInstance._setPendingImplementation(newControllerInstance.address);
       await newControllerInstance._become(unitrollerInstance.address);
       impl = await unitrollerInstance.comptrollerImplementation();
       console.log(`new implementation: ${impl}`);
        let proxiedDCtroller = await DCtroller.at(unitrollerInstance.address);
        let allSupportedMarkets = await proxiedDCtroller.getAllMarkets();
        console.log(allSupportedMarkets);
       callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}