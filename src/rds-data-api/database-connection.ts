import {
	type ColumnMetadata,
	ExecuteStatementCommand,
	type RDSDataClient,
} from '@aws-sdk/client-rds-data'
import type {
	AbortableOperationOptions,
	CompiledQuery,
	DatabaseConnection,
	QueryResult,
} from 'kysely'
import { parameterName } from './postgres-query-compiler'
import type { RDSDataAPITypeMapper } from './type-mapper'

export type RDSDataAPIConnectionDetails = {
	resourceArn: string
	secretArn: string
	database: string
}

export class RDSDataAPIDatabaseConnection implements DatabaseConnection {
	readonly #client: RDSDataClient
	readonly #connection: RDSDataAPIConnectionDetails
	readonly #typeMapper: RDSDataAPITypeMapper

	constructor({
		client,
		connection,
		typeMapper,
	}: {
		client: RDSDataClient
		connection: RDSDataAPIConnectionDetails
		typeMapper: RDSDataAPITypeMapper
	}) {
		this.#client = client
		this.#connection = connection
		this.#typeMapper = typeMapper
	}

	async executeQuery<R>(
		compiledQuery: CompiledQuery,
		_options?: AbortableOperationOptions,
	): Promise<QueryResult<R>> {
		const parameters = compiledQuery.parameters.map((value, index) => ({
			name: parameterName(index + 1),
			...this.#typeMapper.mapQueryParameter(value),
		}))

		const response = await this.#client.send(
			new ExecuteStatementCommand({
				resourceArn: this.#connection.resourceArn,
				secretArn: this.#connection.secretArn,
				database: this.#connection.database,
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
					response.columnMetadata?.[i] as ColumnMetadata,
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
