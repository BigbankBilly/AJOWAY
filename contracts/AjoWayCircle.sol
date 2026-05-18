// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract AjoWayCircle {
    error OnlyOrganizer();
    error NotMember();
    error AlreadyContributed();
    error RoundNotComplete();
    error CircleClosed();
    error InvalidSetup();
    error TransferFailed();

    event ContributionReceived(uint256 indexed round, address indexed member, uint256 amount);
    event RoundPaid(uint256 indexed round, address indexed recipient, uint256 amount);
    event CircleClosedByOrganizer(address indexed organizer);

    IERC20 public immutable usdc;
    address public immutable organizer;
    uint256 public immutable weeklyContribution;
    uint256 public immutable memberCount;
    uint256 public currentRound;
    bool public closed;

    address[] private members;
    mapping(address => bool) public isMember;
    mapping(uint256 => mapping(address => bool)) public hasContributed;
    mapping(uint256 => uint256) public roundContributionCount;

    modifier onlyOrganizer() {
        if (msg.sender != organizer) revert OnlyOrganizer();
        _;
    }

    modifier onlyMember() {
        if (!isMember[msg.sender]) revert NotMember();
        _;
    }

    constructor(address usdcAddress, address[] memory circleMembers, uint256 contributionAmount) {
        if (usdcAddress == address(0) || circleMembers.length < 2 || contributionAmount == 0) {
            revert InvalidSetup();
        }

        usdc = IERC20(usdcAddress);
        organizer = msg.sender;
        weeklyContribution = contributionAmount;
        memberCount = circleMembers.length;

        for (uint256 i = 0; i < circleMembers.length; i++) {
            address member = circleMembers[i];
            if (member == address(0) || isMember[member]) revert InvalidSetup();
            isMember[member] = true;
            members.push(member);
        }
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function currentRecipient() public view returns (address) {
        return members[currentRound % memberCount];
    }

    function roundPot() public view returns (uint256) {
        return weeklyContribution * memberCount;
    }

    function contribute() external onlyMember {
        if (closed) revert CircleClosed();
        if (hasContributed[currentRound][msg.sender]) revert AlreadyContributed();

        hasContributed[currentRound][msg.sender] = true;
        roundContributionCount[currentRound] += 1;

        bool ok = usdc.transferFrom(msg.sender, address(this), weeklyContribution);
        if (!ok) revert TransferFailed();

        emit ContributionReceived(currentRound, msg.sender, weeklyContribution);
    }

    function payCurrentRound() external onlyOrganizer {
        if (closed) revert CircleClosed();
        if (roundContributionCount[currentRound] != memberCount) revert RoundNotComplete();

        address recipient = currentRecipient();
        uint256 amount = roundPot();
        currentRound += 1;

        bool ok = usdc.transfer(recipient, amount);
        if (!ok) revert TransferFailed();

        emit RoundPaid(currentRound - 1, recipient, amount);
    }

    function closeCircle() external onlyOrganizer {
        closed = true;
        emit CircleClosedByOrganizer(msg.sender);
    }
}
