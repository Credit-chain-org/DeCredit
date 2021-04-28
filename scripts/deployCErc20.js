const DCtroller = artifacts.require("DCtroller");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const erc20Token = artifacts.require("EIP20Interface");

const argv = require('yargs').option('token', {string:true}).argv;

let reserveFactor = 0.15e18.toString();
let underlyingTokenAddr = "0xd3f1be7f74d25f39184d2d0670966e2e837562e3";
let collateralFactor = 0.05e18.toString();
let interestModelAddress = "0x0Ea2372497A4A73CC8A11766489E3EF84027835E";
module.exports = async function(callback) {
    try {
        console.log(`argv> token=${argv.token}, collateralFactor=${argv.collateralFactor}`);
        underlyingTokenAddr = argv.token
        collateralFactor = argv.collateralFactor

        let erc20 = await erc20Token.at(underlyingTokenAddr);
        let decimals = await erc20.decimals();
        let symbol = await erc20.symbol();
        let fTokenName = "DeCredit " + symbol;
        let fTokenSymbol = "d" + symbol.charAt(0).toUpperCase() + symbol.slice(1)
        let initialExchange = 0.02 * 10 ** decimals;
        console.log(`TokenDecimals: ${decimals}`)
        console.log(`TokenSymbol: ${symbol}`);
        console.log(`dTokenName: ${fTokenName}`)
        console.log(`dTokenSymbol: ${fTokenSymbol}`)

        let DCControllerInstance = await DCtroller.at(Unitroller.address);
        let admin = await DCControllerInstance.admin();
        let newErc20Delegate = await erc20Delegate.new();
        let fTokenInstance = await erc20Delegator.new(underlyingTokenAddr, Unitroller.address, interestModelAddress, initialExchange.toString(), fTokenName, fTokenSymbol, 18, admin, newErc20Delegate.address, "0x0");
        await fTokenInstance._setReserveFactor(reserveFactor);

        await DCControllerInstance._supportMarket(fTokenInstance.address);
        console.log(`Done to support market ${fTokenSymbol}: ${fTokenInstance.address}`);

        await DCControllerInstance._setCollateralFactor(fTokenInstance.address, collateralFactor);
        console.log("Done to set collateral factor %s for %s %s", collateralFactor, fTokenSymbol, fTokenInstance.address);

        await DCControllerInstance._setMintPaused(fTokenInstance.address, true)
        console.log("MintPaused: ", await DCControllerInstance.mintGuardianPaused(fTokenInstance.address))
        callback();
    } catch (e) {
        callback(e);
    }
}
