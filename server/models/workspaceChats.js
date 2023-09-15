const prisma = require("../utils/prisma");

const WorkspaceChats = {
  new: async function ({ workspaceId, prompt, response = {}, user = null }) {
    try {
      const chat = await prisma.workspaceChats.create({
        data: {
          workspaceId,
          prompt,
          response: JSON.stringify(response),
          user_id: user?.id || null,
        },
      });
      return { chat, message: null };
    } catch (error) {
      console.error(error.message);
      return { chat: null, message: error.message };
    }
  },

  forWorkspaceByUser: async function (
    workspaceId = null,
    userId = null,
    limit = null
  ) {
    if (!workspaceId || !userId) return [];
    try {
      const chats = await prisma.workspaceChats.findMany({
        where: {
          workspaceId,
          include: true,
          user_id: userId,
        },
        take: limit,
        orderBy: {
          id: "asc",
        },
      });
      return chats;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  forWorkspace: async function (workspaceId = null, limit = null) {
    if (!workspaceId) return [];
    try {
      const chats = await prisma.workspaceChats.findMany({
        where: {
          workspaceId,
          include: true,
        },
        take: limit,
        orderBy: {
          id: "asc",
        },
      });
      return chats;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  markHistoryInvalid: async function (workspaceId = null, user = null) {
    if (!workspaceId) return;
    try {
      await prisma.workspaceChats.updateMany({
        where: {
          workspaceId,
          user_id: user?.id,
        },
        data: {
          include: false,
        },
      });
      return;
    } catch (error) {
      console.error(error.message);
    }
  },

  get: async function (clause = {}, limit = null, order = null) {
    try {
      const chat = await prisma.workspaceChats.findFirst({
        where: clause,
        take: limit,
        orderBy: order,
      });
      return chat || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.workspaceChats.deleteMany({
        where: clause,
      });
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  },

  where: async function (clause = {}, limit = null, order = null) {
    try {
      const chats = await prisma.workspaceChats.findMany({
        where: clause,
        take: limit,
        orderBy: order,
      });
      return chats;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.workspaceChats.count({
        where: clause,
      });
      return count;
    } catch (error) {
      console.error(error.message);
      return 0;
    }
  },

  whereWithData: async function (clause = {}, limit = null, order = null) {
    const { Workspace } = require("./workspace");
    const { User } = require("./user");

    try {
      const results = await this.where(clause, limit, order);

      for (const res of results) {
        const workspace = await Workspace.get({ id: res.workspaceId });
        res.workspace = workspace
          ? { name: workspace.name, slug: workspace.slug }
          : { name: "deleted workspace", slug: null };

        const user = await User.get({ id: res.user_id });
        res.user = user
          ? { username: user.username }
          : { username: "deleted user" };
      }

      return results;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },
};

module.exports = { WorkspaceChats };
