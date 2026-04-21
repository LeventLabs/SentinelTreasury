// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract HskForwarder {
    constructor(address payable to) payable {
        selfdestruct(to);
    }
}
