import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayEvent } from 'aws-lambda';
import {
  registerInput,
  registerSchema,
} from '../schemas/auth';
import { lambdaResponse } from '../utils/response';

const client = new CognitoIdentityProviderClient({});
const {
  response,
  errorResponse,
} = new lambdaResponse();

export async function main(event: APIGatewayEvent) {
  try {
    // const body = JSON.parse(event.body || '{}');
    const body: registerInput = registerSchema.parse(JSON.parse(event.body || '{}'));
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
    return response({ message: 'User registered', data: result });
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
