import { DialectAdapterBase } from 'kysely'

export class RDSDataAPIDialectAdapter extends DialectAdapterBase {
	override get supportsCreateIfNotExists(): boolean {
		return true
	}

	override get supportsMultipleConnections(): boolean {
		return true
	}

	override get supportsTransactionalDdl(): boolean {
		// TODO - true when transactions supported
		return false
	}

	override get supportsReturning(): boolean {
		return true
	}

	override get supportsOutput(): boolean {
		return false
	}

	override acquireMigrationLock(): Promise<void> {
		throw new Error('Migrations not supported.')
	}

	override releaseMigrationLock(): Promise<void> {
		throw new Error('Migrations not supported.')
	}
}
