import {
	ExecuteStatementCommand,
	RDSDataClient,
} from '@aws-sdk/client-rds-data'
import { faker } from '@faker-js/faker'
import { type Generated, Kysely, sql } from 'kysely'
import { expect } from 'vitest'
import { RDSDataAPIPostgresDialect } from '../src/rds-data-api/postgres-dialect'
import { getMigrationConfig } from './env'

type Person = {
	first_name: string
	last_name: string | null
	gender: string
}

type Pet = {
	name: string
	owner_id: number
	species: string
}
type Database = {
	person: {
		id: Generated<number>
		created_at: Generated<Date | string>
	} & Person
	pet: {
		id: Generated<number>
	} & Pet
	empty_table: {
		id: Generated<number>
		name: string | null
	}
}

const migrationConfig = getMigrationConfig()
const client = new RDSDataClient({ region: migrationConfig.region })

const connection = {
	resourceArn: migrationConfig.clusterArn,
	secretArn: migrationConfig.secretArn,
	database: migrationConfig.databaseName,
}
const db = new Kysely<Database>({
	dialect: new RDSDataAPIPostgresDialect({
		createClient: () => client,
		connection,
		executeStatementCommand: (input) => new ExecuteStatementCommand(input),
	}),
})

const generatePerson = (overrides?: Partial<Person>): Person => ({
	first_name: faker.person.firstName(),
	last_name: faker.helpers.maybe(() => faker.person.lastName()) ?? null,
	gender: faker.person.gender(),
	...overrides,
})

const seedPerson = async (person: Person) => {
	return db
		.insertInto('person')
		.values(person)
		.returningAll()
		.executeTakeFirstOrThrow()
}

const generatePet = (overrides: Partial<Pet> & Pick<Pet, 'owner_id'>): Pet => ({
	name: faker.animal.petName(),
	species: faker.animal.type(),
	...overrides,
})

const seedPet = async (pet: Pet) => {
	return db
		.insertInto('pet')
		.values(pet)
		.returningAll()
		.executeTakeFirstOrThrow()
}

