import { getMigrationConfig } from './test/env'
import { migrate } from './test/migrate'

export default async function setup(): Promise<void> {
	const config = getMigrationConfig()
	await migrate(config)
}
