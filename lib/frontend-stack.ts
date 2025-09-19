import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import path from 'path';

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');

    // 建立 S3 bucket
    const siteBucket = new s3.Bucket(this, 'TodoFrontendBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: false, // 不直接公開，透過 CloudFront
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
      ],
      resources: [
        siteBucket.arnForObjects('*'),
      ],
      principals: [
        new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId),
      ]
    }));

    // 建立 CloudFront
    const distribution = new cloudfront.Distribution(this, 'TodoFrontendDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        // origin: new origins.S3StaticWebsiteOrigin(siteBucket),
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(siteBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        },
      ],
    });

    // 部署 React build 檔案到 S3
    new s3deploy.BucketDeployment(this, 'DeployReactApp', {
      sources: [s3deploy.Source.asset(path.resolve(__dirname, '../clients/build'))], // React build 輸出資料夾
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.domainName,
    });
  }
}