describe('Smoke tests', () => {
	describe('Basic connection and schemaless statements', () => {
		it('Should SELECT 1', async () => {
			const {
				rows: [row, ...moreRows],
			} = await sql<{
				one: number
			}>`SELECT 1 AS one`.execute(db)

			expect(row?.one).toBe(1)
			expect(moreRows).toHaveLength(0)
		})

		it('Should SELECT now()', async () => {
			const {
				rows: [row, ...moreRows],
			} = await sql<{
				now: Date | string
			}>`SELECT now() AS now`.execute(db)

			expect(row?.now).toBeTruthy()
			expect(moreRows).toHaveLength(0)
		})
	})

	describe('CRUD', () => {
		it('Should INSERT a single row', async () => {
			const uniqueName = faker.string.uuid()
			const person = generatePerson({ first_name: uniqueName })

			const result = await db
				.insertInto('person')
				.values(person)
				.executeTakeFirst()
			expect(result.numInsertedOrUpdatedRows).toBe(1n)

			const commandOutput = await client.send(
				new ExecuteStatementCommand({
					...connection,
					sql: `
				  SELECT id, first_name, last_name, gender
				  FROM person
				  WHERE first_name = :first_name
				`,
					parameters: [
						{ name: 'first_name', value: { stringValue: uniqueName } },
					],
				}),
			)
			const row = commandOutput.records?.[0] ?? []
			const persistedPerson = {
				id: row[0]?.longValue,
				first_name: row[1]?.stringValue,
				last_name: row[2]?.isNull ? null : row[2]?.stringValue,
				gender: row[3]?.stringValue,
			}
			expect(persistedPerson).toEqual({
				...person,
				id: expect.any(Number),
			})
		})

		it('Should INSERT multiple rows', async () => {
			// Two inserts with unique firstnames - to simplify assertion
			const person1 = generatePerson({ first_name: faker.string.uuid() })
			const person2 = generatePerson({ first_name: faker.string.uuid() })

			const result = await db
				.insertInto('person')
				.values([person1, person2])
				.executeTakeFirst()
			expect(result.numInsertedOrUpdatedRows).toBe(2n)

			const commandOutput = await client.send(
				new ExecuteStatementCommand({
					...connection,
					sql: `
				  SELECT id, first_name, last_name, gender
				  FROM person
				  WHERE first_name = :p1_name
				     OR first_name = :p2_name
				`,
					parameters: [
						{ name: 'p1_name', value: { stringValue: person1.first_name } },
						{ name: 'p2_name', value: { stringValue: person2.first_name } },
					],
				}),
			)
			const persistedPeople = (commandOutput.records ?? []).map((row) => ({
				id: row[0]?.longValue,
				first_name: row[1]?.stringValue,
				last_name: row[2]?.isNull ? null : row[2]?.stringValue,
				gender: row[3]?.stringValue,
			}))
			const persistedPerson1 = persistedPeople.find(
				(p) => p.first_name === person1.first_name,
			)
			const persistedPerson2 = persistedPeople.find(
				(p) => p.first_name === person2.first_name,
			)
			expect(persistedPerson1).toEqual({ ...person1, id: expect.any(Number) })
			expect(persistedPerson2).toEqual({ ...person2, id: expect.any(Number) })
		})

		it('Should SELECT all rows', async () => {
			await seedPerson(generatePerson())

			const rows = await db.selectFrom('person').selectAll().execute()

			expect(rows.length).toBeGreaterThan(0)
		})

		it('Should SELECT inserted row', async () => {
			const person = generatePerson()
			const { id } = await seedPerson(person)

			const [row, ...moreRows] = await db
				.selectFrom('person')
				.selectAll()
				.where('id', '=', id)
				.execute()

			expect(row).toMatchObject(person)
			expect(row).toHaveProperty('id')
			expect(row).toHaveProperty('created_at')
			expect(moreRows).toHaveLength(0)
		})

		it('Should SELECT a subset of columns', async () => {
			const person = generatePerson()
			const { id } = await seedPerson(person)

			const [row, ...moreRows] = await db
				.selectFrom('person')
				.select(['first_name', 'gender'])
				.where('id', '=', id)
				.execute()

			expect(moreRows).toHaveLength(0)
			expect(row).toEqual({
				first_name: person.first_name,
				gender: person.gender,
			})
			expect(row).not.toHaveProperty('id')
			expect(row).not.toHaveProperty('last_name')
			expect(row).not.toHaveProperty('created_at')
		})

		it('Should SELECT zero rows from empty table', async () => {
			const rows = await db.selectFrom('empty_table').selectAll().execute()

			expect(rows).toHaveLength(0)
		})

		it('Should filter WHERE equal', async () => {
			const first_name = faker.string.uuid()
			const { id: id1 } = await seedPerson(generatePerson({ first_name }))
			const { id: id2 } = await seedPerson(generatePerson({ first_name }))

			const rows = await db
				.selectFrom('person')
				.select('id')
				.where('first_name', '=', first_name)
				.execute()

			expect(rows).toHaveLength(2)
			expect(rows.some((row) => row.id === id1)).toBe(true)
			expect(rows.some((row) => row.id === id2)).toBe(true)
		})

		it('Should filter WHERE IS NULL', async () => {
			const { id: nullLastNameId } = await seedPerson(
				generatePerson({ last_name: null }),
			)
			const { id: setLastNameId } = await seedPerson(
				generatePerson({ last_name: faker.person.lastName() }),
			)

			const rows = await db
				.selectFrom('person')
				.select('id')
				.where('last_name', 'is', null)
				.execute()

			expect(rows.some((row) => row.id === nullLastNameId)).toBe(true)
			expect(rows.some((row) => row.id === setLastNameId)).toBe(false)
		})

		it('Should filter WHERE IS NOT NULL', async () => {
			const { id: nullLastNameId } = await seedPerson(
				generatePerson({ last_name: null }),
			)
			const { id: setLastNameId } = await seedPerson(
				generatePerson({ last_name: faker.person.lastName() }),
			)

			const rows = await db
				.selectFrom('person')
				.select('id')
				.where('last_name', 'is not', null)
				.execute()

			expect(rows.some((row) => row.id === nullLastNameId)).toBe(false)
			expect(rows.some((row) => row.id === setLastNameId)).toBe(true)
		})

		it('Should filter WHERE LIKE', async () => {
			const { id: hannahId } = await seedPerson(
				generatePerson({ first_name: 'Hannah' }),
			)
			const { id: ianId } = await seedPerson(
				generatePerson({ first_name: 'Ian' }),
			)

			const rows = await db
				.selectFrom('person')
				.select('id')
				.where('first_name', 'like', 'Han%')
				.execute()

			expect(rows.some((row) => row.id === hannahId)).toBe(true)
			expect(rows.some((row) => row.id === ianId)).toBe(false)
		})

		it('Should filter WHERE IN', async () => {
			const inclusiveName1 = faker.string.uuid()
			const inclusiveName2 = faker.string.uuid()
			const exclusiveName = faker.string.uuid()
			const { id: expectedId1 } = await seedPerson(
				generatePerson({ first_name: inclusiveName1 }),
			)
			const { id: expectedId2 } = await seedPerson(
				generatePerson({ first_name: inclusiveName2 }),
			)
			const { id: excludedId } = await seedPerson(
				generatePerson({ first_name: exclusiveName }),
			)

			const rows = await db
				.selectFrom('person')
				.select('id')
				.where('first_name', 'in', [inclusiveName1, inclusiveName2])
				.execute()

			expect(rows.some((row) => row.id === expectedId1)).toBe(true)
			expect(rows.some((row) => row.id === expectedId2)).toBe(true)
			expect(rows.some((row) => row.id === excludedId)).toBe(false)
		})

		it('Should LIMIT and OFFSET', async () => {
			const firstName = faker.string.alpha(20)
			await seedPerson(
				generatePerson({ first_name: `${firstName}A`, last_name: 'last' }),
			)
			await seedPerson(
				generatePerson({ first_name: `${firstName}B`, last_name: 'last' }),
			)
			await seedPerson(
				generatePerson({ first_name: `${firstName}C`, last_name: 'last' }),
			)

			const [first, second, ...more] = await db
				.selectFrom('person')
				.select('first_name')
				.where('first_name', 'like', `${firstName}%`)
				.orderBy('first_name')
				.limit(2)
				.offset(1)
				.execute()

			expect(more).toHaveLength(0)
			expect(first?.first_name).toBe(`${firstName}B`)
			expect(second?.first_name).toBe(`${firstName}C`)
		})

		it('Should ORDER results', async () => {
			const { id: zId } = await seedPerson(
				generatePerson({ first_name: 'ZZZZZZZZZZ' }),
			)
			const { id: aId } = await seedPerson(
				generatePerson({ first_name: 'AAAAAAAAAA' }),
			)

			const [first, last] = await db
				.selectFrom('person')
				.select('first_name')
				.where('id', 'in', [zId, aId])
				.orderBy('first_name', 'asc')
				.execute()

			expect(first?.first_name).toBe('AAAAAAAAAA')
			expect(last?.first_name).toBe('ZZZZZZZZZZ')
		})

		it('Should UPDATE', async () => {
			const person = generatePerson({
				first_name: 'UpdateMe',
				last_name: 'UpdateMe',
				gender: 'UpdateMe',
			})
			const { id } = await seedPerson(person)

			const result = await db
				.updateTable('person')
				.set({ last_name: 'Updated' })
				.where('id', '=', id)
				.executeTakeFirst()

			expect(result.numUpdatedRows).toBe(1n)

			const updated = await db
				.selectFrom('person')
				.select('last_name')
				.where('id', '=', id)
				.executeTakeFirst()

			expect(updated?.last_name).toBe('Updated')
		})

		it('Should not UPDATE with non-matching WHERE clause', async () => {
			const person = generatePerson({
				first_name: 'UpdateMe',
				last_name: 'UpdateMe',
				gender: 'UpdateMe',
			})
			const { id } = await seedPerson(person)

			const result = await db
				.updateTable('person')
				.set({ last_name: 'Updated' })
				.where('id', '=', id)
				.where('first_name', '=', `${faker.string.uuid()}`)
				.executeTakeFirst()

			expect(result.numUpdatedRows).toBe(0n)

			const updated = await db
				.selectFrom('person')
				.select('last_name')
				.where('id', '=', id)
				.executeTakeFirst()

			expect(updated?.last_name).toBe('UpdateMe')
		})

		it('Should DELETE', async () => {
			const { id } = await seedPerson(generatePerson())

			const result = await db
				.deleteFrom('person')
				.where('id', '=', id)
				.executeTakeFirst()

			expect(result.numDeletedRows).toBe(1n)

			const gone = await db
				.selectFrom('person')
				.select('id')
				.where('id', '=', id)
				.execute()

			expect(gone).toHaveLength(0)
		})

		it('Should not DELETE with non-matching WHERE clause', async () => {
			const { id } = await seedPerson(generatePerson())

			const result = await db
				.deleteFrom('person')
				.where('id', '=', id)
				.where('first_name', '=', `${faker.string.uuid()}`)
				.executeTakeFirst()

			expect(result.numDeletedRows).toBe(0n)

			const notGone = await db
				.selectFrom('person')
				.select('id')
				.where('id', '=', id)
				.execute()

			expect(notGone).toHaveLength(1)
		})

		it('Should COUNT and aggregate', async () => {
			const aggregationToken = faker.string.uuid()
			await seedPerson(generatePerson({ first_name: aggregationToken }))
			const { id: lastInsertId } = await seedPerson(
				generatePerson({ first_name: aggregationToken }),
			)

			const result = await db
				.selectFrom('person')
				.select([
					db.fn.count<number>('id').as('count'),
					db.fn.max<number>('id').as('max_id'),
				])
				.where('first_name', '=', aggregationToken)
				.executeTakeFirstOrThrow()

			expect(result.count).toBe(2)
			expect(result.max_id).toBeGreaterThanOrEqual(lastInsertId)
		})
	})

	describe('joins', () => {
		it('Should INNER JOIN pet to person', async () => {
			const person = await seedPerson(generatePerson())
			const pet = await seedPet(
				generatePet({ owner_id: person.id, species: 'dog' }),
			)

			const [row, ...moreRows] = await db
				.selectFrom('pet')
				.innerJoin('person', 'pet.owner_id', 'person.id')
				.select(['pet.name', 'person.first_name'])
				.where('person.id', '=', person.id)
				.execute()

			expect(moreRows).toHaveLength(0)
			expect(row).toEqual({
				name: pet.name,
				first_name: person.first_name,
			})
		})

		it('Should LEFT JOIN include people without pets', async () => {
			const withPet = await seedPerson(generatePerson())
			const pet = await seedPet(
				generatePet({ owner_id: withPet.id, species: 'cat' }),
			)
			const withoutPet = await seedPerson(generatePerson())

			const rows = await db
				.selectFrom('person')
				.leftJoin('pet', 'pet.owner_id', 'person.id')
				.select(['person.id', 'pet.name'])
				.where('person.id', 'in', [withPet.id, withoutPet.id])
				.orderBy('person.first_name')
				.execute()

			expect(rows).toHaveLength(2)
			expect(
				rows.some((row) => row.id === withoutPet.id && row.name === null),
			).toBe(true)
			expect(
				rows.some((row) => row.id === withPet.id && row.name === pet.name),
			).toBe(true)
		})
	})

	describe('RETURNING', () => {
		it('Should RETURNING specific columns on INSERT', async () => {
			const person = generatePerson()
			const [row, ...moreRows] = await db
				.insertInto('person')
				.values(person)
				.returning(['id', 'first_name'])
				.execute()

			expect(moreRows).toHaveLength(0)
			expect(row?.id).toBeGreaterThan(0)
			expect(row?.first_name).toBe(person.first_name)
			expect(row).not.toHaveProperty('last_name')
			expect(row).not.toHaveProperty('created_at')
		})

		it('Should RETURNING all columns on INSERT', async () => {
			const person = generatePerson()
			const [row, ...moreRows] = await db
				.insertInto('person')
				.values(person)
				.returningAll()
				.execute()

			expect(moreRows).toHaveLength(0)
			expect(row).toMatchObject(person)
			expect(row).toHaveProperty('id')
			expect(row).toHaveProperty('created_at')
		})

		it('Should RETURNING changed rows on UPDATE', async () => {
			const { id } = await seedPerson(generatePerson())

			const [row, ...moreRows] = await db
				.updateTable('person')
				.set({ last_name: 'Updated' })
				.where('id', '=', id)
				.returningAll()
				.execute()

			expect(moreRows).toHaveLength(0)
			expect(row?.id).toBe(id)
			expect(row?.last_name).toBe('Updated')
		})

		it('Should RETURNING deleted rows on DELETE', async () => {
			const { id } = await seedPerson(generatePerson())

			const [row, ...moreRows] = await db
				.deleteFrom('person')
				.where('id', '=', id)
				.returningAll()
				.execute()

			expect(moreRows).toHaveLength(0)
			expect(row?.id).toBe(id)
		})
	})

	describe('raw sql', () => {
		it('Should execute a sql template tag query with a parameter', async () => {
			const person = await seedPerson(generatePerson())

			const {
				rows: [row, ...moreRows],
			} = await sql<{ id: number }>`
				SELECT id
				FROM person
				WHERE first_name = ${person.first_name}
			`.execute(db)

			expect(moreRows).toHaveLength(0)
			expect(row?.id).toBe(person.id)
		})

		it('Should use sql.ref for dynamic references', async () => {
			const person = await seedPerson(generatePerson())

			const column = sql.ref('first_name')
			const table = sql.ref('person')

			const {
				rows: [row, ...moreRows],
			} = await sql<{ first_name: string }>`
				SELECT ${column}
				FROM ${table}
				WHERE id = ${person.id}
			`.execute(db)

			expect(moreRows).toHaveLength(0)
			expect(row?.first_name).toBe(person.first_name)
		})

		it('Should append a raw WHERE fragment to a query builder query', async () => {
			const person = await seedPerson(generatePerson())

			const [row, ...moreRows] = await db
				.selectFrom('person')
				.select('first_name')
				.where(sql<boolean>`id = ${person.id}`)
				.execute()

			expect(moreRows).toHaveLength(0)
			expect(row?.first_name).toBe(person.first_name)
		})
	})
})
