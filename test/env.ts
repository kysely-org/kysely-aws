import { config } from 'dotenv'

config({ path: '.env.local' })

export interface MigrationConfig {
	clusterArn: string
	secretArn: string
	databaseName: string
	region: string
}

export function getMigrationConfig(): MigrationConfig {
	const clusterArn = process.env.RDS_PG_CLUSTER_ARN
	const secretArn = process.env.RDS_PG_MASTER_SECRET_ARN
	const databaseName = process.env.RDS_PG_DB_NAME
	const region = process.env.CDK_DEPLOY_REGION

	if (!clusterArn || !secretArn || !databaseName || !region) {
		throw new Error(
			'Missing required environment variables for test migrations. ' +
				'Ensure RDS_PG_CLUSTER_ARN, RDS_PG_MASTER_SECRET_ARN, RDS_PG_DB_NAME, ' +
				'and CDK_DEPLOY_REGION are set in .env.local or the environment.',
		)
	}

	return { clusterArn, secretArn, databaseName, region }
}
