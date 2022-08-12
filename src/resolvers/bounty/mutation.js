const calculateTvl = require('../../utils/calculateTvl');
const { AuthenticationError } = require('apollo-server');
const { verifySignature } = require('../../utils/auth/verifySignature');

const Mutation = {
	createBounty: async (parent, args, { req, prisma }) => {
		if (req.headers.authorization !== process.env.OPENQ_API_SECRET) {
			throw new AuthenticationError();
		}
		return prisma.bounty.create({
			data: {
				blacklisted: false,
				type: args.type,
				views: 0,
				tvl: 0,
				address: String(args.address),
				organizationId: args.organizationId,
				bountyId: args.bountyId
			},
		});
	},
	updateBounty: async (parent, args, { req, prisma }) => {
		if (req.headers.authorization !== process.env.OPENQ_API_SECRET) {
			throw new AuthenticationError();
		}
		return prisma.bounty.upsert({
			where: { address: args.address },
			update: {
				tvl: args.tvl,
				type: args.type, ...(args.organizationId) && { organizationId: args.organizationId }
			},
			create: {
				type: args.type,
				blacklisted: false,
				address: String(args.address),
				tvl: args.tvl,
				organizationId: args.organizationId,
				bountyId: args.bountyId
			},
		});
	},

	blackList: async (parent, args, { req, prisma }) => {
		if (req.headers.authorization !== process.env.BANHAMMER) {
			throw new AuthenticationError();
		}
		return prisma.bounty.update(
			{
				where: { bountyId: args.bountyId },
				data: { blacklisted: args.blackList }
			}
		);
	},

	addToTvl: async (parent, args, { req, prisma }) => {
		if (req.headers.authorization !== process.env.OPENQ_API_SECRET) {
			throw new AuthenticationError();
		}
		const { tokenBalance, address, add } = args;
		const bounty = await prisma.bounty.findUnique({
			where: { address },
		});
		const currentTvl = bounty.tvl;
		const tvl = await calculateTvl(tokenBalance, currentTvl, add);
		return prisma.bounty.update({
			where: { address },
			data: {
				tvl
			},
		});
	},
	watchBounty: async (parent, args, { req, prisma }) => {
		if (!verifySignature(req, args.userAddress)) {
			throw new AuthenticationError();
		}
		const bounty = await prisma.bounty.findUnique({
			where: { address: args.contractAddress },
		});
		const user = await prisma.user.upsert({
			where: { address: args.userAddress },
			update: {
				watchedBountyIds: {
					push: bounty.address,
				},
			},
			create: {
				address: args.userAddress,
				watchedBountyIds: [bounty.address],
			},
		});
		return prisma.bounty.update({
			where: { address: args.contractAddress },
			data: {
				watchingUserIds: {
					push: user.address,
				},
			},
		});
	},
	unWatchBounty: async (parent, args, { req, prisma }) => {
		if (!verifySignature(req, args.userAddress)) {
			throw new AuthenticationError();
		}
		const bounty = await prisma.bounty.findUnique({
			where: { address: args.contractAddress },
		});
		const user = await prisma.user.findUnique({
			where: { address: args.userAddress },
		});
		const newBounties = user.watchedBountyIds.filter(
			(bountyId) => bountyId !== bounty.address
		);
		const newUsers = bounty.watchingUserIds.filter(
			(userId) => userId !== user.address
		);

		await prisma.user.update({
			where: { address: args.userAddress },
			data: {
				watchedBountyIds: { set: newBounties },
			},
		});
		return prisma.bounty.update({
			where: { address: args.contractAddress },
			data: {
				watchingUserIds: { set: newUsers },
			},
		});
	}
};

module.exports = Mutation;