[![NPM Version](https://img.shields.io/npm/v/@kysely-org/aws?style=flat&label=latest)](https://github.com/kysely-org/kysely-aws/releases/latest)
[![Socket Badge](https://badge.socket.dev/npm/package/@kysely-org/aws/0.0.0)](https://socket.dev/npm/package/@kysely-org/aws/overview/0.0.0)
[![Tests](https://github.com/kysely-org/kysely-aws/actions/workflows/test.yml/badge.svg)](https://github.com/kysely-org/kysely-aws)
[![License](https://img.shields.io/github/license/kysely-org/kysely-aws?style=flat)](https://github.com/kysely-org/kysely-aws/blob/main/LICENSE)
[![Issues](https://img.shields.io/github/issues-closed/kysely-org/kysely-aws?logo=github)](https://github.com/kysely-org/kysely-aws/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc)
[![Pull Requests](https://img.shields.io/github/issues-pr-closed/kysely-org/kysely-aws?label=PRs&logo=github&style=flat)](https://github.com/kysely-org/kysely-aws/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc)
![GitHub contributors](https://img.shields.io/github/contributors/kysely-org/kysely-aws)
[![NPM Downloads](https://img.shields.io/npm/dw/@kysely-org/aws?logo=npm)](https://www.npmjs.com/package/@kysely-org/aws)
[![JSR Downloads](https://jsr.io/badges/@kysely/aws/weekly-downloads)](https://jsr.io/@kysely/aws)
[![JSR Score](https://jsr.io/badges/@kysely/aws/score)](https://jsr.io/@kysely/aws)

###### Join the discussion ⠀⠀⠀⠀⠀⠀⠀

[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=flat&logo=discord&logoColor=white)](https://discord.gg/xyBJ3GwvAm)
[![Bluesky](https://img.shields.io/badge/Bluesky-0285FF?style=flat&logo=Bluesky&logoColor=white)](https://bsky.app/profile/kysely.dev)

# Kysely for AWS

**THIS IS NOT AN OFFICIAL AWS OR AMAZON WEB SERVICES PROJECT.**

This MIT-licensed open-source project is maintained by the Kysely organization in
good faith to provide an integration between Kysely — the TypeScript query builder —
and AWS-exclusive data services and APIs that accept SQL queries.

AWS and Amazon Web Services are trademarks of Amazon.com, Inc. or its affiliates.
Use of these names is nominative, solely to describe compatibility, and does not
imply any affiliation with, sponsorship by, or endorsement from Amazon.com, Inc.
or its affiliates.

# All contributors

<p align="center">
    <a href="https://github.com/kysely-org/kysely-aws/graphs/contributors">
        <img src="https://contrib.rocks/image?repo=kysely-org/kysely-aws" />
    </a>
    </br>
    <span>Want to contribute? Check out our <a href="./CONTRIBUTING.md" >contribution guidelines</a>.</span>
</p>

# Current limitations

This is in very early development. Current target delivery is a Postgres RDS Data API dialect with MySQL to follow soon after.

The Postgres RDS Data API Dialect has the following known limitations:

- No support for transactions
- Only supports string, integer and null types
- No support for kysely migrations
- Generic "Not implemented" errors across unimplemented and unsupported features
- Savepoints

What it does support today:

- Basic DML
- Custom type mapping
- Custom RDS Data API client factory function
