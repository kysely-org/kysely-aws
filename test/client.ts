import { RDSDataClient } from '@aws-sdk/client-rds-data'

/**
 * Creates the `RDSDataClient` used by the tests.
 *
 * When `AWS_ENDPOINT_URL` is set (i.e. we're running against a local emulator
 * such as Floci), `resultSetOptions` is stripped from `ExecuteStatement` input
 * since Floci rejects it. The dialect only ever sends the AWS defaults
 * (`decimalReturnType: 'STRING'`, `longReturnType: 'LONG'`), so dropping it
 * doesn't change behaviour.
 */
export function createTestClient(region: string): RDSDataClient {
	const client = new RDSDataClient({ region })

	if (process.env.AWS_ENDPOINT_URL) {
		client.middlewareStack.add(
			(next) => async (args) => {
				const input = args.input as Record<string, unknown>
				delete input.resultSetOptions
				return next(args)
			},
			{ step: 'initialize', name: 'stripResultSetOptionsForLocalEmulator' },
		)
	}

	return client
}
