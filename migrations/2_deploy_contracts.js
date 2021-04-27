const SimplePriceOracle = artifacts.require("QsSimplePriceOracle");
const InterestModel = artifacts.require("WhitePaperInterestRateModel");
const Qstroller = artifacts.require("Qstroller");
const cEther = artifacts.require("CEther");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const CompoundLens = artifacts.require("CompoundLens");
const QsPriceOracle = artifacts.require("QsPriceOracle");
const QsConfig = artifacts.require("QsConfig");
const Maximillion = artifacts.require("Maximillion");

// Mock Tokens
const TetherToken = artifacts.require("TetherToken");
const HFILToken = artifacts.require("HFILToken");

// Parameters
const closeFactor = 0.5e18.toString();
const liquidationIncentive = 1.1e18.toString();
const reserveFactor = 0.3e18.toString();

const maxAssets = 10;

let addressFactory = {};
module.exports = async function(deployer, network) {
    await deployer.deploy(Unitroller);
    await deployer.deploy(Qstroller);
    await deployer.deploy(CompoundLens);
    await deployer.deploy(QsPriceOracle);
    await deployer.deploy(QsConfig, "0x0000000000000000000000000000000000000000");

    addressFactory["Qstroller"] = Unitroller.address;
    addressFactory["QsPriceOracle"] = QsPriceOracle.address;
    addressFactory["QsConfig"] = QsConfig.address;
    addressFactory["CompoundLens"] = CompoundLens.address;

    let unitrollerInstance = await Unitroller.deployed();
    let qstrollerInstance = await Qstroller.deployed();
    let admin = await qstrollerInstance.admin();
    console.log("admin: ", admin);

    await unitrollerInstance._setPendingImplementation(Qstroller.address);
    await qstrollerInstance._become(Unitroller.address);

    await deployer.deploy(InterestModel, "20000000000000000", "200000000000000000");

    let proxiedQstroller = await Qstroller.at(Unitroller.address);

    await proxiedQstroller._setPriceOracle(QsPriceOracle.address);
    console.log("Done to set price oracle.", await proxiedQstroller.oracle());

    await proxiedQstroller._setQsConfig(QsConfig.address);
    console.log("Done to set config.", await  proxiedQstroller.qsConfig());

    await proxiedQstroller._setMaxAssets(maxAssets);
    let result = await proxiedQstroller.maxAssets();
    console.log("Done to set max assets.", result.toString());

    await proxiedQstroller._setLiquidationIncentive(liquidationIncentive);
    console.log("Done to set liquidation incentive.");
    let incentive = await proxiedQstroller.liquidationIncentiveMantissa();
    console.log("New incentive: ", incentive.toString());

    await proxiedQstroller._setCloseFactor(closeFactor);
    result = await proxiedQstroller.closeFactorMantissa();
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
        await proxiedQstroller._supportMarket(erc20Delegator.address)
        let usdtCollateralFactor = 0.8e18.toString();
        await proxiedQstroller._setCollateralFactor(erc20Delegator.address, usdtCollateralFactor);
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

        await proxiedQstroller._supportMarket(erc20Delegator.address);
        let hfilCollateralFactor = 0.5e18.toString();
        await proxiedQstroller._setCollateralFactor(erc20Delegator.address, hfilCollateralFactor);
        let hfilCollateralFactorAfter = await proxiedQstroller.markets(erc20Delegator.address);
        console.log("Done to set collateral factor %s for HFIL %s", hfilCollateralFactorAfter.collateralFactorMantissa, erc20Delegator.address);
        addressFactory["HFIL"] = HFILToken.address;
        addressFactory["dHFIL"] = erc20Delegator.address;

        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        console.log(allSupportedMarkets);

        await proxiedQstroller._setPriceOracle(SimplePriceOracle.address);
        console.log("Done to update price oracle.");
    }

    if (network == "hecotest" || network == "heco") {
        await deployer.deploy(cEther, Unitroller.address, InterestModel.address, 0.02e18.toString(), "DeCredit HT", "dHT", 18, admin);
        await proxiedQstroller._supportMarket(cEther.address);
        console.log("Done to support market dHT: ", cEther.address);
        let htCollateralFactor = 0.15e18.toString();
        await proxiedQstroller._setCollateralFactor(cEther.address, htCollateralFactor);
        console.log("Done to set collateral factor %s for dHT %s", htCollateralFactor, cEther.address);
        addressFactory["dHT"] = cEther.address;
        await deployer.deploy(Maximillion, cEther.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }
    console.log("================= Copy and record below addresses ==============")
    console.log(addressFactory);
};
