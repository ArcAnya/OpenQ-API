const { gql } = require('apollo-server');

const typeDefs = gql`
	type Bounty {
		tvl: Float
		address: String!
		watchingUserIds: [String]
		watchingUsers(
			after: ID
			limit: Int!
			orderBy: String
			sortOrder: String
		): UserConnection!
	}
	type User {
		address: String!
		watchedBountyIds: [String]
		watchedBounties(
			after: ID
			limit: Int!
			orderBy: String
			sortOrder: String
		): BountyConnection!
	}

	type UserConnection {
		users: [User]
		cursor: ID
	}

	type BountyConnection {
		bounties: [Bounty]
		cursor: ID
	}

	type BatchPayload {
		count: Long!
	}
	scalar Long

	type Query {
		bountiesConnection(
			after: ID
			limit: Int!
			orderBy: String
			sortOrder: String
		): BountyConnection
		usersConnection(
			after: ID
			limit: Int
			orderBy: String
			sortOrder: String
		): UserConnection
		bounty(address: String!): Bounty
		user(address: String!): User
	}
	type Mutation {
		createBounty(address: String!): Bounty!
		updateBounty(address: String!, id: String!): BatchPayload!
		watchBounty(userAddress: String, contractAddress: String): User
		unWatchBounty(userAddress: String, contractAddress: String): User
	}
`;

module.exports = typeDefs;
