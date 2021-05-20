pragma solidity ^0.5.16;

import "./Ownable.sol";

contract CreditOracle is Ownable {
    mapping(address => uint) private creditCollateralRatio;

    function updateCreditCollateralRatio(address account, uint creditScore) public onlyOwner {
        require(account != address(0), "CreditOracle: set credit score to zero address");
        // Todo: calculate credit collateral ratio based on credit score
        creditCollateralRatio[account] = creditScore;
    }

    function getCreditCollateralRatio(address account) public view returns (uint) {
        return creditCollateralRatio[account];
    }
}