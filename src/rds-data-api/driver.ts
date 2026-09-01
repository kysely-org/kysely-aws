import type {
	AbortableOperationOptions,
	CompiledQuery,
	DatabaseConnection,
	Driver,
	QueryResult,
} from 'kysely'
import type { ClientFactory, RDSDataAPIPostgresDialectConfig } from './config'
import type {
	CreateExecuteStatementCommand,
	RDSDataAPIClient,
	RDSDataAPIColumnMetadata,
	RDSDataAPIExecuteResult,
	RDSDataAPISqlParameter,
} from './rds-data-api-types'
import type { RDSDataAPITypeMapper } from './type-mapper'

export class RDSDataAPIDriver implements Driver {
	readonly #configuredClient: RDSDataAPIClient | ClientFactory
	readonly #typeMapper: RDSDataAPITypeMapper
	readonly #executeStatementCommand: CreateExecuteStatementCommand
	#client: RDSDataAPIClient | undefined
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

	async acquireConnection(): Promise<DatabaseConnection> {
		if (!this.#client) {
			throw new Error('Driver not initialised')
		}

		return (this.#connection ??= new RDSDataAPIDatabaseConnection({
			client: this.#client,
			typeMapper: this.#typeMapper,
			executeStatementCommand: this.#executeStatementCommand,
		}))
	}

	beginTransaction(): Promise<void> {
		throw new Error('Method not implemented.')
	}

	commitTransaction(): Promise<void> {
		throw new Error('Method not implemented.')
	}

	rollbackTransaction(): Promise<void> {
		throw new Error('Method not implemented.')
	}

	savepoint?(): Promise<void> {
		throw new Error('Method not implemented.')
	}

	rollbackToSavepoint?(): Promise<void> {
		throw new Error('Method not implemented.')
	}

	releaseSavepoint?(): Promise<void> {
		throw new Error('Method not implemented.')
	}

	async releaseConnection(): Promise<void> {
		// noop - not a persistent connection
	}

	async destroy(): Promise<void> {
		this.#client?.destroy()
	}
}

const resultSetOptions = {
	decimalReturnType: 'STRING' as const,
	longReturnType: 'LONG' as const,
}

type DatabaseConnectionConfig = {
	client: RDSDataAPIClient
	typeMapper: RDSDataAPITypeMapper
	executeStatementCommand: CreateExecuteStatementCommand
}

class RDSDataAPIDatabaseConnection implements DatabaseConnection {
	readonly #client: RDSDataAPIClient
	readonly #typeMapper: RDSDataAPITypeMapper
	readonly #executeStatementCommand: CreateExecuteStatementCommand

	constructor(config: DatabaseConnectionConfig) {
		this.#client = config.client
		this.#typeMapper = config.typeMapper
		this.#executeStatementCommand = config.executeStatementCommand
	}

	async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
		const response = await this.#client.send(
			this.#executeStatementCommand({
				sql: compiledQuery.sql,
				// compiledQuery.parameters are a `readonly unknown[]` - but we control them and can spread/coerce safely
				parameters: [...compiledQuery.parameters] as RDSDataAPISqlParameter[],
				includeResultMetadata: true,
				resultSetOptions,
			}),
		)

		return {
			rows: this.#getRows<R>(response),
			numAffectedRows:
				response.numberOfRecordsUpdated !== null
					? BigInt(response.numberOfRecordsUpdated)
					: undefined,
		}
	}

	streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
		throw new Error('Method not implemented.')
	}

	#getColumnNames(columnMetadata: RDSDataAPIColumnMetadata[]) {
		return columnMetadata.map((metadata, i) => {
			if (metadata?.name == null) {
				throw new Error(`Missing column metadata name for column ${i}`)
			}
			return metadata.name
		})
	}

	#getRows<R>(executeResult: RDSDataAPIExecuteResult) {
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
