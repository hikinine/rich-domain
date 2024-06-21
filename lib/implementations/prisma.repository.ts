import { BaseAdapter } from '../core/application/adapter';
import { RepositoryImplementation } from '../core/application/repository';
import { Pagination } from '../core/common/pagination';
import { PaginationCriteria } from '../core/common/pagination-criteria';
import { Filtering } from '../core/common/pagination-types';
import { Aggregate } from '../core/domain/aggregate';
import { WriteOptions } from '../core/domain/repository';
import { UnitOfWorkService } from './unit-of-work.service';

type IPrismaService = {
  $disconnect: () => Promise<any>
}

export abstract class PrismaRepository<
  PrismaService extends IPrismaService,
  Domain extends Aggregate<any>,
  Persistence,
> extends RepositoryImplementation<any> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly adapterToDomain: BaseAdapter<Persistence, Domain>,
    protected readonly adapterToPersistence: BaseAdapter<Domain, any>,
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

  protected generateFindQuery(criteria: PaginationCriteria<object>) {
    const query = {} as any;
    query.skip = criteria.offset;
    query.take = criteria.limit;


    const filter = { AND: [] as Filtering[] };

    if (criteria.businessFilter) {
      filter.AND.push(criteria.businessFilter);
    }

    if (criteria.search) {
      query.skip = 0;
      filter.AND.push(this.generateSearchQuery(criteria.search));
    }

    if (criteria.filter) {
      filter.AND.push(criteria.filter);
    }

    if (filter.AND.length > 0) query.where = filter

    if (criteria.orderBy) {
      query.orderBy = criteria.orderBy
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
    ) as Domain[];

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
