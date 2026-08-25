import { ExecuteStatementCommand } from '@aws-sdk/client-rds-data'
import { createTestClient } from './client'
import type { MigrationConfig } from './env'

const statements = [
	'DROP TABLE IF EXISTS pet CASCADE',
	'DROP TABLE IF EXISTS person CASCADE',
	'DROP TABLE IF EXISTS empty_table CASCADE',
	`CREATE TABLE person (
		id          serial PRIMARY KEY,
		first_name  varchar NOT NULL,
		last_name   varchar,
		gender      varchar(50) NOT NULL,
		created_at  timestamp DEFAULT now() NOT NULL
	)`,
	`CREATE TABLE pet (
		id        serial PRIMARY KEY,
		name      varchar NOT NULL UNIQUE,
		owner_id  integer NOT NULL REFERENCES person(id) ON DELETE CASCADE,
		species   varchar NOT NULL
	)`,
	'CREATE INDEX pet_owner_id_index ON pet(owner_id)',
	`CREATE TABLE empty_table (
		id   serial PRIMARY KEY,
		name varchar
	)`,
]

function isDatabaseResumingError(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'name' in error &&
		error.name === 'DatabaseResumingException'
	)
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForDb(
	client: RDSDataClient,
	config: MigrationConfig,
): Promise<void> {
	const MAX_RETRY_ATTEMPTS = 6
	const DELAY_MS = 10000

	let attempt = 0

	while (true) {
		try {
			return void (await client.send(
				new ExecuteStatementCommand({
					resourceArn: config.clusterArn,
					secretArn: config.secretArn,
					database: config.databaseName,
					sql: 'SELECT 1',
				}),
			))
		} catch (error) {
			attempt++

			if (attempt > MAX_RETRY_ATTEMPTS || !isDatabaseResumingError(error)) {
				throw error
			}

			await sleep(DELAY_MS)
		}
	}
}

export async function migrate(config: MigrationConfig): Promise<void> {
	const client = createTestClient(config.region)

	try {
		await waitForDb(client, config)

		for (const sql of statements) {
			await client.send(
				new ExecuteStatementCommand({
					resourceArn: config.clusterArn,
					secretArn: config.secretArn,
					database: config.databaseName,
					sql,
				}),
			)
		}
	} finally {
		client.destroy()
	}
}
