import { Router } from 'express';
import mongoose, { type Model } from 'mongoose';
import { Activity, Leaderboard, Team, User, Workout } from '../models/index.js';

function createResourceRouter(
  resourceModel: Model<any>,
  sort: Record<string, 1 | -1> = { _id: 1 },
): Router {
  const router = Router();

  router.param('id', (_request, response, next, id) => {
    if (!mongoose.isValidObjectId(id)) {
      response.status(400).json({ error: 'Invalid resource id' });
      return;
    }
    next();
  });

  router.get('/', async (_request, response) => {
    response.json(await resourceModel.find().sort(sort).lean());
  });

  router.get('/:id', async (request, response) => {
    const resource = await resourceModel.findById(request.params.id).lean();
    if (!resource) {
      response.status(404).json({ error: 'Resource not found' });
      return;
    }
    response.json(resource);
  });

  router.post('/', async (request, response) => {
    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      response.status(400).json({ error: 'Request body must be a JSON object' });
      return;
    }
    response.status(201).json(await resourceModel.create(request.body));
  });

  router.patch('/:id', async (request, response) => {
    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      response.status(400).json({ error: 'Request body must be a JSON object' });
      return;
    }
    const resource = await resourceModel.findByIdAndUpdate(request.params.id, request.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!resource) {
      response.status(404).json({ error: 'Resource not found' });
      return;
    }
    response.json(resource);
  });

  router.delete('/:id', async (request, response) => {
    const resource = await resourceModel.findByIdAndDelete(request.params.id);
    if (!resource) {
      response.status(404).json({ error: 'Resource not found' });
      return;
    }
    response.status(204).end();
  });

  return router;
}

export const apiRouter = Router();

apiRouter.use('/users', createResourceRouter(User));
apiRouter.use('/teams', createResourceRouter(Team));
apiRouter.use('/activities', createResourceRouter(Activity));
apiRouter.use('/leaderboard', createResourceRouter(Leaderboard, { points: -1, rank: 1 }));
apiRouter.use('/workouts', createResourceRouter(Workout));