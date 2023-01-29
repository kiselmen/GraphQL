import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    const posts = await fastify.db.posts.findMany();
    return posts;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const postID = request.params.id;
      const posts = await fastify.db.posts.findOne({ key: 'id', equals: postID });
      if (!posts) throw fastify.httpErrors.notFound();
      return posts;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const postData = request.body;
      const newPost = await fastify.db.posts.create(postData);
      return newPost;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const postID = request.params.id;
      const postForDelete = await fastify.db.posts.findOne({ key: 'id', equals: postID });
      if (!postForDelete) throw fastify.httpErrors.badRequest();
      const deletedPost = await fastify.db.posts.delete(postID);
      return deletedPost;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const postID = request.params.id;
      const postForDelete = await fastify.db.posts.findOne({ key: 'id', equals: postID });
      if (!postForDelete) throw fastify.httpErrors.badRequest();
      const changedPost = await fastify.db.posts.change(postID, request.body);
      return changedPost;
    }
  );
};

export default plugin;
