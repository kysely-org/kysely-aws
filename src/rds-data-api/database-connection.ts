import type {
	AbortableOperationOptions,
	CompiledQuery,
	DatabaseConnection,
	QueryResult,
} from 'kysely'
import type {
	CreateExecuteStatementCommand,
	DataAPIClient,
} from './rds-data-api-types'
import type { RDSDataAPITypeMapper } from './type-mapper'

export class RDSDataAPIDatabaseConnection implements DatabaseConnection {
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
				resultSetOptions: {
					decimalReturnType: 'STRING',
					longReturnType: 'LONG',
				},
			}),
		)

		const columnNames = (response.columnMetadata ?? []).map((metadata, i) => {
			if (!metadata?.name) {
				throw new Error(`Missing column metadata name for column ${i}`)
			}
			return metadata.name
		})
		const records = response.records
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
					response.columnMetadata?.[i],
				)
			}

			rows.push(row as R)
		}

		return {
			rows,
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
}
