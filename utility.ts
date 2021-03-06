import { RequestBody } from "./models/requestBody";

export const response = (internalStatusCode, message, event, items: {} = {}) => {
  return {

    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      statusCode: internalStatusCode,
      message: message,
      items: items,
      event: event
    })
  };
}

export const sortByDate = (a, b) => {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}

export const validationFailed = (body: RequestBody, ) => {
  if (
    !body.klantnaam ||
    body.klantnaam.trim() === '' ||

    !body.product ||
    body.product.trim() === '' ||

    !body.aantal ||
    body.aantal < 0 ||

    !body.prijs ||
    body.prijs.trim() === '' ||

    !body.straat ||
    body.straat.trim() === '' ||

    !body.postcode ||
    body.postcode.trim() === '' ||

    !body.stad ||
    body.stad.trim() === '' ||

    !body.land ||
    body.land.trim() === ''
  ) {
    return true;
  }
  return false;
}