pragma solidity ^0.5.16;

import "./compound/Comptroller.sol";
import "./compound/EIP20Interface.sol";
import "./DCConfig.sol";

contract DCtroller is Comptroller {
    DCConfig public DCConfig;

    function _setDCConfig(DCConfig _DCConfig) public {
        require(msg.sender == admin);

        DCConfig = _DCConfig;
    }

    /**
     * @notice Sets new governance token distribution speed
     * @dev Admin function to set new token distribution speed
     */
    function _setCompSpeeds(address[] memory _allMarkets, uint[] memory _compSpeeds) public {
        // Check caller is admin
        require(msg.sender == admin);
        
        require(_allMarkets.length == _compSpeeds.length);

        uint _compRate = 0;
        for (uint i = 0; i < _allMarkets.length; i++) {
            address cToken = _allMarkets[i];
            Market storage market = markets[cToken];
            if (market.isComped == false) {
                _addCompMarketInternal(cToken);
            }
            compSpeeds[cToken] = _compSpeeds[i];
            _compRate = add_(_compRate, _compSpeeds[i]);
        }
        _setCompRate(_compRate);
    }


    function refreshCompSpeeds() public {
        require(!DCConfig.compSpeedGuardianPaused());
        require(msg.sender == tx.origin);

        refreshCompSpeedsInternal();
    }

    function refreshCompSpeedsInternal() internal {
        if (DCConfig.compSpeedGuardianPaused()) {
            return;
        } else {
            super.refreshCompSpeedsInternal();
        }
    }

    function getCompAddress() public view returns (address) {
        return DCConfig.compToken();
    }
    
    function calculateSeizeTokenAllocation(uint _seizeTokenAmount) public view returns(uint liquidatorAmount, uint safetyVaultAmount) {
        return DCConfig.calculateSeizeTokenAllocation(_seizeTokenAmount, liquidationIncentiveMantissa);
    }
    
    function transferComp(address user, uint userAccrued, uint threshold) internal returns (uint) {
        address compAddress = getCompAddress();
        if (userAccrued >= threshold && userAccrued > 0 && compAddress != address(0x0)) {
            EIP20Interface comp = EIP20Interface(compAddress);
            uint compRemaining = comp.balanceOf(address(this));
            if (userAccrued <= compRemaining) {
                (uint userAmount, uint governanceAmount) = DCConfig.getCompAllocation(user, userAccrued);
                if (userAmount > 0) comp.transfer(user, userAmount);
                if (governanceAmount > 0) comp.transfer(DCConfig.safetyVault(), governanceAmount);
                return 0;
            }
        }
        return userAccrued;
    }

    /**
     * @notice Checks if the account should be allowed to mint tokens in the given market
     * @param cToken The market to verify the mint against
     * @param minter The account which would get the minted tokens
     * @param mintAmount The amount of underlying being supplied to the market in exchange for tokens
     * @return 0 if the mint is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol)
     */
    function mintAllowed(address cToken, address minter, uint mintAmount) external returns (uint) {
        require(!DCConfig.isBlocked(minter));
        // Pausing is a very serious situation - we revert to sound the alarms
        require(!mintGuardianPaused[cToken]);

        // Shh - currently unused
        minter;
        mintAmount;

        if (!markets[cToken].isListed) {
            return uint(Error.MARKET_NOT_LISTED);
        }

        // Keep the flywheel moving
        updateCompSupplyIndex(cToken);
        distributeSupplierComp(cToken, minter, false);
        return uint(Error.NO_ERROR);
    }
}