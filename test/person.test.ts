// @ts-nocheck
// Temporary while PostgresDataApiDialect is still being stubbed out.

import { Kysely } from 'kysely'
import { PostgresDataApiDialect } from '../src/rds-data-api/PostgresDataApiDialect'

interface Database {
	person: {
		id: bigint
		first_name: string
		last_name: string | null
	}
}

const db = new Kysely<Database>({
	dialect: new PostgresDataApiDialect(),
})

describe('smoke tests', () => {
	it('should SELECT * FROM person', async () => {
		await db.selectFrom('person').selectAll().execute()
	})
})
