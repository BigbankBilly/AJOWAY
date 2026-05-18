// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/AjoWayCircle.sol";

contract DeployAjoWay is Script {
    address private constant ARC_TESTNET_USDC = 0x3600000000000000000000000000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 weeklyContribution = vm.envUint("WEEKLY_CONTRIBUTION");
        address[] memory members = vm.envAddress("MEMBERS", ",");

        vm.startBroadcast(deployerPrivateKey);
        new AjoWayCircle(ARC_TESTNET_USDC, members, weeklyContribution);
        vm.stopBroadcast();
    }
}
