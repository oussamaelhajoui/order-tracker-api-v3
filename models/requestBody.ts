export class RequestBody {
  id?: string;
  klantnaam?: string;
  product?: string;
  aantal?: number;
  prijs?: string;
  straat?: string;
  postcode?: string;
  stad?: string;
  land?: string;
  orderDate?: Date;
  stage?: Stage
  changeLog?: changeLog[]
}

export class changeLog {
  currentStage: Stage;
  eventDate: Date;
  ip: string
}

export enum Stage {
  toAccept,
  toProcess,
  ToShip,
  shipped
}