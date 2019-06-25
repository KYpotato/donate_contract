pragma solidity >=0.4.0 < 0.6.0;

contract Project_list {
  address[] public projects;

  constructor() public {}

  function register_project() public {
    projects.push(msg.sender);
  }

  function get_all_projects() public view returns(address[] memory) {
    address[] memory result = new address[](projects.length);

    for(uint i = 0; i < projects.length; i++) {
      result[i] = projects[i];
    }
    return result;
  }
}