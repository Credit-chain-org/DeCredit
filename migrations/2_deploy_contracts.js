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
const reserveFactor = 0.1e18.toString();

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
        let initialAssets = [];
        let initialPriceFeeds
        if (network == "bsc") {
            bnbPriceSource = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";
            initialAssets = ["0x55d398326f99059ff775485246999027b3197955","0x2170ed0880ac9a755fd29b2688956bd959f933f8","0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c","0xe9e7cea3dedca5984780bafc599bd69add087d56","0xbf5140a22578168fd562dccf235e5d43a02ce9b1","0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82","0xba2ae424d960c26247dd6c32edc70b295c744c43","0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3","0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd"];
            initialPriceFeeds = ["0xB97Ad0E74fa7d920791E90258A6E2085088b4320", "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e","0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf","0xcBb98864Ef56E9042e7d2efef76141f15731B82f","0xb57f259E7C24e56a1dA00F66b55A5640d9f9E7e4","0x81faeDDfeBc2F8Ac524327d70Cf913001732224C","0x963D5e7f285Cc84ed566C486c3c1bC911291be38","0xE4eE17114774713d2De0eC0f035d4F7665fc025D","0x1B329402Cb1825C6F30A0d92aB9E2862BE47333f"];
        }
        await deployer.deploy(ChainLinkPriceOracle, bnbPriceSource);
        await proxiedDCtroller._setPriceOracle(ChainLinkPriceOracle.address);
        console.log("Done to set price oracle.", await proxiedDCtroller.oracle());  
        let oracleInstance = await ChainLinkPriceOracle.deployed();
        console.log("Done to initialize price oracle");
        await oracleInstance.setAssetSources(initialAssets, initialPriceFeeds);
        await deployer.deploy(cEther, Unitroller.address, InterestModel.address, 0.02e18.toString(), "DeCredit BNB", "dBNB", 18, admin);
        await proxiedDCtroller._supportMarket(cEther.address);
        console.log("Done to support market dBNB: ", cEther.address);
        let bnbCollateralFactor = 0.65e18.toString();
        await proxiedDCtroller._setCollateralFactor(cEther.address, bnbCollateralFactor);
        console.log("Done to set collateral factor %s for dBNB %s", bnbCollateralFactor, cEther.address);
        addressFactory["dBNB"] = cEther.address;
        await deployer.deploy(Maximillion, cEther.address);
        addressFactory["Maximillion"] = Maximillion.address;
        addressFactory["ChainLinkPriceOracle"] = ChainLinkPriceOracle.address;
    }
    console.log("================= Copy and record below addresses ==============")
    console.log(addressFactory);
};
