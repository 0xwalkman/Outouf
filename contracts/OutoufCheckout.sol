// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

/// @notice Arc USDC checkout escrow for off-chain fulfilled orders.
/// @dev Testnet foundation only. Obtain an independent audit before production deployment.
contract OutoufCheckout {
    enum Status { Paid, Validated, Refunded }

    struct Order {
        address buyer;
        address affiliate;
        uint128 amount;
        uint128 affiliateReward;
        Status status;
    }

    IERC20 public immutable usdc;
    address public owner;
    uint256 public nextOrderId;
    mapping(uint256 => Order) public orders;

    event OrderPaid(uint256 indexed orderId, address indexed buyer, address indexed affiliate, uint256 amount, uint256 affiliateReward);
    event OrderValidated(uint256 indexed orderId, address indexed affiliate, uint256 affiliateReward);
    event OrderRefunded(uint256 indexed orderId, address indexed buyer, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor(address usdcAddress) {
        require(usdcAddress != address(0), "zero USDC");
        usdc = IERC20(usdcAddress);
        owner = msg.sender;
    }

    function pay(uint128 amount, address affiliate, uint128 affiliateReward) external returns (uint256 orderId) {
        require(amount > 0 && affiliateReward <= amount, "invalid amount");
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        orderId = nextOrderId++;
        orders[orderId] = Order(msg.sender, affiliate, amount, affiliateReward, Status.Paid);
        emit OrderPaid(orderId, msg.sender, affiliate, amount, affiliateReward);
    }

    /// @notice Called only after staff validates the off-chain order.
    function validate(uint256 orderId) external onlyOwner {
        Order storage order = orders[orderId];
        require(order.status == Status.Paid, "not payable");
        order.status = Status.Validated;
        uint256 merchantAmount = uint256(order.amount) - uint256(order.affiliateReward);
        if (order.affiliate != address(0) && order.affiliateReward > 0) require(usdc.transfer(order.affiliate, order.affiliateReward), "reward failed");
        if (merchantAmount > 0) require(usdc.transfer(owner, merchantAmount), "settlement failed");
        emit OrderValidated(orderId, order.affiliate, order.affiliateReward);
    }

    function refund(uint256 orderId) external onlyOwner {
        Order storage order = orders[orderId];
        require(order.status == Status.Paid, "not refundable");
        order.status = Status.Refunded;
        require(usdc.transfer(order.buyer, order.amount), "refund failed");
        emit OrderRefunded(orderId, order.buyer, order.amount);
    }
}
