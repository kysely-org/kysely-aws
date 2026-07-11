import {
	ExecuteStatementCommand,
	RDSDataClient,
} from '@aws-sdk/client-rds-data'
import type { MigrationConfig } from './env'

const statements = [
	'DROP TABLE IF EXISTS pet',
	'DROP TABLE IF EXISTS person',
	`CREATE TABLE IF NOT EXISTS person (
		id         BIGSERIAL NOT NULL PRIMARY KEY,
		first_name TEXT      NOT NULL,
		last_name  TEXT      NULL,
		age        NUMERIC   NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS pet (
		id       BIGSERIAL NOT NULL PRIMARY KEY,
		name     TEXT      NOT NULL,
		owner_id BIGINT    NOT NULL REFERENCES person(id),
		species  TEXT      NOT NULL CHECK (species IN ('dog', 'cat', 'hamster'))
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
			await client.send(
				new ExecuteStatementCommand({
					resourceArn: config.clusterArn,
					secretArn: config.secretArn,
					database: config.databaseName,
					sql: 'SELECT 1',
				}),
			)
			return
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
	const client = new RDSDataClient({ region: config.region })

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
