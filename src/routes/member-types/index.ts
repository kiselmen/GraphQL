import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<MemberTypeEntity[]> {
    const memberTypes = await fastify.db.memberTypes.findMany();
    return memberTypes;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const memberTypeID = request.params.id;
      const memberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: memberTypeID });
      if (!memberType) throw fastify.httpErrors.notFound();
      return memberType;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const memberTypeID = request.params.id;
      const memberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: memberTypeID });
      if (!memberType) throw fastify.httpErrors.badRequest();
      const changedMemberType = await fastify.db.memberTypes.change(memberTypeID, request.body);
      return changedMemberType;
    }
  );
};

export default plugin;
