pragma solidity ^0.5.16;

import "./Ownable.sol";

contract CreditOracle is Ownable {
    mapping(address => uint) private creditCollateralRatio;
    uint[] public creditScoreScopes = [21, 60, 80, 95];
    mapping(uint => uint) creditValue;

    mapping(address => bool) creditAdmin;

    modifier onlyCreditAdmin {
        require(creditAdmin[msg.sender], "Credit Admin required");
        _;
    }

    event CreditAdminChanged(address creditAdmin, bool);
    event CreditValueDefinitionChanged(uint scopeFrom, uint scopeTo, uint creditValue);
    event CreditCollateralRatioChanged(address account, uint oldRatio, uint newRatio);

    constructor() public {
        creditAdmin[msg.sender] = true;

        emit CreditAdminChanged(msg.sender, true);
    }

    // creditScore is one number between 0 and 100
    function updateCreditCollateralRatio(address account, uint creditScore) public onlyCreditAdmin {
        require(account != address(0), "Set credit score to zero address");
        require(creditScore > 0 && creditScore <= 100, "Invalid credit score");

        uint oldAccountCreditRatio = creditCollateralRatio[account];
        uint accountCreditRatio = 0;
        for (uint i = 0; i < creditScoreScopes.length; i++) {
            if (creditScore >= creditScoreScopes[i]) {
                //accountCreditRatio = (creditScore * 1e18 / 1000) * creditValue[creditScoreScopes[i]] / 100;
                accountCreditRatio = creditScore * 1e13 * creditValue[creditScoreScopes[i]];
            }
        }
        creditCollateralRatio[account] = accountCreditRatio;

        emit CreditCollateralRatioChanged(account, oldAccountCreditRatio, accountCreditRatio);
    }

    function getCreditCollateralRatio(address account) public view returns (uint) {
        return creditCollateralRatio[account];
    }

    function setCreditValueDefinition(uint _scopeFrom, uint _scopeTo, uint _creditValue) public onlyOwner {
        require(_creditValue > 0 && _creditValue <= 100, "Zero credit value");
        require(_scopeFrom > 0 && _scopeTo < 100, "Invalid credit scope value");
        require(inScope(_scopeFrom), "Invalid credit scope value");

        creditValue[_scopeFrom] = _creditValue;
        emit CreditValueDefinitionChanged(_scopeFrom, _scopeTo, _creditValue);
    }

    function setCreditValueDefinitions(uint[] calldata _scopeFrom, uint[] calldata _scopeTo, uint[] calldata _creditValue) external onlyOwner {
        require(_scopeFrom.length == _creditValue.length, "Inconsistent length");

        for (uint i = 0; i < _scopeFrom.length; i++) {
            setCreditValueDefinition(_scopeFrom[i], _scopeTo[i], _creditValue[i]);
        }
    }

    function setCreditScoreScopes(uint[] calldata _creditScoreScopes) external onlyOwner {
        creditScoreScopes = _creditScoreScopes;
    }

    function inScope(uint scopeFrom) internal returns (bool) {
        for (uint i = 0; i < creditScoreScopes.length; i++) {
            if (scopeFrom == creditScoreScopes[i]) {
                return true;
            }
        }
        return false;
    }

    function addCreditAdmin(address newCreditAdmin) public onlyOwner {
        creditAdmin[newCreditAdmin] = true;

        emit CreditAdminChanged(newCreditAdmin, true);
    }

     function removeCreditAdmin(address oldCreditAdmin) public onlyOwner {
        creditAdmin[oldCreditAdmin] = false;

        emit CreditAdminChanged(oldCreditAdmin, false);
    }
}