import type {
	AbortableOperationOptions,
	DatabaseConnection,
	Driver,
	QueryCompiler,
	TransactionSettings,
} from 'kysely'
import { RdsDataApiDatabaseConnection } from './database-connection'

export class RdsDataApiDriver implements Driver {
	init(_options?: AbortableOperationOptions): Promise<void> {
		throw new Error('Method not implemented.')
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

	releaseConnection(
		_connection: DatabaseConnection,
		_options?: AbortableOperationOptions,
	): Promise<void> {
		throw new Error('Method not implemented.')
	}

	destroy(_options?: AbortableOperationOptions): Promise<void> {
		throw new Error('Method not implemented.')
	}
}
