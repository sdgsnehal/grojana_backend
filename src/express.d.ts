import { IUser } from "./models/user.model"; // adjust the path to your IUser type

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
export {};
