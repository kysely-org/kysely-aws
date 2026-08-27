import type {
	AbortableOperationOptions,
	CompiledQuery,
	DatabaseConnection,
	Driver,
	QueryCompiler,
	QueryResult,
	TransactionSettings,
} from 'kysely'
import type { ClientFactory, RDSDataAPIPostgresDialectConfig } from './config'
import type {
	CreateExecuteStatementCommand,
	DataAPIClient,
	DataAPIColumnMetadata,
	DataAPIExecuteResult,
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

const resultSetOptions = {
	decimalReturnType: 'STRING' as const,
	longReturnType: 'LONG' as const,
}

class RDSDataAPIDatabaseConnection implements DatabaseConnection {
	readonly #client: DataAPIClient
	readonly #typeMapper: RDSDataAPITypeMapper
	readonly #executeStatementCommand: CreateExecuteStatementCommand

	constructor(props: {
		client: DataAPIClient
		typeMapper: RDSDataAPITypeMapper
		executeStatementCommand: CreateExecuteStatementCommand
	}) {
		this.#client = props.client
		this.#typeMapper = props.typeMapper
		this.#executeStatementCommand = props.executeStatementCommand
	}

	async executeQuery<R>(
		compiledQuery: CompiledQuery,
		_options?: AbortableOperationOptions,
	): Promise<QueryResult<R>> {
		const parameters = compiledQuery.parameters.map((value, index) => ({
			name: `${index + 1}`,
			...this.#typeMapper.mapQueryParameter(value),
		}))

		const response = await this.#client.send(
			this.#executeStatementCommand({
				sql: compiledQuery.sql,
				parameters,
				includeResultMetadata: true,
				resultSetOptions,
			}),
		)

		return {
			rows: this.#getRows<R>(response),
			...(response.numberOfRecordsUpdated !== undefined
				? { numAffectedRows: BigInt(response.numberOfRecordsUpdated) }
				: {}),
		}
	}

	streamQuery<R>(
		_compiledQuery: CompiledQuery,
		_chunkSize: number,
		_options?: AbortableOperationOptions,
	): AsyncIterableIterator<QueryResult<R>> {
		throw new Error('Method not implemented.')
	}

	#getColumnNames(columnMetadata: DataAPIColumnMetadata[]) {
		return columnMetadata.map((metadata, i) => {
			if (!metadata?.name) {
				throw new Error(`Missing column metadata name for column ${i}`)
			}
			return metadata.name
		})
	}

	#getRows<R>(executeResult: DataAPIExecuteResult) {
		const columnNames = this.#getColumnNames(executeResult.columnMetadata ?? [])
		const records = executeResult.records
		const rows: R[] = []
		for (const record of records ?? []) {
			const row: Record<string, unknown> = {}
			for (const [i, field] of record.entries()) {
				// Intentionally "dangerous" coercions here to avoid re-testing the
				// validity of column metadata per row per column in the result set. It
				// is only actually dangerous if the RDS Data api starts to perform some
				// wildly inconsistent behaviours (not returning one metadata per column
				// or returning variable amounts of columns per row).
				row[columnNames[i] as string] = this.#typeMapper.mapResponseField(
					field,
					executeResult.columnMetadata?.[i],
				)
			}

			rows.push(row as R)
		}

		return rows
	}
}
