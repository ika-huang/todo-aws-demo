// lambda/utils/response.ts
import { z } from 'zod';
export const corsHeaders = (origin = '*') => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
});

// export const lambdaResponse = ({
//   statusCode = 200,
//   origin = '*',
//   body = {},
// }: {
//   statusCode?: number,
//   origin?: string,
//   body: unknown
// }) => ({
//   statusCode: statusCode,
//   headers: corsHeaders(origin),
//   body: JSON.stringify(body),
// });

export class lambdaResponse {
  constructor() {}

  public response(body: unknown, statusCode: number = 200) {
    return {
      statusCode,
      headers: corsHeaders('*'),
      body: JSON.stringify(body),
    };
  };

  public errorResponse(error: unknown = 'some error happened', statusCode: number = 500) {
    switch (true) {
      case error instanceof z.ZodError:
        return {
          statusCode: 422,
          body: JSON.stringify({
            message: error.issues,
          }),
        };
      case error instanceof Error:
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: error.message,
          }),
        };
      default:
        return {
          statusCode: statusCode,
          body: JSON.stringify({
            message: error,
          }),
        };
    };
  };
};

// export const error = (status: number, message: any, origin = '*') => ({
//   statusCode: status,
//   headers: corsHeaders(origin),
//   body: JSON.stringify({ message }),
// });

// export function lambdaErrorResponse (error: unknown) {
//   switch (true) {
//     case error instanceof z.ZodError:
//       return {
//         statusCode: 422,
//         body: JSON.stringify({
//           message: error.issues,
//         }),
//       };
//     case error instanceof Error:
//       return {
//         statusCode: 500,
//         body: JSON.stringify({
//           message: error.message,
//         }),
//       };
//     default:
//       return {
//         statusCode: 500,
//         body: JSON.stringify({
//           message: 'some error happened',
//         }),
//       };
//   }
// };

export function validateErrorMessage (error: z.ZodError) {
  return {
    statusCode: 422,
    body: JSON.stringify({
      message: error.issues,
    }),
  };
};
