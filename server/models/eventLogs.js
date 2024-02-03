const prisma = require("../utils/prisma");

const EventLogs = {
  logEvent: async function (
    event,
    metadata = {},
    userId = null,
    ipAddress = null
  ) {
    try {
      const eventLog = await prisma.event_logs.create({
        data: {
          event,
          metadata: metadata ? JSON.stringify(metadata) : null,
          userId: userId ? Number(userId) : null,
          ipAddress: ipAddress ? ipAddress : null,
          occurredAt: new Date(),
        },
      });
      return { eventLog, message: null };
    } catch (error) {
      console.error(error.message);
      return { eventLog: null, message: error.message };
    }
  },

  getByEvent: async function (event, limit = null, orderBy = null) {
    try {
      const logs = await prisma.event_logs.findMany({
        where: { event },
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null
          ? { orderBy }
          : { orderBy: { occurredAt: "desc" } }),
      });
      return logs;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  getByUserId: async function (userId, limit = null, orderBy = null) {
    try {
      const logs = await prisma.event_logs.findMany({
        where: { userId },
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null
          ? { orderBy }
          : { orderBy: { occurredAt: "desc" } }),
      });
      return logs;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  where: async function (
    clause = {},
    limit = null,
    orderBy = null,
    offset = null
  ) {
    try {
      const logs = await prisma.event_logs.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(offset !== null ? { skip: offset } : {}),
        ...(orderBy !== null
          ? { orderBy }
          : { orderBy: { occurredAt: "desc" } }),
      });
      return logs;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  whereWithData: async function (
    clause = {},
    limit = null,
    offset = null,
    orderBy = null
  ) {
    const { User } = require("./user");

    try {
      const results = await this.where(clause, limit, orderBy, offset);

      for (const res of results) {
        const user = res.userId ? await User.get({ id: res.userId }) : null;
        res.user = user
          ? { username: user.username }
          : { username: "unknown user" };
      }

      return results;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.event_logs.count({
        where: clause,
      });
      return count;
    } catch (error) {
      console.error(error.message);
      return 0;
    }
  },
};

module.exports = { EventLogs };
