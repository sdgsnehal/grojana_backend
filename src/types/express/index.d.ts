import { IUser } from "../../models/user.model"; // adjust the path to your IUser type

declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
  }
}
