import type { DialectAdapter, Kysely, MigrationLockOptions } from 'kysely'

export class RDSDataAPIDialectAdapter implements DialectAdapter {
	supportsCreateIfNotExists?: boolean | undefined
	supportsMultipleConnections?: boolean | undefined
	supportsTransactionalDdl?: boolean | undefined
	supportsReturning?: boolean | undefined
	supportsOutput?: boolean | undefined

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
