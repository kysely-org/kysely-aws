import type { AbortableOperationOptions } from 'kysely'
import type { RDSDataAPITypeMapper } from './type-mapper'

export type ClientFactory = (
	options?: AbortableOperationOptions,
) => RDSDataAPIClient | Promise<RDSDataAPIClient>

export type RDSDataAPIPostgresDialectConfig = {
	client: RDSDataAPIClient | ClientFactory
	typeMapper?: RDSDataAPITypeMapper
	executeStatementCommand: CreateExecuteStatementCommand
	beginTransactionCommand: CreateBeginTransactionCommand
	commitTransactionCommand: CreateCommitTransactionCommand
	rollbackTransactionCommand: CreateRollbackTransactionCommand
}

export type RDSDataAPIExecuteResult = {
	records?: RDSDataAPIField[][]
	columnMetadata?: RDSDataAPIColumnMetadata[]
	numberOfRecordsUpdated: number
	transactionId?: string
}

type SendableCommand =
	| RDSDataAPIExecuteStatementCommand
	| RDSDataAPIBeginTransactionCommand
	| RDSDataAPICommitTransactionCommand
	| RDSDataAPIRollbackTransactionCommand

export type RDSDataAPIClient = {
	send(command: SendableCommand): Promise<RDSDataAPIExecuteResult>
	destroy(): void
}

export type CreateExecuteStatementCommand = (
	input: RDSDataAPIExecuteStatementInput,
) => RDSDataAPIExecuteStatementCommand

export type RDSDataAPIExecuteStatementCommand = {
	input: {
		sql: string | undefined
		resourceArn: string | undefined
		secretArn: string | undefined
	}
}

export type RDSDataAPIExecuteStatementInput = {
	sql: string
	parameters?: RDSDataAPISqlParameter[]
	includeResultMetadata?: true
	resultSetOptions?: {
		decimalReturnType: 'STRING'
		longReturnType: 'LONG'
	}
	transactionId?: string
}

export type CreateBeginTransactionCommand =
	() => RDSDataAPIBeginTransactionCommand

export type RDSDataAPIBeginTransactionCommand = {
	input: {
		resourceArn: string | undefined
		secretArn: string | undefined
	}
}

export type CreateCommitTransactionCommand = (
	input: RDSDataAPICommitTransactionInput,
) => RDSDataAPICommitTransactionCommand

export type RDSDataAPICommitTransactionCommand = {
	input: {
		transactionId: string | undefined
		resourceArn: string | undefined
		secretArn: string | undefined
	}
}

export type RDSDataAPICommitTransactionInput = { transactionId: string }

export type CreateRollbackTransactionCommand = (
	input: RDSDataAPIRollbackTransactionInput,
) => RDSDataAPIRollbackTransactionCommand

export type RDSDataAPIRollbackTransactionCommand = {
	input: {
		transactionId: string | undefined
		resourceArn: string | undefined
		secretArn: string | undefined
	}
}

export type RDSDataAPIRollbackTransactionInput = { transactionId: string }

export type RDSDataAPISqlParameter = {
	value?: { stringValue: string } | { longValue: number } | { isNull: true }
}

export type RDSDataAPIField = {
	isNull?: boolean
	longValue?: number
	stringValue?: string
}

export type RDSDataAPIColumnMetadata = {
	name?: string | undefined
}
