import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayEvent } from 'aws-lambda';

const client = new CognitoIdentityProviderClient({});

export async function main(event: APIGatewayEvent) {
  const body = JSON.parse(event.body || '{}');

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.CLIENT_ID,
    AuthParameters: {
      USERNAME: body.email,
      PASSWORD: body.password,
    },
  });

  try {
    const res = await client.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({
        token: res.AuthenticationResult?.IdToken,
      }),
    };
  } catch (err: unknown) {
    return { statusCode: 500, body: JSON.stringify({ message: err instanceof Error ? err.message : 'some error happened' }) };
  }
}
