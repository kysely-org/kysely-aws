import { App } from 'aws-cdk-lib'
import { TestStack } from './stack'

const account = process.env.CDK_DEPLOY_ACCOUNT
const region = process.env.CDK_DEPLOY_REGION

if (!account || !region) {
	throw new Error(
		'CDK_DEPLOY_ACCOUNT and CDK_DEPLOY_REGION must be set. Export them in your shell or add them to a .env.local file in the project root.',
	)
}

const app = new App()
new TestStack(app, 'KyselyAwsTest', {
	env: { account, region },
	description: 'Test infrastructure for @kysely-org/aws',
})
