import { PostgresQueryCompiler } from 'kysely'

export class RDSDataAPIPostgresQueryCompiler extends PostgresQueryCompiler {
	/*
	 * RDS Data API does not support $1, $2 etc. and throws a ValidationException:
	 * > `ValidationException: Named parameter syntax is invalid, input: $1`
	 */
	override getCurrentParameterPlaceholder(): string {
		return `:${this.numParameters}`
	}
}
