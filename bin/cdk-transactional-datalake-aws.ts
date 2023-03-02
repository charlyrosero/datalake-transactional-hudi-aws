#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkTransactionalDatalakeAwsStack } from '../lib/cdk-transactional-datalake-aws-stack';

const app = new cdk.App();
new CdkTransactionalDatalakeAwsStack(app, 'CdkTransactionalDatalakeAwsStack');