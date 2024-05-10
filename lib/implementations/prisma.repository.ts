import { Adapter } from '..';
import {
  Aggregate,
  Impl,
  Pagination,
  PaginationCriteria,
  WriteOptions
} from '../core';
import { UnitOfWorkService } from './unit-of-work.service';

type IPrismaService = {
  $disconnect: () => Promise<void>
}

export abstract class PrismaRepository<
  PrismaService extends IPrismaService,
  Domain extends Aggregate<any>,
  Persistence,
> extends Impl<any> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly adapterToDomain: Adapter<Persistence, Domain>,
    protected readonly adapterToPersistence: Adapter<Domain, any>,
    protected readonly unitOfWorkService: UnitOfWorkService,
  ) {
    super();
  }

  protected abstract findIncludes: any;
  protected abstract uniqueIncludes: any;
  protected abstract generateSearchQuery(search: string): any;

  protected getContext(options?: WriteOptions): PrismaService {
    const unitOfWorkContext = this.unitOfWorkService.getContext();
    return unitOfWorkContext || options?.context || this.prisma;
  }

  protected generateFindQuery(criteria: PaginationCriteria) {
    const query = {} as any;
    query.skip = criteria.offset;
    query.take = criteria.limit;

    if (criteria.filter || criteria.businessFilter) {
      query.where = criteria.adaptFiltersToPrisma();
    }

    if (criteria.search) {
      query.skip = 0;
      if (criteria.businessFilter) {
        const partialQuery = criteria.adaptOnlyBusinessFiltersToPrisma();
        if (!partialQuery) throw new Error('should have business filter');

        partialQuery.AND.push(this.generateSearchQuery(criteria.search));
        query.where = partialQuery;
      } else {
        query.where = this.generateSearchQuery(criteria.search);
      }
    }

    if (criteria.orderBy) {
      query.orderBy = criteria.orderBy.map(([field, direction]) => ({
        [field]: direction,
      }));
    }
    return query;
  }

  async find(criteria: PaginationCriteria): Promise<Pagination<Domain>> {
    const tableName = this.model;
    const context = this.getContext();
    const query = this.generateFindQuery(criteria);
    const [models, total] = await Promise.all([
      context[tableName].findMany({
        ...query,
        include: this.findIncludes,
      }),
      context[tableName].count({ where: query.where }),
    ]);

    const result = (models as unknown as Persistence[]).map((value) =>
      this.adapterToDomain.build(value),
    );

    const pagination = new Pagination<Domain>(criteria, {
      result,
      total,
    }); 
    
    return pagination;
  }

  public async findById(id: string): Promise<Domain | null> {
    const tableName = this.model;
    const context = this.getContext();
    const query = {} as any;
    query.where = { id };

    const model = await context[tableName].findUnique({
      ...query,
      include: this.uniqueIncludes,
    });

    if (!model) {
      return null;
    }

    const domain = this.adapterToDomain.build(model as unknown as Persistence);
    return domain;
  }

  public async create(
    entity: Domain,
    options?: WriteOptions<unknown>,
  ): Promise<void> {
    const tableName = this.model;
    const context = this.getContext(options);
    const model = this.adapterToPersistence.build(entity);
    const query = await context[tableName].create({ data: model });

    if (!query) {
      throw query;
    }
  }

  public async update(
    entity: Domain,
    options?: WriteOptions<unknown>,
  ): Promise<void> {
    const tableName = this.model;
    const context = this.getContext(options);
    const model = this.adapterToPersistence.build(entity);
    const query = await context[tableName].update({
      where: { id: entity.id.value },
      data: model,
    });

    if (!query) {
      throw query;
    }
  }

  public async delete(
    entity: Domain,
    options?: WriteOptions<unknown>,
  ): Promise<void> {
    const tableName = this.model;
    const context = this.getContext(options);
    const query = await context[tableName].delete({
      where: { id: entity.id.value },
    });

    if (!query) {
      throw query;
    }
  }

  public async forceCloseConnection() {
    await this.prisma.$disconnect();
  }
}

export function parseQueryWithDots(field: string, verb: string, value: any) {
  const fieldMap = field.split('.');
  const m = {};
  fieldMap.reduce((acc, curr, index) => {
    if (index === fieldMap.length - 1) {
      acc[curr] = { [verb]: value };
    } else {
      acc[curr] = {};
    }

    return acc[curr];
  }, m);
  return m;
}
