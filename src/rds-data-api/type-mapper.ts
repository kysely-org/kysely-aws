import type {
	RDSDataAPIColumnMetadata,
	RDSDataAPIField,
	RDSDataAPISqlParameter,
} from './rds-data-api-types'

export type RDSDataAPITypeMapper = {
	mapQueryParameter(value: unknown): RDSDataAPISqlParameter
	mapResponseField(
		field: RDSDataAPIField,
		columnMetadata?: RDSDataAPIColumnMetadata,
	): unknown
}

export class DefaultRDSDataAPITypeMapper implements RDSDataAPITypeMapper {
	mapQueryParameter = (value: unknown): RDSDataAPISqlParameter => {
		if (typeof value === 'string') {
			return { value: { stringValue: value } }
		}

		if (typeof value === 'number') {
			// TODO - test and support double, NaN, Infinity
			return { value: { longValue: value } }
		}

		if (value === undefined || value === null) {
			return { value: { isNull: true } }
		}

		// TODO - Extend mapQueryParameter to handle more types
		throw new Error(`Unsupported parameter type ${typeof value}`)
	}

	mapResponseField = (
		field: RDSDataAPIField,
		columnMetadata: RDSDataAPIColumnMetadata,
	) => {
		if (field.stringValue !== undefined) {
			return field.stringValue
		}

		if (field.longValue !== undefined) {
			return field.longValue
		}

		if (field.isNull) {
			return null
		}

		// TODO - extend mapResponseField to handle more types
		throw new Error(`Unsupported field type for field ${columnMetadata.name}`)
	}
}
