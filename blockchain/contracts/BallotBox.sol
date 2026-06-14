// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BallotBox {
    address public eciAdmin;

    event FraudAlarmTriggered(string voterIdentityHash, string message);
    event ChallengeBallotCast(uint256 constituencyId, uint256 candidateId, string voterIdentityHash);
    event PartyRegistered(uint256 partyId, string name);
    event CandidatePartySwitched(uint256 constituencyId, uint256 candidateId, uint256 oldPartyId, uint256 newPartyId);
    event ConstituencyResultsPublished(uint256 constituencyId);

    // ── Election Scope ────────────────────────────────────────────────────────
    enum ElectionType { National, Local }
    ElectionType public currentElectionType;

    // For National/State polls
    mapping(uint256 => string) public constituencies; 
    uint256 public constituencyCount;

    // For Local Body polls
    mapping(uint256 => string) public wards;          
    uint256 public wardCount;

    // ── Role-Based Access Control (RBAC) ──────────────────────────────────────
    enum Role { CentralAdmin, ReturningOfficer, ElectoralOfficer, PresidingOfficer }
    mapping(address => Role) public userRoles;
    mapping(address => mapping(uint256 => bool)) public zoneAuthorizations; // maps manager to specific constituency/ward ID

    modifier onlyRole(Role _role) {
        require(msg.sender == eciAdmin || userRoles[msg.sender] == _role, "Access Denied: Missing cryptographic clearance for role.");
        _;
    }

    modifier onlyAuthorizedZone(uint256 _zoneId) {
        require(msg.sender == eciAdmin || zoneAuthorizations[msg.sender][_zoneId], "Access Denied: Not authorized for this zone.");
        _;
    }

    // Admin wrapper to assign roles directly on-chain if using separate multi-sig wallets
    function assignRole(address _user, Role _role) public onlyAdmin {
        userRoles[_user] = _role;
    }

    function authorizeZone(address _user, uint256 _zoneId) public onlyAdmin {
        zoneAuthorizations[_user][_zoneId] = true;
    }

    // ── Party Registry ────────────────────────────────────────────────────────
    struct Party {
        uint256 id;
        string name;
        string logoUrl;
    }

    mapping(uint256 => Party) public registeredParties;
    uint256 public partyCount;

    // ── Candidate Storage ─────────────────────────────────────────────────────
    struct Candidate {
        uint256 id;
        string name;
        uint256 partyId;          // references registeredParties
        uint256 originalPartyId;  // immutable snapshot at registration
        uint256 voteCount;
        string loggedEmployeeId;
        bool isWithdrawn;
    }

    mapping(uint256 => mapping(uint256 => Candidate)) public constituencyCandidates;
    mapping(uint256 => uint256) public constituencyCandidateCount;

    // ── Per-Constituency Result Publication ───────────────────────────────────
    // Replaces the global `electionClosed` bool.
    // Once published, voting in that constituency is permanently sealed.
    mapping(uint256 => bool) public isConstituencyResultsPublished;

    // ── Voter Deduplication & Security ────────────────────────────────────────
    mapping(string => bool) private hasAadhaarVoted;
    mapping(string => bool) public isChallengeVote;
    mapping(bytes32 => bool) public usedNullifiers; // Anonymous cryptographically generated tokens

    // ── Tendered Votes (Rule 49P) ─────────────────────────────────────────────
    struct TenderedBallot {
        uint256 constituencyId;
        uint256 candidateId;
        string voterIdHash; // Redacted identifier tracking
        uint256 timestamp;
    }
    mapping(uint256 => TenderedBallot[]) public constituencyTenderedBallots;

    uint256 public totalVotesCast;

    modifier onlyAdmin() {
        require(msg.sender == eciAdmin, "Access Denied: Only ECI Admin can invoke this.");
        _;
    }

    constructor() {
        eciAdmin = msg.sender;
    }

    // ── Party Administration ──────────────────────────────────────────────────
    function registerParty(string memory _name, string memory _logoUrl) public onlyRole(Role.CentralAdmin) {
        partyCount++;
        registeredParties[partyCount] = Party(partyCount, _name, _logoUrl);
        emit PartyRegistered(partyCount, _name);
    }

    function getParty(uint256 _partyId) public view returns (uint256, string memory, string memory) {
        Party memory p = registeredParties[_partyId];
        return (p.id, p.name, p.logoUrl);
    }

    // ── Scope & Boundary Administration ───────────────────────────────────────
    function setElectionType(uint8 _type) public onlyAdmin {
        require(_type <= uint8(ElectionType.Local), "Invalid election type.");
        currentElectionType = ElectionType(_type);
    }

    function addConstituency(uint256 _id, string memory _name) public onlyAdmin {
        require(currentElectionType == ElectionType.National, "Active election is not National.");
        if (bytes(constituencies[_id]).length == 0) {
            constituencyCount++;
        }
        constituencies[_id] = _name;
    }

    function addWard(uint256 _id, string memory _name) public onlyAdmin {
        require(currentElectionType == ElectionType.Local, "Active election is not Local.");
        if (bytes(wards[_id]).length == 0) {
            wardCount++;
        }
        wards[_id] = _name;
    }

    // ── Candidate Administration ──────────────────────────────────────────────
    function addCandidate(uint256 _constituencyId, string memory _name, uint256 _partyId, string memory _loggedEmployeeId) public onlyRole(Role.ReturningOfficer) onlyAuthorizedZone(_constituencyId) {
        if (currentElectionType == ElectionType.National) {
            require(bytes(constituencies[_constituencyId]).length > 0, "Constituency is not registered.");
        } else {
            require(bytes(wards[_constituencyId]).length > 0, "Ward is not registered.");
        }
        require(!isConstituencyResultsPublished[_constituencyId], "Constituency results already published.");
        require(_partyId > 0 && _partyId <= partyCount, "Invalid party ID.");
        constituencyCandidateCount[_constituencyId]++;
        uint256 cId = constituencyCandidateCount[_constituencyId];
        constituencyCandidates[_constituencyId][cId] = Candidate(cId, _name, _partyId, _partyId, 0, _loggedEmployeeId, false);
    }

    function withdrawCandidate(uint256 _constituencyId, uint256 _candidateId) public onlyRole(Role.ReturningOfficer) onlyAuthorizedZone(_constituencyId) {
        require(!isConstituencyResultsPublished[_constituencyId], "Constituency results already published.");
        require(_candidateId > 0 && _candidateId <= constituencyCandidateCount[_constituencyId], "Invalid candidate ID.");
        require(!constituencyCandidates[_constituencyId][_candidateId].isWithdrawn, "Candidate already withdrawn.");
        
        constituencyCandidates[_constituencyId][_candidateId].isWithdrawn = true;
    }

    function updateCandidateParty(uint256 _constituencyId, uint256 _candidateId, uint256 _newPartyId) public onlyAdmin {
        require(isConstituencyResultsPublished[_constituencyId], "Can only update party affiliation after constituency results are published.");
        require(_newPartyId > 0 && _newPartyId <= partyCount, "Invalid party ID.");
        uint256 oldPartyId = constituencyCandidates[_constituencyId][_candidateId].partyId;
        constituencyCandidates[_constituencyId][_candidateId].partyId = _newPartyId;
        emit CandidatePartySwitched(_constituencyId, _candidateId, oldPartyId, _newPartyId);
    }

    // ── Voting ────────────────────────────────────────────────────────────────
    function castBallot(uint256 _constituencyId, uint256 _candidateId, string memory _voterIdentityHash) public {
        require(!isConstituencyResultsPublished[_constituencyId], "Voting is closed for this constituency.");
        require(_candidateId > 0 && _candidateId <= constituencyCandidateCount[_constituencyId], "Invalid candidate ID.");
        require(!constituencyCandidates[_constituencyId][_candidateId].isWithdrawn, "Candidate has withdrawn. Cannot vote for them.");
        require(!hasAadhaarVoted[_voterIdentityHash], "Security Alert: This National ID has already voted.");

        constituencyCandidates[_constituencyId][_candidateId].voteCount++;
        hasAadhaarVoted[_voterIdentityHash] = true;
        totalVotesCast++;
    }

    function castChallengeBallot(uint256 _constituencyId, uint256 _candidateId, string memory _voterIdentityHash) public onlyRole(Role.PresidingOfficer) onlyAuthorizedZone(_constituencyId) {
        require(!isConstituencyResultsPublished[_constituencyId], "Voting is closed for this constituency.");
        require(_candidateId > 0 && _candidateId <= constituencyCandidateCount[_constituencyId], "Invalid candidate ID.");

        constituencyCandidates[_constituencyId][_candidateId].voteCount++;
        isChallengeVote[_voterIdentityHash] = true;
        totalVotesCast++;

        emit ChallengeBallotCast(_constituencyId, _candidateId, _voterIdentityHash);
    }

    function castTenderedBallot(uint256 _constituencyId, uint256 _candidateId, string memory _voterIdentityHash, bytes32 _nullifier) public onlyRole(Role.PresidingOfficer) onlyAuthorizedZone(_constituencyId) {
        require(!isConstituencyResultsPublished[_constituencyId], "Voting is closed for this constituency.");
        require(_candidateId > 0 && _candidateId <= constituencyCandidateCount[_constituencyId], "Invalid candidate ID.");
        require(!usedNullifiers[_nullifier], "Security Alert: Nullifier token has already been consumed.");

        usedNullifiers[_nullifier] = true;

        constituencyTenderedBallots[_constituencyId].push(TenderedBallot({
            constituencyId: _constituencyId,
            candidateId: _candidateId,
            voterIdHash: _voterIdentityHash,
            timestamp: block.timestamp
        }));
    }

    // ── Election Lifecycle — Per Constituency ─────────────────────────────────
    /// @notice Seals voting for `_constituencyId` and authorises public result visibility.
    function publishConstituencyResults(uint256 _constituencyId) public onlyRole(Role.CentralAdmin) {
        require(!isConstituencyResultsPublished[_constituencyId], "Results already published for this constituency.");
        isConstituencyResultsPublished[_constituencyId] = true;
        emit ConstituencyResultsPublished(_constituencyId);
    }

    // ── View Helpers ──────────────────────────────────────────────────────────
    function getCandidate(uint256 _constituencyId, uint256 _candidateId) public view
        returns (uint256, string memory, uint256, uint256, uint256, string memory, string memory, string memory, bool)
    {
        Candidate memory c = constituencyCandidates[_constituencyId][_candidateId];
        Party memory p = registeredParties[c.partyId];
        Party memory op = registeredParties[c.originalPartyId];
        return (c.id, c.name, c.partyId, c.originalPartyId, c.voteCount, p.logoUrl, op.name, c.loggedEmployeeId, c.isWithdrawn);
    }

    // ── Advanced RPA 1951 Election Analytics ──────────────────────────────────
    struct ConstituencyAnalytics {
        uint256 totalValidVotes;
        uint256[] winnerIds; // Multiple if tie
        bool isUncontested;
        uint256[] forfeitedDepositCandidateIds; // < 1/6th of total valid votes
    }

    /// @notice Returns edge-case analytics based on RPA 1951 Rules (Ties, Uncontested, Forfeitures)
    function getConstituencyAnalytics(uint256 _constituencyId) public view returns (ConstituencyAnalytics memory) {
        require(isConstituencyResultsPublished[_constituencyId], "Results not published yet.");
        
        uint256 count = constituencyCandidateCount[_constituencyId];
        uint256 totalValid = 0;
        uint256 maxVotes = 0;
        uint256 activeCandidates = 0;
        
        for (uint256 i = 1; i <= count; i++) {
            Candidate memory c = constituencyCandidates[_constituencyId][i];
            if (!c.isWithdrawn) {
                totalValid += c.voteCount;
                activeCandidates++;
                if (c.voteCount > maxVotes) {
                    maxVotes = c.voteCount;
                }
            }
        }

        // Section 53: Uncontested Election (Nirvirodh)
        bool isUncontested = (activeCandidates == 1);

        // Find winners (can be tie - Section 65 / 102)
        uint256 winnerCount = 0;
        for (uint256 i = 1; i <= count; i++) {
            Candidate memory c = constituencyCandidates[_constituencyId][i];
            if (!c.isWithdrawn && c.voteCount == maxVotes && activeCandidates > 0) {
                winnerCount++;
            }
        }
        
        uint256[] memory winners = new uint256[](winnerCount);
        uint256 wIndex = 0;
        for (uint256 i = 1; i <= count; i++) {
            Candidate memory c = constituencyCandidates[_constituencyId][i];
            if (!c.isWithdrawn && c.voteCount == maxVotes && activeCandidates > 0) {
                winners[wIndex] = i;
                wIndex++;
            }
        }

        // Section 158: Forfeiture of Security Deposit (< 1/6th of total valid votes)
        // NOT applicable to winner/tied winners.
        uint256 forfeitCount = 0;
        for (uint256 i = 1; i <= count; i++) {
            Candidate memory c = constituencyCandidates[_constituencyId][i];
            if (!c.isWithdrawn && c.voteCount != maxVotes && (c.voteCount * 6 < totalValid)) {
                forfeitCount++;
            }
        }

        uint256[] memory forfeited = new uint256[](forfeitCount);
        uint256 fIndex = 0;
        for (uint256 i = 1; i <= count; i++) {
            Candidate memory c = constituencyCandidates[_constituencyId][i];
            if (!c.isWithdrawn && c.voteCount != maxVotes && (c.voteCount * 6 < totalValid)) {
                forfeited[fIndex] = i;
                fIndex++;
            }
        }

        return ConstituencyAnalytics({
            totalValidVotes: totalValid,
            winnerIds: winners,
            isUncontested: isUncontested,
            forfeitedDepositCandidateIds: forfeited
        });
    }
}
