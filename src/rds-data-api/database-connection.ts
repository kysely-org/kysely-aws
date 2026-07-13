import type {
	AbortableOperationOptions,
	CompiledQuery,
	ControlConnectionProvider,
	DatabaseConnection,
	QueryResult,
} from 'kysely'

export class RDSDataAPIDatabaseConnection implements DatabaseConnection {
	cancelQuery?(
		_controlConnectionProvider: ControlConnectionProvider,
	): Promise<void> {
		throw new Error('Method not implemented.')
	}

	collectSessionInfo?(): Promise<void> {
		throw new Error('Method not implemented.')
	}

	executeQuery<R>(
		_compiledQuery: CompiledQuery,
		_options?: AbortableOperationOptions,
	): Promise<QueryResult<R>> {
		throw new Error('Method not implemented.')
	}

	killSession?(
		_controlConnectionProvider: ControlConnectionProvider,
	): Promise<void> {
		throw new Error('Method not implemented.')
	}

	streamQuery<R>(
		_compiledQuery: CompiledQuery,
		_chunkSize: number,
		_options?: AbortableOperationOptions,
	): AsyncIterableIterator<QueryResult<R>> {
		throw new Error('Method not implemented.')
	}
}
