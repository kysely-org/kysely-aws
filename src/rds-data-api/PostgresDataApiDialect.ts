import type {
	DatabaseIntrospector,
	Dialect,
	DialectAdapter,
	Driver,
	Kysely,
	QueryCompiler,
} from 'kysely'
import { RdsDataApiDatabaseIntrospector } from './postgres/DatabaseIntrospector'
import { RdsDataApiDialectAdapter } from './postgres/DialectAdapter'
import { RdsDataApiDriver } from './postgres/Driver'
import { RdsDataApiQueryCompiler } from './postgres/QueryCompiler'

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
