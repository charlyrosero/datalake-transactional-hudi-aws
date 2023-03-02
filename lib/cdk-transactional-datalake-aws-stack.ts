import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkTransactionalDatalakeAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    // 👇 create the VPC
    const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'isolated-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    // 👇 create a security group for the EC2 instance
    const ec2InstanceSG = new ec2.SecurityGroup(this, 'ec2-instance-sg', {
      vpc,
    });

    //SSH connections from anywhere

    ec2InstanceSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH connections from anywhere',
    );

    // 👇 create the EC2 instance Bastion
    const ec2Instance = new ec2.Instance(this, 'ec2-instance', {
      vpc,
      instanceName:'bastion-Mysql',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: ec2InstanceSG,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: 'ec2-key-pair',
    });
     
    const cluster = new rds.DatabaseCluster(this, 'Database', {
    engine: rds.DatabaseClusterEngine.auroraMysql({ version: rds.AuroraMysqlEngineVersion.VER_2_09_0}),    
    credentials: rds.Credentials.fromGeneratedSecret('clusteradmin'),
    clusterIdentifier: 'AuroraMysql-NaturalComerce',
    instanceProps: {
        // optional , defaults to t3.medium
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        vpc,        
      },
    });
    
    cluster.connections.allowFrom(ec2Instance, ec2.Port.tcp(3306));

   
   //raw layer    
   const s3Bucketraw = new s3.Bucket(this, 'datalakehouse-raw', {
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    bucketName: `datalakehouse-raw-${this.account}`,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  });

  //stage layer    
  const s3Bucketstage = new s3.Bucket(this, 'datalakehouse-stage', {
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    bucketName: `datalakehouse-stage-${this.account}`,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  });

    //s3Bucket.grantRead(new iam.AccountRootPrincipal());
  }
}
  









