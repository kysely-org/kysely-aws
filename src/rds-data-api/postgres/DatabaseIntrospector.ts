import type {
	DatabaseIntrospector,
	DatabaseMetadataOptions,
	SchemaMetadata,
	TableMetadata,
} from 'kysely'

export class RdsDataApiDatabaseIntrospector implements DatabaseIntrospector {
	getSchemas(): Promise<SchemaMetadata[]> {
		throw new Error('Method not implemented.')
	}

	getTables(_options?: DatabaseMetadataOptions): Promise<TableMetadata[]> {
		throw new Error('Method not implemented.')
	}
}
