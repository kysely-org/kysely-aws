import {
	type DatabaseIntrospector,
	type Dialect,
	type DialectAdapter,
	type Driver,
	type Kysely,
	PostgresIntrospector,
	PostgresQueryCompiler,
	type QueryCompiler,
} from 'kysely'
import { RdsDataApiDialectAdapter } from './postgres/dialect-adapter'
import { RdsDataApiDriver } from './postgres/driver'

export class PostgresDataApiDialect implements Dialect {
	createDriver(): Driver {
		return new RdsDataApiDriver()
	}

	createQueryCompiler(): QueryCompiler {
		return new PostgresQueryCompiler()
	}

	createAdapter(): DialectAdapter {
		return new RdsDataApiDialectAdapter()
	}

	createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
		return new PostgresIntrospector(db)
	}
}
