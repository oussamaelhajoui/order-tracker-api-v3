import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

import * as AWS from 'aws-sdk'
import { v4 as uuid } from 'uuid';
import { response, sortByDate } from "./utility";


const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: 'eu-west-2' });
const ordersTable = process.env.ORDERS_TABLE;

export const api: APIGatewayProxyHandler = async (event, _context) => {
  let body;
  let statusCode = 200;
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    switch (event.httpMethod) {
      case 'DELETE':
        body = await db.delete(JSON.parse(event.body)).promise();
        break;
      case 'GET':
        body = await db
          .scan({ TableName: ordersTable })
          .promise()
          .then(res => {
            return response(statusCode, res.Items.sort(sortByDate))
          });
        break;
      case 'POST':
        body = await db.put(JSON.parse(event.body)).promise();
        break;
      case 'PUT':
        body = await db.update(JSON.parse(event.body)).promise();
        break;
      default:
        throw new Error(`Unsupported method "${event.httpMethod}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };

}



// return {
//   statusCode: 200,
//   body: JSON.stringify({
//     message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
//     input: event,
//   }, null, 2),
// };