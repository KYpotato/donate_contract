pragma solidity >=0.4.0 < 0.6.0;

contract Project_list {
  address[] public projects;
  mapping(address => address) public to_ower;

  constructor() public {}

  function register_project(address _owner) public {
    require(to_ower[msg.sender] == address(0), 'this project is already registerd');
    projects.push(msg.sender);
    to_ower[msg.sender] = _owner;
  }

  function get_all_projects() public view returns(address[] memory, address[] memory) {
    address[] memory result_projects = new address[](projects.length);
    address[] memory result_owners = new address[](projects.length);

    for(uint i = 0; i < projects.length; i++) {
      result_projects[i] = projects[i];
      result_owners[i] = to_ower[projects[i]];
    }
    return (result_projects, result_owners);
  }
}