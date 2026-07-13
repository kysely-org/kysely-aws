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
import { RDSDataAPIDialectAdapter } from './dialect-adapter'
import { RDSDataAPIDriver } from './driver'

export class RDSDataAPIPostgresDialect implements Dialect {
	createDriver(): Driver {
		return new RDSDataAPIDriver()
	}

	createQueryCompiler(): QueryCompiler {
		return new PostgresQueryCompiler()
	}

	createAdapter(): DialectAdapter {
		return new RDSDataAPIDialectAdapter()
	}

	createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
		return new PostgresIntrospector(db)
	}
}
