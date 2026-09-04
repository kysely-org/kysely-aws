export type RDSDataAPIExecuteResult = {
	records?: RDSDataAPIField[][]
	columnMetadata?: RDSDataAPIColumnMetadata[]
	numberOfRecordsUpdated: number
	transactionId?: string
}

export type RDSDataAPIClient = {
	send(
		command: RDSDataAPIExecuteStatementCommand,
	): Promise<RDSDataAPIExecuteResult>
	destroy(): void
}

export type CreateExecuteStatementCommand = (
	input: RDSDataAPIExecuteStatementInput,
) => RDSDataAPIExecuteStatementCommand

export type RDSDataAPIExecuteStatementCommand = object

export type RDSDataAPIExecuteStatementInput = {
	sql: string
	parameters: RDSDataAPISqlParameter[]
	includeResultMetadata: true
	resultSetOptions: {
		decimalReturnType: 'STRING'
		longReturnType: 'LONG'
	}
	transactionId?: string
}

export type CreateBeginTransactionCommand =
	() => RDSDataAPIBeginTransactionCommand

export type RDSDataAPIBeginTransactionCommand = object

export type CreateCommitTransactionCommand = (
	input: RDSDataAPICommitTransactionInput,
) => RDSDataAPICommitTransactionCommand

export type RDSDataAPICommitTransactionCommand = object

export type RDSDataAPICommitTransactionInput = { transactionId: string }

export type CreateRollbackTransactionCommand = (
	input: RDSDataAPIRollbackTransactionInput,
) => RDSDataAPIRollbackTransactionCommand

export type RDSDataAPIRollbackTransactionCommand = object

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
