import type { DialectAdapter, Kysely, MigrationLockOptions } from 'kysely'

export class RDSDataAPIDialectAdapter implements DialectAdapter {
	supportsCreateIfNotExists: boolean = true
	supportsMultipleConnections: boolean = true
	supportsTransactionalDdl: boolean = false // TODO - true when transactions supported
	supportsReturning: boolean = true
	supportsOutput: boolean = false

	acquireMigrationLock(
		_db: Kysely<unknown>,
		_options: MigrationLockOptions,
	): Promise<void> {
		throw new Error('Method not implemented.')
	}

	releaseMigrationLock(
		_db: Kysely<unknown>,
		_options: MigrationLockOptions,
	): Promise<void> {
		throw new Error('Method not implemented.')
	}
}
