import { type Generated, Kysely } from 'kysely'
import { PostgresDataApiDialect } from '../src/rds-data-api/PostgresDataApiDialect'

interface Database {
	person: {
		id: Generated<bigint>
		first_name: string
		last_name: string | null
		age: number
	}
}

const db = new Kysely<Database>({
	dialect: new PostgresDataApiDialect(),
})

describe('smoke tests', () => {
	it('should SELECT * FROM person', async () => {
		await db
			.insertInto('person')
			.values({
				first_name: 'First',
				last_name: 'Last',
				age: 20,
			})
			.execute()

		const results = await db.selectFrom('person').selectAll().execute()

		expect(results.length).toBeGreaterThan(0)
	})
})
