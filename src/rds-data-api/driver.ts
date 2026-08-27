import type {
	AbortableOperationOptions,
	DatabaseConnection,
	Driver,
	QueryCompiler,
	TransactionSettings,
} from 'kysely'
import { RDSDataAPIDatabaseConnection } from './database-connection'
import type { RDSDataAPIPostgresDialectConfig } from './postgres-dialect'
import type {
	CreateExecuteStatementCommand,
	DataAPIClient,
} from './rds-data-api-types'
import type { RDSDataAPITypeMapper } from './type-mapper'

export type ClientFactory = () => DataAPIClient | Promise<DataAPIClient>

export class RDSDataAPIDriver implements Driver {
	readonly #createClient: ClientFactory
	readonly #typeMapper: RDSDataAPITypeMapper
	readonly #executeStatementCommand: CreateExecuteStatementCommand
	#client: DataAPIClient | undefined

	constructor(config: Required<RDSDataAPIPostgresDialectConfig>) {
		this.#createClient = config.createClient
		this.#typeMapper = config.typeMapper
		this.#executeStatementCommand = config.executeStatementCommand
	}

	async init(_options?: AbortableOperationOptions): Promise<void> {
		this.#client = await this.#createClient()
	}

	async acquireConnection(
		_options?: AbortableOperationOptions,
	): Promise<DatabaseConnection> {
		if (!this.#client) {
			throw new Error('Driver not initialised')
		}

		return new RDSDataAPIDatabaseConnection({
			client: this.#client,
			typeMapper: this.#typeMapper,
			executeStatementCommand: this.#executeStatementCommand,
		})
	}

	beginTransaction(
		_connection: DatabaseConnection,
		_settings: TransactionSettings,
	): Promise<void> {
		throw new Error('Method not implemented.')
	}

	commitTransaction(_connection: DatabaseConnection): Promise<void> {
		throw new Error('Method not implemented.')
	}

	rollbackTransaction(_connection: DatabaseConnection): Promise<void> {
		throw new Error('Method not implemented.')
	}

	savepoint?(
		_connection: DatabaseConnection,
		_savepointName: string,
		_compileQuery: QueryCompiler['compileQuery'],
	): Promise<void> {
		throw new Error('Method not implemented.')
	}

	rollbackToSavepoint?(
		_connection: DatabaseConnection,
		_savepointName: string,
		_compileQuery: QueryCompiler['compileQuery'],
	): Promise<void> {
		throw new Error('Method not implemented.')
	}

	releaseSavepoint?(
		_connection: DatabaseConnection,
		_savepointName: string,
		_compileQuery: QueryCompiler['compileQuery'],
	): Promise<void> {
		throw new Error('Method not implemented.')
	}

	async releaseConnection(
		_connection: DatabaseConnection,
		_options?: AbortableOperationOptions,
	): Promise<void> {
		// noop - not a persistent connection
	}

	async destroy(_options?: AbortableOperationOptions): Promise<void> {
		this.#client?.destroy()
	}
}
