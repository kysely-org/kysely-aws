import type {
	CompiledQuery,
	QueryCompiler,
	QueryId,
	RootOperationNode,
} from 'kysely'

export class RdsDataApiQueryCompiler implements QueryCompiler {
	compileQuery(_node: RootOperationNode, _queryId: QueryId): CompiledQuery {
		return {
			query: { kind: 'SelectQueryNode' },
			parameters: [],
			queryId: { queryId: '' },
			sql: 'SELECT 1',
		}
	}
}
