import type {
	AbortableOperationOptions,
	DatabaseConnection,
	Driver,
	QueryCompiler,
	TransactionSettings,
} from 'kysely'
import { RdsDataApiDatabaseConnection } from './DatabaseConnection'

export class RdsDataApiDriver implements Driver {
	init(_options?: AbortableOperationOptions): Promise<void> {
		return Promise.resolve()
	}

	acquireConnection(
		_options?: AbortableOperationOptions,
	): Promise<DatabaseConnection> {
		return Promise.resolve(new RdsDataApiDatabaseConnection())
	}

	beginTransaction(
		_connection: DatabaseConnection,
		_settings: TransactionSettings,
	): Promise<void> {
		return Promise.resolve()
	}

	commitTransaction(_connection: DatabaseConnection): Promise<void> {
		return Promise.resolve()
	}

	rollbackTransaction(_connection: DatabaseConnection): Promise<void> {
		return Promise.resolve()
	}

	savepoint?(
		_connection: DatabaseConnection,
		_savepointName: string,
		_compileQuery: QueryCompiler['compileQuery'],
	): Promise<void> {
		return Promise.resolve()
	}

	rollbackToSavepoint?(
		_connection: DatabaseConnection,
		_savepointName: string,
		_compileQuery: QueryCompiler['compileQuery'],
	): Promise<void> {
		return Promise.resolve()
	}

	releaseSavepoint?(
		_connection: DatabaseConnection,
		_savepointName: string,
		_compileQuery: QueryCompiler['compileQuery'],
	): Promise<void> {
		return Promise.resolve()
	}

	releaseConnection(
		_connection: DatabaseConnection,
		_options?: AbortableOperationOptions,
	): Promise<void> {
		return Promise.resolve()
	}

	destroy(_options?: AbortableOperationOptions): Promise<void> {
		return Promise.resolve()
	}
}
