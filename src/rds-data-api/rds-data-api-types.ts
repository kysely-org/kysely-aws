export type RDSDataAPIExecuteResult = {
	records?: RDSDataAPIField[][]
	columnMetadata?: RDSDataAPIColumnMetadata[]
	numberOfRecordsUpdated: number
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
}

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
