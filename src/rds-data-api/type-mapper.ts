import type {
	ColumnMetadata,
	Field,
	SqlParameter,
} from '@aws-sdk/client-rds-data'

export type RDSDataAPITypeMapper = {
	mapQueryParameter(value: unknown): SqlParameter
	mapResponseField(field: Field, columnMetadata?: ColumnMetadata): unknown
}

export class DefaultRDSDataAPITypeMapper implements RDSDataAPITypeMapper {
	mapQueryParameter = (value: unknown): SqlParameter => {
		if (typeof value === 'string') {
			return { value: { stringValue: value } }
		}

		if (typeof value === 'number') {
			// TODO - test and support double
			return { value: { longValue: value } }
		}

		if (value === undefined || value === null) {
			return { value: { isNull: true } }
		}

		throw new Error(`Unsupported parameter type ${typeof value}`)
	}

	mapResponseField = (field: Field, _columnMetadata: ColumnMetadata) => {
		if (field.stringValue !== undefined) {
			return field.stringValue
		}

		if (field.longValue !== undefined) {
			return field.longValue
		}

		if (field.isNull) {
			return null
		}

		throw new Error(`Unsupported field type ${JSON.stringify(field)}`)
	}
}
