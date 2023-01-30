import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { validate, version } from 'uuid';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    const allUsers = await fastify.db.users.findMany();
     return allUsers; 
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userId = request.params.id;
      const user = await fastify.db.users.findOne({ key: 'id', equals: userId });
      if (user) return user;
      throw fastify.httpErrors.notFound();
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userData = request.body;
      const newUser = await fastify.db.users.create(userData);
      return newUser;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userID = request.params.id;
      if (!validate(userID) || version(userID) !== 4) throw fastify.httpErrors.badRequest();

      const user = await fastify.db.users.findOne({ key: 'id', equals: userID });
      if (!user) throw fastify.httpErrors.notFound();

      const userProfiles = await fastify.db.profiles.findMany({ key: 'userId', equals: userID });
      for (const userProfile of userProfiles) {
        await fastify.db.profiles.delete(userProfile.id);
      }

      const userPosts = await fastify.db.posts.findMany({ key: 'userId', equals: userID });
      for (const userPost of userPosts) {
        await fastify.db.posts.delete(userPost.id);
      }

      const UsersfolowToThisUser = await fastify.db.users.findMany({ key: 'subscribedToUserIds', inArray: userID })
      for (const UserfolowToThisUser of UsersfolowToThisUser) {
        const followers = UserfolowToThisUser.subscribedToUserIds;
        const index = followers.indexOf(userID);
        if (index !== -1) {
          followers.splice(index, 1);
        }
        await fastify.db.users.change(UserfolowToThisUser.id, UserfolowToThisUser);
      };

      const deleteUser = await fastify.db.users.delete(userID);

      return deleteUser;

    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const idToFollow = request.params.id;
      const userID = request.body.userId;
      const user = await fastify.db.users.findOne({ key: 'id', equals: idToFollow });
      if (!user) throw fastify.httpErrors.notFound();

      const userIDSubscribes = await fastify.db.users.findOne({ key: 'id', equals: userID });
      if (!userIDSubscribes) throw fastify.httpErrors.badRequest();
      
      userIDSubscribes.subscribedToUserIds.push(idToFollow);
      await fastify.db.users.change(userID, userIDSubscribes)
      return user;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userIdToNotFollow = request.params.id;
      const userId = request.body.userId;
      const userToUnsubscribe = await fastify.db.users.findOne({ key: 'id', equals: userIdToNotFollow });
      if (!userToUnsubscribe)  throw fastify.httpErrors.notFound();

      const user = await fastify.db.users.findOne({ key: 'id', equals: userId });
      if (!user) throw fastify.httpErrors.notFound();

      const userIdSubscribers = user.subscribedToUserIds;

      if (!userIdSubscribers.includes(userIdToNotFollow)) throw fastify.httpErrors.badRequest();
      
      const index = userIdSubscribers.indexOf(userIdToNotFollow);
      if (index !== -1) userIdSubscribers.splice(index, 1);

      await fastify.db.users.change(userId, user);

      return user;

    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userId = request.params.id;

      const user = await fastify.db.users.findOne({ key: 'id', equals: userId });
      if (!user) throw fastify.httpErrors.badRequest();
      const changedUser = await fastify.db.users.change(userId, request.body);
      
      return changedUser;

    }
  );
};

export default plugin;
