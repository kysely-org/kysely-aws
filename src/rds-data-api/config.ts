import type { AbortableOperationOptions } from 'kysely'
import type {
	CreateExecuteStatementCommand,
	DataAPIClient,
} from './rds-data-api-types'
import type { RDSDataAPITypeMapper } from './type-mapper'

export type ClientFactory = (
	options?: AbortableOperationOptions,
) => DataAPIClient | Promise<DataAPIClient>
export type RDSDataAPIPostgresDialectConfig = {
	client: DataAPIClient | ClientFactory
	typeMapper?: RDSDataAPITypeMapper
	executeStatementCommand: CreateExecuteStatementCommand
}
