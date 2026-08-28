import {
	type DatabaseIntrospector,
	type Dialect,
	type DialectAdapter,
	type Driver,
	type Kysely,
	PostgresIntrospector,
	type QueryCompiler,
} from 'kysely'
import type { RDSDataAPIPostgresDialectConfig } from './config'
import { RDSDataAPIDialectAdapter } from './dialect-adapter'
import { RDSDataAPIDriver } from './driver'
import { RDSDataAPIPostgresQueryCompiler } from './postgres-query-compiler'
import { DefaultRDSDataAPITypeMapper } from './type-mapper'

export class RDSDataAPIPostgresDialect implements Dialect {
	readonly #config: Required<RDSDataAPIPostgresDialectConfig>

	constructor(config: RDSDataAPIPostgresDialectConfig) {
		this.#config = {
			client: config.client,
			typeMapper: config.typeMapper ?? new DefaultRDSDataAPITypeMapper(),
			executeStatementCommand: config.executeStatementCommand,
		}
	}
	createDriver(): Driver {
		return new RDSDataAPIDriver(this.#config)
	}

	createQueryCompiler(): QueryCompiler {
		return new RDSDataAPIPostgresQueryCompiler(this.#config.typeMapper)
	}

	createAdapter(): DialectAdapter {
		return new RDSDataAPIDialectAdapter()
	}

	createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
		return new PostgresIntrospector(db)
	}
}
