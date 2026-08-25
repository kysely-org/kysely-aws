import { PostgresQueryCompiler } from 'kysely'

export class RDSDataAPIPostgresQueryCompiler extends PostgresQueryCompiler {
	/*
	 * RDS Data API does not support $1, $2 etc. and throws a ValidationException:
	 * > `ValidationException: Named parameter syntax is invalid, input: $1`
	 *
	 * Parameters are named `p1`, `p2` etc. rather than `1`, `2` since some local
	 * emulators (e.g. Floci) only accept identifier-like placeholder names.
	 */
	override getCurrentParameterPlaceholder(): string {
		return `:${parameterName(this.numParameters)}`
	}
}

export function parameterName(index: number): string {
	return `p${index}`
}
