import type {
	AbortableOperationOptions,
	CompiledQuery,
	ControlConnectionProvider,
	DatabaseConnection,
	QueryResult,
} from 'kysely'

export class RdsDataApiDatabaseConnection implements DatabaseConnection {
	cancelQuery?(
		_controlConnectionProvider: ControlConnectionProvider,
	): Promise<void> {
		return Promise.resolve()
	}

	collectSessionInfo?(): Promise<void> {
		return Promise.resolve()
	}

	executeQuery<R>(
		_compiledQuery: CompiledQuery,
		_options?: AbortableOperationOptions,
	): Promise<QueryResult<R>> {
		return Promise.resolve({
			numAffectedRows: 0n,
			numChangedRows: 0n,
			insertId: 0n,
			rows: [],
		})
	}

	killSession?(
		_controlConnectionProvider: ControlConnectionProvider,
	): Promise<void> {
		return Promise.resolve()
	}

	streamQuery<R>(
		_compiledQuery: CompiledQuery,
		_chunkSize: number,
		_options?: AbortableOperationOptions,
	): AsyncIterableIterator<QueryResult<R>> {
		throw new Error('Method not implemented.')
	}
}
