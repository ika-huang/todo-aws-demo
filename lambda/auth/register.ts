import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayEvent } from 'aws-lambda';

const client = new CognitoIdentityProviderClient({});

export async function main(event: APIGatewayEvent) {
  try {
    const body = JSON.parse(event.body || '{}');
    const command = new SignUpCommand({
      ClientId: process.env.CLIENT_ID,
      Username: body.email,
      Password: body.password,
      UserAttributes: [{ Name: 'email', Value: body.email }],
    });
    const result = await client.send(command);
    await client.send(new AdminConfirmSignUpCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: body.email,
    }));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User registered', data: result }),
    };
  } catch (err: unknown) {
    return { statusCode: 500, body: JSON.stringify({ message: err instanceof Error ? err.message : 'some error happened' }) };
  }
}
