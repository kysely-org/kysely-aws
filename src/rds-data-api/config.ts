import type { AbortableOperationOptions } from 'kysely'
import type {
	CreateExecuteStatementCommand,
	RDSDataAPIClient,
} from './rds-data-api-types'
import type { RDSDataAPITypeMapper } from './type-mapper'

export type ClientFactory = (
	options?: AbortableOperationOptions,
) => RDSDataAPIClient | Promise<RDSDataAPIClient>
export type RDSDataAPIPostgresDialectConfig = {
	client: RDSDataAPIClient | ClientFactory
	typeMapper?: RDSDataAPITypeMapper
	executeStatementCommand: CreateExecuteStatementCommand
}
