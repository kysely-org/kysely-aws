import type {
	AbortableOperationOptions,
	DatabaseConnection,
	Driver,
	QueryCompiler,
	TransactionSettings,
} from 'kysely'
import type { ClientFactory, RDSDataAPIPostgresDialectConfig } from './config'
import { RDSDataAPIDatabaseConnection } from './database-connection'
import type {
	CreateExecuteStatementCommand,
	DataAPIClient,
} from './rds-data-api-types'
import type { RDSDataAPITypeMapper } from './type-mapper'

export class RDSDataAPIDriver implements Driver {
	readonly #configuredClient: DataAPIClient | ClientFactory
	readonly #typeMapper: RDSDataAPITypeMapper
	readonly #executeStatementCommand: CreateExecuteStatementCommand
	#client: DataAPIClient | undefined
	#connection: RDSDataAPIDatabaseConnection | undefined

	constructor(config: Required<RDSDataAPIPostgresDialectConfig>) {
		this.#configuredClient = config.client
		this.#typeMapper = config.typeMapper
		this.#executeStatementCommand = config.executeStatementCommand
	}

	async init(options?: AbortableOperationOptions): Promise<void> {
		this.#client =
			typeof this.#configuredClient === 'function'
				? await this.#configuredClient(options)
				: this.#configuredClient
	}

	async acquireConnection(
		_options?: AbortableOperationOptions,
	): Promise<DatabaseConnection> {
		if (!this.#client) {
			throw new Error('Driver not initialised')
		}

		return (this.#connection ??= new RDSDataAPIDatabaseConnection({
			client: this.#client,
			typeMapper: this.#typeMapper,
			executeStatementCommand: this.#executeStatementCommand,
		}))
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
