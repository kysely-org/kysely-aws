import { RDSDataClient } from '@aws-sdk/client-rds-data'
import {
	type DatabaseIntrospector,
	type Dialect,
	type DialectAdapter,
	type Driver,
	type Kysely,
	PostgresIntrospector,
	type QueryCompiler,
} from 'kysely'
import { RDSDataAPIDialectAdapter } from './dialect-adapter'
import { RDSDataAPIDriver } from './driver'
import { RDSDataAPIPostgresQueryCompiler } from './postgres-query-compiler'
import {
	DefaultRDSDataAPITypeMapper,
	type RDSDataAPITypeMapper,
} from './type-mapper'

export type RDSDataAPIPostgresDialectConfig = {
	createClient?: () => RDSDataClient | Promise<RDSDataClient>
	typeMapper?: RDSDataAPITypeMapper
	connection: {
		resourceArn: string
		secretArn: string
		database: string
	}
}

export class RDSDataAPIPostgresDialect implements Dialect {
	readonly #config: Required<RDSDataAPIPostgresDialectConfig>

	constructor(config: RDSDataAPIPostgresDialectConfig) {
		this.#config = {
			createClient: config.createClient ?? (() => new RDSDataClient()),
			typeMapper: config.typeMapper ?? new DefaultRDSDataAPITypeMapper(),
			connection: config.connection,
		}
	}
	createDriver(): Driver {
		return new RDSDataAPIDriver(this.#config)
	}

	createQueryCompiler(): QueryCompiler {
		return new RDSDataAPIPostgresQueryCompiler()
	}

	createAdapter(): DialectAdapter {
		return new RDSDataAPIDialectAdapter()
	}

	createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
		return new PostgresIntrospector(db)
	}
}
