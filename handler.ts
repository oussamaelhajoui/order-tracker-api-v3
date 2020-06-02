import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

import * as AWS from 'aws-sdk'
import { v4 as uuid } from 'uuid';
import { response, sortByDate, validationFailed } from "./utility";
import { RequestBody, Stage } from "./models/requestBody";


const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: 'eu-west-2' });
const ordersTable = process.env.ORDERS_TABLE;

export const api: APIGatewayProxyHandler = async (event, _context) => {
  let body;
  let returnHandler = null;
  const statusCode = 200;
  const successMessage = 'Operation succeeded';
  const failedMessage = 'Operation failed';
  const reqBody: RequestBody = JSON.parse(event.body);
  const headers = {
    'Content-Type': 'application/json',
  };
  console.log('hello we got a hit!')

  try {
    let paramId;
    switch (event.httpMethod) {
      case 'DELETE':
        paramId = event.pathParameters.id;
        body = await db.delete({ TableName: ordersTable, Key: { id: paramId } })
          .promise()
          .then(res => {
            console.log(res);
            return response(statusCode, successMessage, event)
          })
          .catch(err => {
            console.log(err);
            returnHandler = response(statusCode, `${failedMessage}: ${err}`, event);
          })
        break;
      case 'GET':
        if (event.resource === '/v1/orders') {
          body = await db
            .scan({ TableName: ordersTable })
            .promise()
            .then(res => {
              console.log(res);
              returnHandler = response(statusCode, successMessage + ": " + uuid(), event, res.Items.sort(sortByDate))
            })
            .catch(err => {
              console.log(err);
              returnHandler = response(statusCode, `${failedMessage}: ${err}`, event);
            })
          break;
        }
        paramId = event.pathParameters.type;
        if (!paramId) { break; }
        body = await db
          .scan({
            TableName: ordersTable, ScanFilter: {
              "stage": {
                "AttributeValueList": [{ "S": paramId }],
                "ComparisonOperator": "EQ"
              }
            }
          })
          .promise()
          .then(res => {
            console.log(res);
            returnHandler = response(statusCode, successMessage + ": " + uuid(), event, res.Items)
          })
          .catch(err => {
            console.log(err);
            returnHandler = response(statusCode, `${failedMessage}: ${err}`, event);
          })
        break;
      case 'POST':
        if (validationFailed(reqBody)) { return response(400, 'Missing fields to process request', event) }
        reqBody.id = uuid();
        reqBody.changeLog.push({ "currentStage": Stage.ToShip, "eventDate": new Date(), "ip": event.multiValueHeaders['X-Forwarded-For'][0] });
        body = await db.put({ TableName: ordersTable, Item: reqBody })
          .promise()
          .then(() => {
            returnHandler = response(statusCode, successMessage, reqBody)

          })
        break;
      case 'PUT':
        paramId = event.pathParameters.id;
        reqBody.changeLog.push({ "currentStage": reqBody.stage, "eventDate": new Date(), "ip": event.multiValueHeaders['X-Forwarded-For'][0] })
        const params = {
          Key: {
            id: paramId
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
          orderDate = :orderDate,
          stage = :stage, 
          changeLog = :changeLog`,

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
            ':stage': reqBody.stage,
            ':changeLog': reqBody.changeLog,
          },
          ReturnValues: 'ALL_NEW'
        };
        console.log('Updating', "id: " + paramId, params);
        body = await db.update(params)
          .promise()
          .then((res) => {
            console.log(res);
            returnHandler = response(200, successMessage, event, res.Attributes);
          })
          .catch((err) => {
            console.log(err);
            returnHandler = response(400, failedMessage, event, err)
          });
        break;
      default:
        throw new Error(`Unsupported method "${event.httpMethod}"`);
    }
  } catch (err) {
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }
  if (returnHandler !== null) return returnHandler
  return {
    statusCode,
    body,
    headers,
  };

}

