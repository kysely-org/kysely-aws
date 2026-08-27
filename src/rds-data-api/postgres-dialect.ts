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
import { type ClientFactory, RDSDataAPIDriver } from './driver'
import { RDSDataAPIPostgresQueryCompiler } from './postgres-query-compiler'
import type { CreateExecuteStatementCommand } from './rds-data-api-types'
import {
	DefaultRDSDataAPITypeMapper,
	type RDSDataAPITypeMapper,
} from './type-mapper'

export type RDSDataAPIPostgresDialectConfig = {
	createClient: ClientFactory
	typeMapper?: RDSDataAPITypeMapper
	connection: {
		resourceArn: string
		secretArn: string
		database: string
	}
	executeStatementCommand: CreateExecuteStatementCommand
}

export class RDSDataAPIPostgresDialect implements Dialect {
	readonly #config: Required<RDSDataAPIPostgresDialectConfig>

	constructor(config: RDSDataAPIPostgresDialectConfig) {
		this.#config = {
			createClient: config.createClient,
			typeMapper: config.typeMapper ?? new DefaultRDSDataAPITypeMapper(),
			connection: config.connection,
			executeStatementCommand: config.executeStatementCommand,
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
