import type {
	DatabaseIntrospector,
	Dialect,
	DialectAdapter,
	Driver,
	Kysely,
	QueryCompiler,
} from 'kysely'
import { RdsDataApiDatabaseIntrospector } from './postgres/database-introspector'
import { RdsDataApiDialectAdapter } from './postgres/dialect-adapter'
import { RdsDataApiDriver } from './postgres/driver'
import { RdsDataApiQueryCompiler } from './postgres/query-compiler'

export class PostgresDataApiDialect implements Dialect {
	createDriver(): Driver {
		return new RdsDataApiDriver()
	}

	createQueryCompiler(): QueryCompiler {
		return new RdsDataApiQueryCompiler()
	}

	createAdapter(): DialectAdapter {
		return new RdsDataApiDialectAdapter()
	}

	createIntrospector(_db: Kysely<unknown>): DatabaseIntrospector {
		return new RdsDataApiDatabaseIntrospector()
	}
}
