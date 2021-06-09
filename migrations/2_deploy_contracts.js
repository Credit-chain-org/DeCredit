const SimplePriceOracle = artifacts.require("DCSimplePriceOracle");
const InterestModel = artifacts.require("BSCJumpInterestModel");
const DCtroller = artifacts.require("DCtroller");
const cEther = artifacts.require("CEther");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const CompoundLens = artifacts.require("CompoundLens");
const ChainLinkPriceOracle = artifacts.require("ChainlinkAdaptor");
const DCConfig = artifacts.require("DCConfig");
const Maximillion = artifacts.require("Maximillion");
const CreditOracle = artifacts.require("CreditOracle");

// Mock Tokens
const TetherToken = artifacts.require("TetherToken");
const HFILToken = artifacts.require("HFILToken");

// Parameters
const closeFactor = 0.5e18.toString();
const liquidationIncentive = 1.1e18.toString();
const reserveFactor = 0.3e18.toString();

let addressFactory = {};
module.exports = async function(deployer, network) {
    await deployer.deploy(Unitroller);
    await deployer.deploy(DCtroller);
    await deployer.deploy(CompoundLens);
    await deployer.deploy(DCConfig, "0x0000000000000000000000000000000000000000");
    await deployer.deploy(CreditOracle);

    addressFactory["DCtroller"] = Unitroller.address;
    addressFactory["DCConfig"] = DCConfig.address;
    addressFactory["CompoundLens"] = CompoundLens.address;
    addressFactory["CreditOracle"] = CreditOracle.address;

    let unitrollerInstance = await Unitroller.deployed();
    let DCtrollerInstance = await DCtroller.deployed();
    let admin = await DCtrollerInstance.admin();
    console.log("admin: ", admin);

    await unitrollerInstance._setPendingImplementation(DCtroller.address);
    await DCtrollerInstance._become(Unitroller.address);

    await deployer.deploy(InterestModel, 0.02e18.toString(), 0.2e18.toString(), 0.95e18.toString(), 0.05e18.toString());

    let proxiedDCtroller = await DCtroller.at(Unitroller.address);

    await proxiedDCtroller._setDCConfig(DCConfig.address);
    console.log("Done to set config.", await  proxiedDCtroller.dcConfig());

    await proxiedDCtroller._setLiquidationIncentive(liquidationIncentive);
    console.log("Done to set liquidation incentive.");
    let incentive = await proxiedDCtroller.liquidationIncentiveMantissa();
    console.log("New incentive: ", incentive.toString());

    await proxiedDCtroller._setCloseFactor(closeFactor);
    result = await proxiedDCtroller.closeFactorMantissa();
    console.log("Done to set close factor with value: ", result.toString());

    if (network == "development") {
        let compImpl = await unitrollerInstance.comptrollerImplementation();
        console.log("compImpl: " + compImpl);

        await deployer.deploy(SimplePriceOracle);


        // Handle Mocked USDT
        await deployer.deploy(TetherToken, "1000000000000000", "Tether USD", "USDT", 6);
        await deployer.deploy(erc20Delegate);
        await deployer.deploy(erc20Delegator, TetherToken.address, Unitroller.address, InterestModel.address, 0.02e6.toString(), "QuickSilver USDT", "sUSDT", 18, admin, erc20Delegate.address, "0x0");
        const sUSDTInstance = await erc20Delegator.deployed();
        await sUSDTInstance._setReserveFactor(reserveFactor);
        await proxiedDCtroller._supportMarket(erc20Delegator.address)
        let usdtCollateralFactor = 0.8e18.toString();
        await proxiedDCtroller._setCollateralFactor(erc20Delegator.address, usdtCollateralFactor);
        console.log("Done to set collateral factor %s for %s", usdtCollateralFactor, erc20Delegator.address);
        addressFactory["USDT"] = TetherToken.address;
        addressFactory["dUSDT"] = erc20Delegator.address;

        // Handle Mocked HFIL
        await deployer.deploy(HFILToken);
        await deployer.deploy(erc20Delegate);
        await deployer.deploy(erc20Delegator, HFILToken.address, Unitroller.address, InterestModel.address, 0.02e18.toString(), "OceanBank HFIL", "oHFIL", 18, admin, erc20Delegate.address, "0x0");

        // const sHFIL = erc20Delegator;
        const sHFILInstance = await erc20Delegator.deployed();
        await sHFILInstance._setReserveFactor(reserveFactor);

        await proxiedDCtroller._supportMarket(erc20Delegator.address);
        let hfilCollateralFactor = 0.5e18.toString();
        await proxiedDCtroller._setCollateralFactor(erc20Delegator.address, hfilCollateralFactor);
        let hfilCollateralFactorAfter = await proxiedDCtroller.markets(erc20Delegator.address);
        console.log("Done to set collateral factor %s for HFIL %s", hfilCollateralFactorAfter.collateralFactorMantissa, erc20Delegator.address);
        addressFactory["HFIL"] = HFILToken.address;
        addressFactory["dHFIL"] = erc20Delegator.address;

        let allSupportedMarkets = await proxiedDCtroller.getAllMarkets();
        console.log(allSupportedMarkets);

        await proxiedDCtroller._setPriceOracle(SimplePriceOracle.address);
        console.log("Done to update price oracle.");
    }

    if (network == "bsctest" || network == "bsc") {
        let bnbPriceSource = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";
        if (network == "bsc") {
            bnbPriceSource = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";
        }
        await deployer.deploy(ChainLinkPriceOracle, bnbPriceSource);
        await proxiedDCtroller._setPriceOracle(ChainLinkPriceOracle.address);
        console.log("Done to set price oracle.", await proxiedDCtroller.oracle());    
        await deployer.deploy(cEther, Unitroller.address, InterestModel.address, 0.02e18.toString(), "DeCredit HT", "dBNB", 18, admin);
        await proxiedDCtroller._supportMarket(cEther.address);
        console.log("Done to support market dBNB: ", cEther.address);
        let htCollateralFactor = 0.15e18.toString();
        await proxiedDCtroller._setCollateralFactor(cEther.address, htCollateralFactor);
        console.log("Done to set collateral factor %s for dBNB %s", htCollateralFactor, cEther.address);
        addressFactory["dBNB"] = cEther.address;
        await deployer.deploy(Maximillion, cEther.address);
        addressFactory["Maximillion"] = Maximillion.address;
        addressFactory["ChainLinkPriceOracle"] = ChainLinkPriceOracle.address;
    }
    console.log("================= Copy and record below addresses ==============")
    console.log(addressFactory);
};
