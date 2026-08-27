export type DataAPIExecuteResult = {
	records?: DataAPIField[][]
	columnMetadata?: DataAPIColumnMetadata[]
	numberOfRecordsUpdated: number
}
export type DataAPIClient = {
	send(command: DataAPIExecuteStatementCommand): Promise<DataAPIExecuteResult>
	destroy(): void
}
export type CreateExecuteStatementCommand = (
	input: DataAPIExecuteStatementInput,
) => DataAPIExecuteStatementCommand

export type DataAPIExecuteStatementCommand = object
export type DataAPIExecuteStatementInput = {
	sql: string
	parameters: DataAPISqlParameter[]
	includeResultMetadata: true
	resultSetOptions: {
		decimalReturnType: 'STRING'
		longReturnType: 'LONG'
	}
}

export type DataAPISqlParameter = {
	value?: { stringValue: string } | { longValue: number } | { isNull: true }
}

export type DataAPIField = {
	isNull?: boolean
	longValue?: number
	stringValue?: string
}

export type DataAPIColumnMetadata = {
	name?: string | undefined
}
