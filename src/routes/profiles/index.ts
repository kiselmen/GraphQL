import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    const profiles = await fastify.db.profiles.findMany();
    return profiles;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profileID = request.params.id;

      const profile = await fastify.db.profiles.findOne({ key: 'id', equals: profileID });
      if (!profile) throw fastify.httpErrors.notFound();

      return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profileData = request.body;
      const userId = request.body.userId;
      const memberTypeId = request.body.memberTypeId;

      const userByID = await fastify.db.users.findOne({ key: 'id', equals: userId });
      const profileByID = await fastify.db.profiles.findOne({ key: 'userId', equals: userId });
      const memberTypeByID = await fastify.db.memberTypes.findOne({ key: 'id', equals: memberTypeId });

      if (!memberTypeByID || !userByID || profileByID) throw fastify.httpErrors.badRequest();

      const createProfile = await fastify.db.profiles.create(profileData);
      return createProfile;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profileID = request.params.id;
      const profileByID = await fastify.db.profiles.findOne({ key: 'id', equals: profileID });

      if (!profileByID) throw fastify.httpErrors.badRequest();
      const deletedProfile = await fastify.db.profiles.delete(profileID);
      return deletedProfile;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profileID = request.params.id;
      const profileByID = await fastify.db.profiles.findOne({ key: 'id', equals: profileID });
      if (!profileByID)  throw fastify.httpErrors.badRequest();
      const changedProfile = await fastify.db.profiles.change(profileID, request.body);
      return changedProfile;
    }
  );
};

export default plugin;
