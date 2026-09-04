import type {
	AbortableOperationOptions,
	CompiledQuery,
	DatabaseConnection,
	Driver,
	QueryResult,
} from 'kysely'
import type { RDSDataAPIPostgresDialectConfig } from './config'
import type {
	CreateBeginTransactionCommand,
	CreateCommitTransactionCommand,
	CreateExecuteStatementCommand,
	CreateRollbackTransactionCommand,
	RDSDataAPIClient,
	RDSDataAPIColumnMetadata,
	RDSDataAPIExecuteResult,
	RDSDataAPISqlParameter,
} from './rds-data-api-types'
import type { RDSDataAPITypeMapper } from './type-mapper'

export class RDSDataAPIDriver implements Driver {
	readonly #config: Required<RDSDataAPIPostgresDialectConfig>
	#client: RDSDataAPIClient | undefined

	constructor(config: Required<RDSDataAPIPostgresDialectConfig>) {
		this.#config = config
	}

	async init(options?: AbortableOperationOptions): Promise<void> {
		this.#client =
			typeof this.#config.client === 'function'
				? await this.#config.client(options)
				: this.#config.client
	}

	async acquireConnection(): Promise<DatabaseConnection> {
		if (!this.#client) {
			throw new Error('Driver not initialised')
		}

		return new RDSDataAPIDatabaseConnection({
			...this.#config,
			client: this.#client,
		})
	}

	async beginTransaction(
		connection: RDSDataAPIDatabaseConnection,
	): Promise<void> {
		await connection.beginTransaction()
	}

	async commitTransaction(
		connection: RDSDataAPIDatabaseConnection,
	): Promise<void> {
		await connection.commitTransaction()
	}

	async rollbackTransaction(
		connection: RDSDataAPIDatabaseConnection,
	): Promise<void> {
		await connection.rollbackTransaction()
	}

	savepoint(): Promise<void> {
		throw new Error('Method not implemented.')
	}

	rollbackToSavepoint(): Promise<void> {
		throw new Error('Method not implemented.')
	}

	releaseSavepoint(): Promise<void> {
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
	decimalReturnType: 'STRING',
	longReturnType: 'LONG',
} as const

type DatabaseConnectionConfig = {
	client: RDSDataAPIClient
	typeMapper: RDSDataAPITypeMapper
	executeStatementCommand: CreateExecuteStatementCommand
	beginTransactionCommand: CreateBeginTransactionCommand
	commitTransactionCommand: CreateCommitTransactionCommand
	rollbackTransactionCommand: CreateRollbackTransactionCommand
}

class RDSDataAPIDatabaseConnection implements DatabaseConnection {
	readonly #config: DatabaseConnectionConfig
	#transactionId?: string

	constructor(config: DatabaseConnectionConfig) {
		this.#config = config
	}

	async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
		const response = await this.#config.client.send(
			this.#config.executeStatementCommand({
				sql: compiledQuery.sql,
				// compiledQuery.parameters are a `readonly unknown[]` - but we control them and can spread/coerce safely
				parameters: [...compiledQuery.parameters] as RDSDataAPISqlParameter[],
				includeResultMetadata: true,
				resultSetOptions,
				transactionId: this.#transactionId,
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

	#getRows<R>(executeResult: RDSDataAPIExecuteResult): R[] {
		const columnNames = this.#getColumnNames(executeResult.columnMetadata ?? [])
		const { records } = executeResult
		if (!records?.length || !columnNames.length) {
			return []
		}

		const rows: R[] = []
		for (const record of records) {
			const row: Record<string, unknown> = {}
			for (const [i, field] of record.entries()) {
				// Intentionally "dangerous" coercions here to avoid re-testing the
				// validity of column metadata per row per column in the result set. It
				// is only actually dangerous if the RDS Data api starts to perform some
				// wildly inconsistent behaviours (not returning one metadata per column
				// or returning variable amounts of columns per row).
				row[columnNames[i] as string] =
					this.#config.typeMapper.mapResponseField(
						field,
						executeResult.columnMetadata?.[i],
					)
			}

			rows.push(row as R)
		}

		return rows
	}

	async beginTransaction(): Promise<void> {
		const response = await this.#config.client.send(
			this.#config.beginTransactionCommand(),
		)

		if (!response.transactionId) {
			throw new Error('BeginTransaction did not return a transactionId')
		}

		this.#transactionId = response.transactionId
	}

	async commitTransaction(): Promise<void> {
		if (!this.#transactionId) {
			throw new Error('No transaction in progress - missing transactionId')
		}

		await this.#config.client.send(
			this.#config.commitTransactionCommand({
				transactionId: this.#transactionId,
			}),
		)

		this.#transactionId = undefined
	}

	async rollbackTransaction(): Promise<void> {
		if (!this.#transactionId) {
			throw new Error('No transaction in progress - missing transactionId')
		}

		await this.#config.client.send(
			this.#config.rollbackTransactionCommand({
				transactionId: this.#transactionId,
			}),
		)
		this.#transactionId = undefined
	}
}
