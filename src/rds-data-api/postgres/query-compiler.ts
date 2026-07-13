import type {
	CompiledQuery,
	QueryCompiler,
	QueryId,
	RootOperationNode,
} from 'kysely'

export class RdsDataApiQueryCompiler implements QueryCompiler {
	compileQuery(_node: RootOperationNode, _queryId: QueryId): CompiledQuery {
		throw new Error('Method not implemented.')
	}
}
