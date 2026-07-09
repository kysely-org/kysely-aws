import {
	CfnOutput,
	Duration,
	RemovalPolicy,
	Stack,
	type StackProps,
} from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import {
	AuroraPostgresEngineVersion,
	ClusterInstance,
	DatabaseCluster,
	DatabaseClusterEngine,
} from 'aws-cdk-lib/aws-rds'

const dbName = 'kyselytest'

export class TestStack extends Stack {
	constructor(scope: Construct, id: string, props: StackProps) {
		super(scope, id, props)

		const vpc = Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true })
		const postgres = new DatabaseCluster(this, 'Cluster', {
			engine: DatabaseClusterEngine.auroraPostgres({
				version: AuroraPostgresEngineVersion.VER_17_7,
			}),
			manageMasterUserPassword: true,
			defaultDatabaseName: dbName,
			enableDataApi: true,
			serverlessV2MinCapacity: 0,
			serverlessV2MaxCapacity: 1,
			writer: ClusterInstance.serverlessV2('Writer', {
				publiclyAccessible: false,
			}),
			vpc: vpc,
			vpcSubnets: { subnetType: SubnetType.PUBLIC },
			removalPolicy: RemovalPolicy.DESTROY,
			backup: { retention: Duration.days(1) },
		})

		if (!postgres.secret?.secretArn) {
			throw new Error('Postgres Cluster did not produce a secret')
		}

		new CfnOutput(this, 'PostgresClusterArn', {
			value: postgres.clusterArn,
			description: 'Aurora Postgres cluster arn',
		})
		new CfnOutput(this, 'PostgresMasterSecretArn', {
			value: postgres.secret.secretArn,
			description: 'Master user credentials for Postgres cluster',
		})

		new CfnOutput(this, 'DbName', {
			value: dbName,
			description: 'Aurora db name',
		})
	}
}
