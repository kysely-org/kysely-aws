import { PostgresQueryCompiler } from 'kysely'
import type { RDSDataAPITypeMapper } from './type-mapper'

export class RDSDataAPIPostgresQueryCompiler extends PostgresQueryCompiler {
	readonly #typeMapper: RDSDataAPITypeMapper

	constructor(typeMapper: RDSDataAPITypeMapper) {
		super()

		this.#typeMapper = typeMapper
	}

	/*
	 * RDS Data API does not support $1, $2 etc. and throws a ValidationException:
	 * > `ValidationException: Named parameter syntax is invalid, input: $1`
	 */
	override getCurrentParameterPlaceholder(): string {
		return `:p${this.numParameters}`
	}

	protected override addParameter(parameter: unknown): void {
		super.addParameter({
			name: `p${this.numParameters + 1}`,
			...this.#typeMapper.mapQueryParameter(parameter),
		})
	}
}
