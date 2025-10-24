import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Soft delete middleware
prisma.$use(async (params, next) => {
  if (params.action === 'delete') {
    params.action = 'update';
    params.args['data'] = { deletedAt: new Date() };
  }
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data !== undefined) {
      params.args.data['deletedAt'] = new Date();
    } else {
      params.args['data'] = { deletedAt: new Date() };
    }
  }
  
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.action = 'findFirst';
    params.args.where['deletedAt'] = null;
  }
  if (params.action === 'findMany') {
    if (params.args.where) {
      if (params.args.where.deletedAt == undefined) {
        params.args.where['deletedAt'] = null;
      }
    } else {
      params.args['where'] = { deletedAt: null };
    }
  }

  return next(params);
});

export default prisma;