pragma solidity >=0.4.0 <0.6.0;

import "./SafeMath.sol";

contract Donation {

    using SafeMath for uint256;

    enum State { Open, Canceled }
    
    State public state;
    address public recipient;

    uint public term;
    uint public min;
    uint public max;
    uint public unit;
    uint public upper_limit;
    uint public lower_limit;

    uint public total_value;

    uint public num_of_donators;
    address payable[] donators_list;
    mapping (address => uint) public amount_list;

    modifier is_recipient(){
        require(msg.sender == recipient);

        _;
    }
    
    modifier is_passed_term(){
        require(term < block.number);
        
        _;
    }
    
    modifier is_not_passed_term(){
        require(block.number <= term);
        
        _;
    }

    modifier is_not_canceled(){
        require(state != State.Canceled);

        _;
    }

    constructor(uint _term, uint _min, uint _max, uint _unit, uint _upper_limit, uint _lower_limit) public {

        require(_min <= _max);
        require(_lower_limit < _upper_limit);

        recipient = msg.sender;

        term = block.number + _term;
        min = _min;
        max = _max;
        unit = _unit;
        upper_limit = _upper_limit;
        lower_limit = _lower_limit;

        num_of_donators = 0;
        total_value = 0;

        state = State.Open;
    }

    function withdraw() public is_recipient is_passed_term is_not_canceled {
        total_value = 0;
        msg.sender.transfer(total_value);
    }

    function cancel_and_refund() public is_recipient is_not_canceled {
        for(uint i = 0; i < donators_list.length; i++){
            donators_list[i].transfer(amount_list[donators_list[i]]);
        }
        state = State.Canceled;
    }

    function cancel() public is_recipient is_not_canceled {
        state = State.Canceled;
    }

    function donate() public payable is_not_passed_term is_not_canceled {
        require(min <= msg.value, "");
        require(msg.value <= max, "");
        require((msg.value % unit) == 0, "");

        require((total_value + msg.value) <= upper_limit, "");

        uint index;
        for(index = 0; index < donators_list.length; index++){
            if(donators_list[index] == msg.sender){
                break;
            }
        }
        if(donators_list.length <= index){
            donators_list.push(msg.sender);
        }
        amount_list[msg.sender] = amount_list[msg.sender].add(msg.value);
        total_value = total_value.add(msg.value);
    }

    function refund(uint _value) public is_not_passed_term {
        require(_value <= amount_list[msg.sender], "");

        uint refund_value;
        if(amount_list[msg.sender].sub(_value) < unit){
            refund_value = amount_list[msg.sender].sub(_value);
        }
        else {
            refund_value = _value;
        }
        amount_list[msg.sender] = amount_list[msg.sender].sub(refund_value);
        msg.sender.transfer(refund_value);
    }

    function get_project_info() public view returns( uint, uint, uint, uint, uint, uint ) {
        return (
            term,
            min,
            max,
            unit,
            upper_limit,
            lower_limit
        );
    }

    function get_donation_info() public view returns( uint, address[] memory, uint[] memory) {
        address[] memory address_list = new address[](donators_list.length);
        uint[] memory donate_list = new uint[](donators_list.length);

        for(uint i = 0; i < donators_list.length; i++){
            address_list[i] = donators_list[i];
            donate_list[i] = amount_list[donators_list[i]];
        }

        return (
            total_value,
            address_list,
            donate_list
        );
    }

    function check_passed_term() view public returns ( bool ) {
        return term < block.number;
    }

}