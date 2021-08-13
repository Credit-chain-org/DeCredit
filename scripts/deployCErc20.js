const DCtroller = artifacts.require("DCtroller");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const erc20Token = artifacts.require("EIP20Interface");
const JumpInterestModel = artifacts.require("BSCJumpInterestModel");

const argv = require('yargs').option('token', {string:true}).argv;

let assets = {}
assets["USDT"] = {
                    "address": "0x55d398326f99059ff775485246999027b3197955",
                    "baseRatePerYear": 0.02e18.toString(),
                    "multiplierPerYear": 0.3e18.toString(),
                    "jumpMultiplierPerYear": 2.5e18.toString(),
                    "kink": 0.9e18.toString(),
                    "reserveFactor": 0.1e18.toString(),
                    "collateralFactor": 0.75e18.toString()
}
assets["ETH"] = {
    "address": "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
    "baseRatePerYear": 0.02e18.toString(),
    "multiplierPerYear": 0.35e18.toString(),
    "jumpMultiplierPerYear": 4e18.toString(),
    "kink": 0.95e18.toString(),
    "reserveFactor": 0.1e18.toString(),
    "collateralFactor": 0.65e18.toString()
}
assets["BTC"] = {
    "address": "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
    "baseRatePerYear": 0.02e18.toString(),
    "multiplierPerYear": 0.3e18.toString(),
    "jumpMultiplierPerYear": 4e18.toString(),
    "kink": 0.9e18.toString(),
    "reserveFactor": 0.1e18.toString(),
    "collateralFactor": 0.65e18.toString()
}
assets["BUSD"] = {
    "address": "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    "baseRatePerYear": 0.02e18.toString(),
    "multiplierPerYear": 0.3e18.toString(),
    "jumpMultiplierPerYear": 2.5e18.toString(),
    "kink": 0.9e18.toString(),
    "reserveFactor": 0.1e18.toString(),
    "collateralFactor": 0.75e18.toString()
}
assets["UNI"] = {
    "address": "0xbf5140a22578168fd562dccf235e5d43a02ce9b1",
    "baseRatePerYear": 0.02e18.toString(),
    "multiplierPerYear": 0.45e18.toString(),
    "jumpMultiplierPerYear": 2e18.toString(),
    "kink": 0.85e18.toString(),
    "reserveFactor": 0.1e18.toString(),
    "collateralFactor": 0.2e18.toString()
}
assets["CAKE"] = {
    "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
    "baseRatePerYear": 0.02e18.toString(),
    "multiplierPerYear": 0.45e18.toString(),
    "jumpMultiplierPerYear": 2e18.toString(),
    "kink": 0.85e18.toString(),
    "reserveFactor": 0.1e18.toString(),
    "collateralFactor": 0.2e18.toString()
}
assets["DOGE"] = {
    "address": "0xba2ae424d960c26247dd6c32edc70b295c744c43",
    "baseRatePerYear": 0.02e18.toString(),
    "multiplierPerYear": 0.45e18.toString(),
    "jumpMultiplierPerYear": 1.5e18.toString(),
    "kink": 0.85e18.toString(),
    "reserveFactor": 0.1e18.toString(),
    "collateralFactor": 0.2e18.toString()
}
assets["DAI"] = {
    "address": "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
    "baseRatePerYear": 0.02e18.toString(),
    "multiplierPerYear": 0.3e18.toString(),
    "jumpMultiplierPerYear": 2.5e18.toString(),
    "kink": 0.9e18.toString(),
    "reserveFactor": 0.1e18.toString(),
    "collateralFactor": 0.75e18.toString()
}
assets["LINK"] = {
    "address": "0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd",
    "baseRatePerYear": 0.02e18.toString(),
    "multiplierPerYear": 0.45e18.toString(),
    "jumpMultiplierPerYear": 1.5e18.toString(),
    "kink": 0.85e18.toString(),
    "reserveFactor": 0.1e18.toString(),
    "collateralFactor": 0.2e18.toString()
}

module.exports = async function(callback) {
    try {
        console.log(`argv> token=${argv.token}`);
        underlyingTokenAddr = assets[argv.token].address
        collateralFactor = assets[argv.token].collateralFactor

        let erc20 = await erc20Token.at(underlyingTokenAddr);
        let decimals = await erc20.decimals();
        let symbol = await erc20.symbol();
        let dTokenName = "DeCredit " + symbol;
        let dTokenSymbol = "d" + symbol.charAt(0).toUpperCase() + symbol.slice(1)
        let initialExchange = 0.02 * 10 ** decimals;
        console.log(`TokenDecimals: ${decimals}`)
        console.log(`TokenSymbol: ${symbol}`);
        console.log(`dTokenName: ${dTokenName}`)
        console.log(`dTokenSymbol: ${dTokenSymbol}`)

        let baseRatePerYear = assets[argv.token].baseRatePerYear
        let multiplierPerYear = assets[argv.token].multiplierPerYear
        let jumpMultiplierPerYear = assets[argv.token].jumpMultiplierPerYear
        let kink = assets[argv.token].kink
        let reserveFactor = assets[argv.token].reserveFactor

        let newInterestModel = await JumpInterestModel.new(baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        let interestModelAddress = newInterestModel.address
        let DCControllerInstance = await DCtroller.at(Unitroller.address);
        let admin = await DCControllerInstance.admin();
        let newErc20Delegate = await erc20Delegate.new();
        console.log("underlyingTokenAddr: ", underlyingTokenAddr, "Unitroller.address: ", Unitroller.address, "interestModelAddress: ", interestModelAddress, "initialExchange: ", initialExchange.toString(), "newErc20Delegate: ", newErc20Delegate.address)
        let dTokenInstance = await erc20Delegator.new(underlyingTokenAddr, Unitroller.address, interestModelAddress, initialExchange.toString(), dTokenName, dTokenSymbol, 18, admin, newErc20Delegate.address, "0x0");
        await dTokenInstance._setReserveFactor(reserveFactor);
        await dTokenInstance._setInterestRateModel(newInterestModel.address);

        await DCControllerInstance._supportMarket(dTokenInstance.address);
        console.log(`Done to support market ${dTokenSymbol}: ${dTokenInstance.address}`);

        await DCControllerInstance._setCollateralFactor(dTokenInstance.address, collateralFactor);
        console.log("Done to set collateral factor %s for %s %s", collateralFactor, dTokenSymbol, dTokenInstance.address);

        await DCControllerInstance._setMintPaused(dTokenInstance.address, true)
        console.log("MintPaused: ", await DCControllerInstance.mintGuardianPaused(dTokenInstance.address))
        callback();
    } catch (e) {
        callback(e);
    }
}
