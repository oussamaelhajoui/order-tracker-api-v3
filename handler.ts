import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

import * as AWS from 'aws-sdk'
import { v4 as uuid } from 'uuid';
import { response, sortByDate, validationFailed } from "./utility";
import { RequestBody } from "./models/requestBody";


const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: 'eu-west-2' });
const ordersTable = process.env.ORDERS_TABLE;

export const api: APIGatewayProxyHandler = async (event, _context) => {
  let body;
  const statusCode = 200;
  const successMessage = 'Operation succeeded';
  const failedMessage = 'Operation failed';
  const reqBody: RequestBody = JSON.parse(event.body);
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    switch (event.httpMethod) {
      case 'DELETE':
        return body = await db.delete({ TableName: ordersTable, Key: { id: reqBody.id } })
          .promise()
          .then(res => {
            console.log(res);
            return response(statusCode, successMessage, res)
          })
          .catch(err => {
            console.log(err);
            return response(statusCode, `${failedMessage}: ${err}`);
          })
        break;
      case 'GET':
        return body = await db
          .scan({ TableName: ordersTable })
          .promise()
          .then(res => {
            console.log(res);
            return response(statusCode, successMessage, res.Items.sort(sortByDate))
          })
          .catch(err => {
            console.log(err);
            return response(statusCode, `${failedMessage}: ${err}`);
          })
        break;
      case 'POST':
        if (validationFailed(reqBody)) { return response(400, 'Missing fields to process request') }
        reqBody.id = uuid();
        return body = await db.put({ TableName: ordersTable, Item: reqBody })
          .promise()
          .then(() => {
            return response(statusCode, successMessage, reqBody)

          })
        break;
      case 'PUT':
        const id = event.pathParameters.id;
        const params = {
          Key: {
            id: id
          },
          TableName: ordersTable,
          ConditionExpression: 'attribute_exists(id)',
          UpdateExpression: `SET 
          klantnaam = :klantnaam, 
          product = :product, 
          aantal = :aantal, 
          prijs = :prijs, 
          straat = :straat, 
          postcode = :postcode, 
          stad = :stad, 
          land = :land, 
          orderDate = :orderDate`,
          ExpressionAttributeValues: {
            ':klantnaam': reqBody.klantnaam,
            ':product': reqBody.product,
            ':aantal': reqBody.aantal,
            ':prijs': reqBody.prijs,
            ':straat': reqBody.straat,
            ':postcode': reqBody.postcode,
            ':stad': reqBody.stad,
            ':land': reqBody.land,
            ':orderDate': reqBody.orderDate,
          },
          ReturnValues: 'ALL_NEW'
        };
        console.log('Updating', "id: " + id, params);
        return body = await db.update(JSON.parse(event.body))
          .promise()
          .then((res) => {
            console.log(res);
            return response(200, successMessage, res.Attributes);
          })
          .catch((err) => response(200, failedMessage, err));
        break;
      default:
        throw new Error(`Unsupported method "${event.httpMethod}"`);
    }
  } catch (err) {
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